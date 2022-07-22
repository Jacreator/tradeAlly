import ApiError from "@/helper/ApiError";
import { Beneficiary } from "@/models/Beneficary.model";
import { Transaction } from "@/models/transaction.model";
import { Wallet } from "@/models/wallet.model";
import httpStatus from "http-status";

export class AirtimeServices {

  saveBeneficiary = async (beneficiary: any) => {
    try {
      const beneficiaries = await Beneficiary.create(beneficiary);
      return beneficiaries;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }

  debitAndLockFund = async (user: any, amount: number) => {
    try {
      const userWallet = await Wallet.findOne({ user_id: user._id });
      if (Number(userWallet.available_balance) <
        userWallet.currencyUnit(
          (Number(amount)).toString(),
        )) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance in wallet!');
      }
      const wallet = await Wallet.findOneAndUpdate({ user_id: user._id }, {
        $inc: {
          available_balance: -userWallet.currencyUnit(
            (Number(amount)).toString(),
          ),
          locked_fund: +userWallet.currencyUnit(
            (Number(amount)).toString(),
          ),
        },
      }, { new: true });

      return wallet;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }

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
      transaction.generateTransactionReference(10);
      transaction.generatePaymentReference(10);
      transaction.setTWOFACode(4);

      await transaction.save();

      return transaction;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }
}