import ApiError from '@/helper/ApiError';
import { AirtimeServices } from '@/services/AirtimeServices';
import httpStatus from 'http-status';
import { Transaction } from '@/models/transaction.model';
import { FlutterWaveService } from './../helper/third-party/flutter-wave';
import { AIRTIME_LIMIT } from '@/config';
import { generateRandomString } from './../helper/index';
import { Wallet } from '@/models/wallet.model';
import { UserIdentity } from '@/models/user_identity.model';
import { STATUS } from '@/config/constants';

export class AirtimeController {
  private airtimeService: AirtimeServices;
  private flutterWaveService: FlutterWaveService;

  constructor() {
    this.airtimeService = new AirtimeServices();
    this.flutterWaveService = new FlutterWaveService();
  }

  initiateAirtime = async (req: any, res: any, next: any) => {
    try {
      const { user } = req;
      const {
        amount,
        customerID,
        billerName,
        billerCode,
        itemCode,
        save,
        name,
        type,
      } = req.body;
      let beneficiaries = null;
      if (save) {
        beneficiaries = await this.airtimeService.saveBeneficiary({
          user_id: user._id,
          phoneNumber: customerID,
          network: itemCode,
          name: req.body.name || name,
          type: type || 'airtime',
        });
      }
      // verify number and biller with flutter wave
      const verifyNumber = await this.flutterWaveService.verifyNumber({
        customer: customerID,
        code: billerCode,
        item_code: itemCode,
      });
      if (!verifyNumber) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid number Provided');
      }
      // check flutterwave balance
      // check flutterwave balance
      const balance = await this.flutterWaveService.getBalance();
      const flutterBalance = balance.data[0].available_balance;

      if (flutterBalance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Try again later...');
      }

      // check and debit the user's wallet and lock funds
      const wallet = await this.airtimeService.debitAndLockFund(user, amount);

      // save transaction
      const transaction = await this.airtimeService.saveToTransaction({
        wallet_id: wallet.wallet_id,
        settlement_amount: amount,
        description: STATUS.pending,
        currency: 'NGN',
        payment_type: billerName,
        payment_method: 'wallet-mart',
        phone_number: verifyNumber.customer,
        status: 'pending',
        type: type || 'bills-payment',
      });

      // send airtime OTP
      let OTPMessage = null;
      if (transaction) {
        transaction.debitEmail({ user, amount, wallet });
        transaction.sendTWOFACode({ user });
        if (
          user.account_type === 'individual' &&
          user.pin_trans_auth !== true
        ) {
          transaction.sendTWOFACode({ user });
          OTPMessage = 'OTP sent to your email';
        }
      }

      const savedBeneficiaries = beneficiaries ? 'beneficiary Saved' : null;
      res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: OTPMessage || 'Enter your PIN to complete the transaction!',
        aboutBeneficiary: savedBeneficiaries,
        data: {
          transaction: {
            trans_ref: transaction.trans_ref,
            amount,
          },
        },
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };

  verifyTransaction = async (req: any, res: any, next: any) => {
    try {
      const { transactionReference, twoFA } = req.body;
      const { user } = req;

      const transaction = await Transaction.findOne({
        trans_ref: transactionReference,
      });
      // verify OTP
      const userPin = await UserIdentity.findOne({ user_id: user._id });
      if (!user.pin_trans_auth) {
        if (!userPin.validPin(twoFA)) {
          throw new ApiError(
            httpStatus.UNPROCESSABLE_ENTITY,
            'invalid Pin provided!',
          );
        }
      } else {
        if (transaction && transaction.two_fa_code !== twoFA) {
          throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'invalid otp!');
        }
      }

      if (transaction.status !== 'pending') {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Transaction already completed',
        );
      }
      // make call to fluter wave to verify transaction
      const data = {
        country: 'NG',
        recurrence: 'ONCE',
        customer: transaction.phone_number,
        amount: transaction.settlement_amount,
        type: transaction.payment_type,
        reference: transaction.trans_ref,
      };

      const payment = await this.flutterWaveService.makePayment(data);

      if (payment.status == 'error') {
        // reverse funds and send a reverse mail
        const wallet = await Wallet.findOne({
          wallet_id: transaction.wallet_id,
        });
        
        wallet.available_balance = String(
          Number(wallet.available_balance) +
          wallet.currencyToKoboUnit(transaction.settlement_amount)
        );
        wallet.locked_fund = String(
          Number(wallet.locked_fund) -
          wallet.currencyToKoboUnit(transaction.settlement_amount)
        );
        await wallet.save();
        transaction.reversalEmail({
          user,
          amount: transaction.settlement_amount,
          wallet,
        });
        transaction.payload = JSON.stringify(payment.data);
        transaction.status = STATUS.failed;
        transaction.description = 'mart_payment_canceled';
        await transaction.save();
        // make reversal transaction
        const trx = new Transaction();
        trx.wallet_id = wallet.wallet_id;
        trx.amount_paid = transaction.settlement_amount;
        trx.fee = '0';
        trx.settlement_amount = transaction.settlement_amount;
        trx.status = 'completed';
        trx.description = `mart_payment_reversal`;
        trx.reciever = wallet.wallet_id;
        trx.currency = 'NGN';
        trx.payment_method = 'wallet-wallet';
        trx.payment_type = 'credit';
        trx.generateTransactionReference(10);
        trx.generatePaymentReference(10);
        trx.two_fa_code_verify = true;
        await trx.save();
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          'Error from third party reach out to the backend Team',
        );
      }

      if (payment.status == 'pending') {
        // update transaction status to retry
        transaction.status = 'mart_payment_pending';
        transaction.trans_ref = payment.data.reference;
        transaction.payload = JSON.stringify(payment.data);
        await transaction.save();
        // send pending

        res.status().json({
          code: httpStatus.pending,
          message: 'Transaction is Pending from third party',
          data: payment.data,
        });
      }

      // update transaction status
      if (payment.status === 'success') {
        // on success add funds to company wallet
        transaction.status = STATUS.partyFinished;
        await transaction.save();

        // this credit taxtech wallet account
        const taxtechWallet = await this.airtimeService.sendFundToCompanyWallet(
          {
            user,
            amount_paid: transaction.settlement_amount,
            tran_ref: transaction.trans_ref,
            type: transaction.type,
          },
        );

        if (taxtechWallet) {
          transaction.status = STATUS.completed;
          transaction.trans_ref = payment.data.reference;
          transaction.payload = JSON.stringify(payment.data);
          await transaction.save();
        }
      }

      return res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: 'Data payment successful',
        trans_ref: transaction.trans_ref,
        data: payment.data,
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };

  getCategory = async (req: any, res: any, next: any) => {
    try {
      const { category } = req.query;
      const categories = await this.flutterWaveService.getBillsCategory(
        category,
      );

      res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: 'Beneficiaries retrieved successfully',
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };

  /**
   * Get all bills Categories
   *
   * @route GET /api/v1/airtime/bills/categories
   * @param {any} req
   * @param {any} res
   * @param { any } next
   * @group Airtime
   * @returns {object} 200 - An array of bills categories
   * @memberOf AirtimeController
   */
  getBillsCategories = async (req: any, res: any, next: any) => {
    try {
      const categories = await this.flutterWaveService.getAllBillsCategory();
      res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: 'Bills categories retrieved successfully',
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };

  // payment for for all bills
  billPayment = async (req: any, res: any, next: any) => {
    try {
      const { user } = req;
      const {
        amount,
        customerID,
        billerName,
        billerCode,
        itemCode,
        save,
        name,
        type,
      } = req.body;

      if (amount < 100 && type === 'airtime') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be 100 upward');
      }

      // validate number
      const verifyNumber = await this.flutterWaveService.verifyNumber({
        customer: customerID,
        code: billerCode,
        item_code: itemCode,
      });

      if (!verifyNumber) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid number Provided');
      }

      // check flutterwave balance
      const balance = await this.flutterWaveService.getBalance();
      const flutterBalance = balance.data[0].available_balance;

      if (flutterBalance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Try again later...');
      }

      let beneficiaries = null;
      if (save) {
        beneficiaries = await this.airtimeService.saveBeneficiary({
          user_id: user._id,
          phoneNumber: customerID,
          network: itemCode,
          name: req.body.name || name,
          type: type || 'airtime',
        });
      }

      // debit and lock funds
      const wallet = await this.airtimeService.debitAndLockFund(user, amount);

      // store transaction
      const transaction = await this.airtimeService.saveToTransaction({
        wallet_id: wallet.wallet_id,
        settlement_amount: amount,
        description: STATUS.pending,
        currency: 'NGN',
        payment_type: billerName,
        payment_method: 'wallet-mart',
        phone_number: verifyNumber.customer,
        type: type || 'bills-payment',
      });

      // send debit mail to user
      transaction.debitEmail({ user, amount, wallet });

      // make payment
      const data = {
        country: 'NG',
        customer: transaction.phone_number,
        amount: transaction.settlement_amount,
        type: transaction.payment_type,
        reference: transaction.trans_ref,
        recurrence: 'ONCE',
      };
      // make flutterwave payment
      const payment = await this.flutterWaveService.makePayment(data);

      if (payment.status == 'error') {
        // reverse funds and send a reverse mail
        wallet.available_balance = (
          Number(wallet.available_balance) + wallet.currencyToKoboUnit(amount)
        ).toString();
        wallet.locked_fund = (Number(wallet.locked_fund) - wallet.currencyToKoboUnit(amount)).toString();
        await wallet.save();

        transaction.reversalEmail({ user, amount, wallet });
        transaction.payload = JSON.stringify(payment.data);
        transaction.status = STATUS.failed;
        transaction.description = 'mart_payment_canceled';
        await transaction.save();
        // make reversal transaction
        const trx = new Transaction();
        trx.wallet_id = wallet.wallet_id;
        trx.amount_paid = amount;
        trx.fee = '0';
        trx.settlement_amount = amount;
        trx.status = 'completed';
        trx.description = `mart_payment_reversal`;
        trx.reciever = wallet.wallet_id;
        trx.currency = 'NGN';
        trx.payment_method = 'wallet-wallet';
        trx.payment_type = 'credit';
        trx.generateTransactionReference(10);
        trx.generatePaymentReference(10);
        trx.two_fa_code_verify = true;
        await trx.save();
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          'Error from third party reach out to the backend Team',
        );
      }

      if (payment.status == 'pending') {
        transaction.status = 'mart_payment_pending';
        transaction.trans_ref = payment.data.reference;
        transaction.payload = JSON.stringify(payment.data);
        await transaction.save();
      }

      if (payment.status == 'success') {
        // on success add funds to company wallet
        transaction.status = STATUS.partyFinished;
        await transaction.save();

        // this credit taxtech wallet account
        const taxtechWallet = await this.airtimeService.sendFundToCompanyWallet(
          {
            user: user,
            amount_paid: amount,
            tran_ref: transaction.trans_ref,
            type,
          },
        );

        if (taxtechWallet) {
          transaction.status = STATUS.completed;
          transaction.trans_ref = payment.data.reference;
          transaction.payload = JSON.stringify(payment.data);
          await transaction.save();
        }
      }

      const savedBeneficiaries = beneficiaries ? 'beneficiary Saved' : null;
      res.status(httpStatus.OK).json({
        message: 'Data payment successful',
        aboutBeneficiary: savedBeneficiaries,
        trans_ref: transaction.trans_ref,
        data: payment.data,
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };

  getWalletBalance = async (req: any, res: any, next: any) => {
    try {
      const balance = await this.flutterWaveService.getBalance();
      const available_balance = balance.data[0].available_balance;

      res.status(httpStatus.OK).json({
        message: 'Wallet Balance',
        data: available_balance,
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };
}
