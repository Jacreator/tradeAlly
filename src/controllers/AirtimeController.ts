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
      const { amount, customerID, save, itemCode, code, billerName } =
        req.body;
      let beneficiaries = null;
      if (save) {
        beneficiaries = await this.airtimeService.saveBeneficiary({
          user_id: user._id,
          phoneNumber: customerID,
          network: itemCode,
          name: req.body.name,
        });
      }
      // verify number and biller with flutter wave
      const verifyNumber = await this.flutterWaveService.verifyNumber({
        customer: customerID,
        code,
        item_code: itemCode,
      });
      // console.log(verifyNumber);
      if (!verifyNumber) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid number Provided');
      }
      // check and debit the user's wallet and lock funds
      const wallet = await this.airtimeService.debitAndLockFund(user, amount);

      // save transaction
      const transaction = await this.airtimeService.saveToTransaction({
        wallet_id: wallet._id,
        settlement_amount: amount,
        description: 'Airtime',
        currency: 'NGN',
        payment_type: billerName,
        payment_method: 'wallet',
        status: 'pending',
        phone_number: verifyNumber.customer,
      });

      // send airtime OTP
      let OTPMessage = null;
      if (transaction) {
        await transaction.debitEmail({ user, amount });
        if (user.account_type === 'individual' && user.pin_trans_auth !== true) {
          await transaction.sendTWOFACode({ user });
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
    }
  };

  verifyTransaction = async (req: any, res: any, next: any) => {
    try {
      const { transactionReference, twoFA } = req.body;
      const user = req;

      const transaction = await Transaction.findOne({
        trans_ref: transactionReference,
      });
      // verify OTP
      const userPin = await UserIdentity.findOne({ user_id: user._id });
      if (!user.pin_trans_auth) {
        if (transaction && transaction.two_fa_code !== twoFA) {
          throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'invalid otp!');
        }
      } else {
        if (!userPin.validPin(twoFA)) {
          throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'invalid Pin provided!');
        }
      }

      if (transaction.status === 'pending') {
        // make call to fluter wave to verify transaction
        const data = {
          country: 'NG',
          recurrence: 'ONCE',
          customer: transaction.phone_number,
          amount: transaction.settlement_amount,
          type: transaction.payment_type,
          reference: transaction.trans_ref
        };

        const payment = await this.flutterWaveService.makePayment(data);

        if (payment.status == 'pending') {
          // update transaction status to retry
          transaction.status = 'retry';
          transaction.pay_ref = payment.data.tx_ref;
          transaction.save();
          // send pending

          res.status().json({
            code: httpStatus.pending,
            message: 'Transaction is Pending from third party',
            data: payment.data,
          });
        }

        // update transaction status
        if (payment.status === 'success') {
          // debit transaction wallet to taxaide wallet
          const userWallet = await this.airtimeService.sendFundToCompanyWallet({
            amount_paid: transaction.settlement_amount,
            tran_ref: transaction.trans_ref,
            user: user,
          });
          // unlock funds
          transaction.status = 'paid';
          res.status(httpStatus.OK).json({
            code: httpStatus.OK,
            message: 'Transaction verified successfully',
            data: payment.data,
          });
        } else {
          // reverse funds and send a reverse mail
          const wallet = await Wallet.findOne({
            user_id: user._id
          });

          wallet.available_balance = wallet.available_balance + transaction.settlement_amount;
          wallet.locked_fund = wallet.locked_fund - Number(transaction.settlement_amount);
          transaction.status = 'failed';
          wallet.save();
          transaction.reversalEmail({ user, amount: transaction.settlement_amount });
          transaction.save();
          res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
            code: httpStatus.UNPROCESSABLE_ENTITY,
            message: 'Transaction failed',
            data: payment.data,
          });
        }
      } else {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Transaction already completed',
        );
      }
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (req: any, res: any, next: any) => {
    try {
      const { category } = req.query;
      console.log(category);
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
    }
  }

  // amount more that 10k
  airtimeLessThan10k = async (req: any, res: any, next: any) => {
    try {
      const { user } = req;
      const { amount, phoneNumber, save, itemCode, code, billerName } =
        req.body;
      let beneficiaries = null;
      if (save) {
        beneficiaries = await this.airtimeService.saveBeneficiary({
          user_id: user._id,
          phoneNumber,
          network: itemCode,
          name: req.body.name,
        });
      }
      // verify number and biller with flutter wave
      const verifyNumber = await this.flutterWaveService.verifyNumber({
        customer: phoneNumber,
        code,
        item_code: itemCode,
      });

      if (!verifyNumber) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Phone number');
      }
      // check for amount less than 10k
      if (amount < AIRTIME_LIMIT) {
        const transaction = new Transaction();

        // remove funds from wallet and lock funds
        const wallet = await this.airtimeService.debitAndLockFund(user, amount);

        // make payment to flutter wave
        const ref = generateRandomString(10);
        const data = {
          country: 'NG',
          customer: verifyNumber.customer,
          amount,
          recurrence: 'ONCE',
          type: billerName,
          reference: ref,
          biller_name: billerName,
        };

        const payment = await this.flutterWaveService.makePayment(data);

        // on fail reserve
        if (payment.status == 'error') {
          // reverse funds and send a reverse mail
          wallet.available_balance = wallet.available_balance + amount;
          wallet.locked_fund = wallet.locked_fund - amount;

          throw new ApiError(httpStatus.BAD_REQUEST, 'Error from third party');
        }
        // on success add funds to company wallet
        if (payment.status == 'success') {
          const companyWallet = this.airtimeService.sendFundToCompanyWallet({
            user_id: user._Id,
            amount_paid: amount,
            tran_ref: ref,
          });
          transaction.wallet_id = wallet.wallet_id;
          transaction.settlement_amount = amount;
          transaction.description = 'airtime';
          transaction.currency = 'NGN';
          transaction.payment_type = 'airtime';
          transaction.payment_method = 'wallet';
          transaction.status = 'completed';
          transaction.phone_number = verifyNumber.customer;
          transaction.two_fa_code_verify = true;
          await transaction.save();
        }
        // send debit mail to user
        await transaction.debitEmail({ user, amount });
        // return res
        res.status(httpStatus.OK).json({
          statusCode: httpStatus.OK,
          message: 'Airtime successful',
          data: transaction,
        });
      } else {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Please Use 2FA for this kind of amount',
        );
      }
    } catch (error) {
      next(error);
    }
  };

  // payment for for all bills
  billPayment = async (req: any, res: any, next: any) => {
    try {
      const { user } = req;
      const { amount, customerID, billerName, billerCode, itemCode, save, name, type } =
        req.body;

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
          type: type || "airtime"
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
        type: type || "bills-payment"
      });
      // send debit mail to user
      await transaction.debitEmail({ user, amount, wallet });

      // make payment
      const data = {
        country: 'NG',
        customer: transaction.phone_number,
        amount: transaction.settlement_amount,
        type: transaction.payment_type,
        reference: transaction.trans_ref,
        recurrence: 'ONCE',
      };
      const payment = await this.flutterWaveService.makePayment(data);

      if (payment.status == 'error') {
        // reverse funds and send a reverse mail
        wallet.available_balance = wallet.available_balance + amount;
        wallet.locked_fund = wallet.locked_fund - amount;
        wallet.save();
        transaction.reversalEmail({ user, amount, wallet });
        transaction.trans_ref = payment.data.reference;
        transaction.payload = JSON.stringify(payment.data);
        transaction.save();
        throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Error from third party reach out to the backend Team');
      }

      if (payment.status == 'pending') {
        transaction.status = 'mart_payment_pending';
        transaction.trans_ref = payment.data.reference;
        transaction.payload = JSON.stringify(payment.data);
        transaction.save();
      }

      if (payment.status == 'success') {
        // on success add funds to company wallet
        transaction.status = STATUS.partyFinished;
        transaction.save();
        
        const taxtechWallet = await this.airtimeService.sendFundToCompanyWallet({
          user: user,
          amount_paid: amount,
          tran_ref: transaction.trans_ref,
          type
        });

        if (taxtechWallet) {
          transaction.status = STATUS.finished;
          transaction.trans_ref = payment.data.reference;
          transaction.payload = JSON.stringify(payment.data);
          transaction.save();
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
    }
  }
}
