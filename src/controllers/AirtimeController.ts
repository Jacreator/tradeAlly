import ApiError from '@/helper/ApiError';
import { AirtimeServices } from '@/services/AirtimeServices';
import httpStatus from 'http-status';
import { Transaction } from '@/models/transaction.model';
import { FlutterWaveService } from './../helper/third-party/flutter-wave';
import { AIRTIME_LIMIT } from '@/config';
import { generateRandomString } from './../helper/index';

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
      // console.log(verifyNumber);
      if (!verifyNumber) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Phone number');
      }
      // check and debit the user's wallet and lock funds
      const wallet = await this.airtimeService.debitAndLockFund(user, amount);

      // save transaction
      const transaction = await this.airtimeService.saveToTransaction({
        wallet_id: wallet._id,
        settlement_amount: amount,
        description: 'Airtime',
        currency: 'NGN',
        payment_type: 'airtime',
        payment_method: 'wallet',
        status: 'pending',
        phone_number: verifyNumber.customer,
      });

      // send airtime OTP
      if (transaction) {
        await transaction.sendTWOFACode({ user });
      }

      const savedBeneficiaries = beneficiaries ? 'beneficiary Saved' : null;
      res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: 'Airtime initiated successfully',
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
      if (transaction.two_fa_code !== twoFA) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
      }
      if (!transaction) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Transaction not found');
      }
      if (transaction.status === 'pending') {
        // make call to fluter wave to verify transaction
        const data = {
          country: 'NG',
          customer: transaction.phone_number,
          amount: transaction.settlement_amount,
          recurrence: 'ONCE',
          type: 'AIRTIME',
          reference: transaction.trans_ref,
          biller_name: 'MTN VTU',
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
        if (payment.status == 'success') {
          // debit transaction wallet to taxaide wallet
          const userWallet = await this.airtimeService.sendFundToCompanyWallet({
            amount_paid: transaction.settlement_amount,
            tran_ref: transaction.trans_ref,
            user_id: user._id,
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
          transaction.reversalEmail({ user });
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

  getBeneficiaries = async (req: any, res: any, next: any) => {
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
        if (payment.code == httpStatus.BAD_REQUEST) {
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

  // payment for Data
  dataPayment = async (req: any, res: any, next: any) => {
    try {
      const { user } = req;
      const { amount, phoneNumber, billerName, billerCode, itemCode } =
        req.body;
      // validate number
      const verifyNumber = await this.flutterWaveService.verifyNumber({
        customer: phoneNumber,
        code: billerCode,
        item_code: itemCode,
      });

      if (!verifyNumber) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Phone number');
      }

      // debit and lock funds
      const wallet = await this.airtimeService.debitAndLockFund(user, amount);

      // store transaction
      const transaction = await this.airtimeService.saveToTransaction({
        wallet_id: wallet.wallet_id,
        settlement_amount: amount,
        description: 'data',
        currency: 'NGN',
        payment_type: billerName,
        payment_method: 'wallet',
        phone_number: verifyNumber.customer,
      });

      // send debit mail to user
      await transaction.debitEmail({ user, amount });

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

      if (payment.code == httpStatus.BAD_REQUEST) {
        // reverse funds and send a reverse mail
        wallet.available_balance = wallet.available_balance + amount;
        wallet.locked_fund = wallet.locked_fund - amount;
        wallet.save();
        transaction.reversalEmail({ user, amount });
        throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, payment.message);
      }

      // update taxtech wallet
      // store transaction for taxtech
      const taxtechWallet = await this.airtimeService.sendFundToCompanyWallet({
        user: user,
        amount_paid: amount,
        tran_ref: transaction.trans_ref,
      });
      // send response
      res.status().json({
        code: httpStatus.OK,
        message: 'Data payment successful',
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  };
}
