import { TAXTECH_WALLET } from '@/config';
import { STATUS } from '@/config/constants';
import ApiError from '@/helper/ApiError';
import { Beneficiary } from '@/models/Beneficiary.model';
import { Transaction } from '@/models/transaction.model';
import { Wallet } from '@/models/wallet.model';
import httpStatus from 'http-status';
import { FlutterWaveService } from './../helper/third-party/flutter-wave';

export class AirtimeServices {
  private FlutterWaveService: any;

  constructor() {
    this.FlutterWaveService = new FlutterWaveService();
  }
  saveBeneficiary = async (beneficiary: any) => {
    try {
      const beneficiaries = await Beneficiary.create(beneficiary);
      return beneficiaries;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  };

  debitAndLockFund = async (user: any, amount: number) => {
    try {
      const userWallet = await Wallet.findOne({ user_id: user._id });
      if (
        Number(userWallet.available_balance) <
        userWallet.currencyToKoboUnit(Number(amount).toString())
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Insufficient balance in wallet!',
        );
      }
      const wallet = await Wallet.findOne({ user_id: user._id });

      wallet.available_balance =
        (Number(wallet.available_balance) - userWallet.currencyToKoboUnit(amount.toString())).toString();
      wallet.locked_fund =
        (Number(wallet.locked_fund) + userWallet.currencyToKoboUnit(amount.toString())).toString();
      return await wallet.save();
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  };

  saveToTransaction = async (payload: any) => {
    try {
      const transaction = new Transaction();
      transaction.wallet_id = payload.wallet_id;
      transaction.settlement_amount = payload.settlement_amount;
      transaction.description = payload.description;
      transaction.currency = payload.currency;
      transaction.payment_type = payload.payment_type;
      transaction.payment_method = payload.payment_method;
      transaction.status = 'pending';
      transaction.phone_number = payload.phone_number;
      transaction.generateTransactionReference(10);
      transaction.generatePaymentReference(10);
      transaction.setTWOFACode(4);

      await transaction.save();

      return transaction;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  };

  // send lock funds to taxaide wallet
  sendFundToCompanyWallet = async (payload: any) => {
    try {
      const { user } = payload;
      const taxTechWallet = await Wallet.findOne({ wallet_id: TAXTECH_WALLET });
      const userWallet = await Wallet.findOne({
        user_id: payload.user._id,
      });
      // remove founds from locked funds
      userWallet.locked_fund = (
        Number(userWallet.locked_fund) -
        Number(taxTechWallet.currencyToKoboUnit(payload.amount_paid))
      ).toString();

      // remove money from ledger balance
      userWallet.ledger_balance = (
        Number(userWallet.ledger_balance) -
        Number(taxTechWallet.currencyToKoboUnit(payload.amount_paid))
      ).toString();

      // add fund to company wallet
      taxTechWallet.available_balance =  (
        Number(taxTechWallet.available_balance) +
        Number(
          taxTechWallet.currencyToKoboUnit(
            await this.calculateProfit({
              amount: payload.amount_paid,
              type: payload.type,
            }),
          ),
        )
      ).toString();

      taxTechWallet.ledger_balance = (
        Number(taxTechWallet.ledger_balance) +
        Number(
          taxTechWallet.currencyToKoboUnit(
            await this.calculateProfit({
              amount: payload.amount_paid,
              type: payload.type,
            }),
          ),
        )
      ).toString();

      
      // generate transaction record for company
      const companyTransaction = new Transaction();
      companyTransaction.wallet_id = TAXTECH_WALLET;
      companyTransaction.amount_paid = payload.amount_paid;
      companyTransaction.status = STATUS.finished;
      companyTransaction.description = `Transaction fee for ${payload.tran_ref}`;
      companyTransaction.reciever = TAXTECH_WALLET;
      companyTransaction.currency = 'NGN';
      companyTransaction.payment_method = 'wallet';
      companyTransaction.payment_type = 'credit';

      // send credit email to company
      // await companyTransaction.creditEmail({
      //   user: payload.user,
      //   amount: payload.amount_paid,
      // });

      // save transaction
      await companyTransaction.save();
      const wallet = await userWallet.save();
      await taxTechWallet.save();

      return wallet;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  };

  calculateProfit = async (payload: { amount: string; type: string }) => {
    if (payload.type === 'airtime') {
      return (payload.amount = ((3 * 100) / Number(payload.amount)).toFixed(2)).toString();
    }
    return '30';
  };
}
