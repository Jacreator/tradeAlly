import { Transaction } from "@/models/transaction.model";
import httpStatus from "http-status";
import { FlutterWaveService } from './../helper/third-party/flutter-wave';
import { AirtimeServices } from '@/services/AirtimeServices';
import { Wallet } from "@/models/wallet.model";
import { User } from "@/models/user.model";
import ApiError from "@/helper/ApiError";
import { NODE_APP_INSTANCE } from "@/config";
import { STATUS } from "@/config/constants";

const CronJob = require('cron').CronJob;

export class TransactionController {

    private flutterWaveService: FlutterWaveService;
    private airtimeService: AirtimeServices;

    constructor() {
        this.flutterWaveService = new FlutterWaveService();
        this.airtimeService = new AirtimeServices();
    }

    /**
    * Get all transactions that are not deleted
    * 
    * @route GET api/v1/transactions
    * @param {*} req
    * @param {*} res
    * @param {*} next
    * 
    * @returns {Promise<transactions>}
    * 
    * @memberOf TransactionsController
    */
    getAllTransactions = async (req: any, res: any, next: any) => {
        try {
            const transactions = await Transaction.find({ is_deleted: false });
            return res.status(httpStatus.OK).json(transactions);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * verify transaction
     * 
     * @route GET api/v1/transactions/:id
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * 
     * @returns {Promise<transactions>}
     * @memberOf TransactionsController
     */
    verifyFullerWaveTransaction = async (req: any, res: any, next: any) => {
        try {
            const transactions = await Transaction.find({
                status: "mart_payment_pending"
            });
            if (transactions.length < 1) {
                return res.status(httpStatus.NOT_FOUND).json({
                    message: 'No transactions found',
                    statusCode: httpStatus.NOT_FOUND,
                });
            } else {
                transactions.forEach(async (transaction: any) => {
                    const responded = await this.flutterWaveService.verifyTransaction({
                        reference: transaction.trans_ref
                    });
                    // skip the transaction if response is still pending
                    if (responded.data.status === 'pending') {
                        return;
                    }
                    const wallet = await Wallet.findOne({ wallet_id: transaction.wallet_id });
                    const user = await User.findOne({ user_id: wallet.user_id });

                    if (responded.data.status === 'success') {
                        // update wallet and send funds to company wallet
                        const taxtechWallet = await this.airtimeService.sendFundToCompanyWallet({
                            user: user,
                            amount_paid: transaction.settlement_amount,
                            tran_ref: transaction.trans_ref,
                            type: transaction.type
                        });
                        if (!taxtechWallet) {
                            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'could not complete money move');
                        }
                        transaction.status = STATUS.completed;
                        await transaction.save();
                    }

                    if (responded.data.status === 'error') {
                        // revert funds to user wallet
                        wallet.available_balance = wallet.available_balance + transaction.settlement_amount;
                        wallet.locked_fund = wallet.locked_fund - transaction.settlement_amount;
                        wallet.save();
                        transaction.status = STATUS.failed;
                        transaction.reversalEmail({ user, amount: transaction.settlement_amount });
                        await transaction.save();
                    }
                });
            }

            return res.status(httpStatus.OK).json({
                message: 'Transactions verified',
                status: httpStatus.OK
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }

    getTokenFromFlutterWave = async (req: any, res: any, next: any) => {
        try {
            // get all transaction by Success 
            const transactions = await Transaction.find({
                status: { $in: ['completed'] },
                payment_method: 'wallet-mart',
                sent_token: false,
                type: {
                    $in: ['power', 'bills-payment']
                },
            });
            if (!transactions) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Transaction not found');
            }
            // for each transaction check the transaction by reference
            let token;
            transactions.forEach(async transaction => {
                // check the response gotten and check the token for a valid value
                let transactionPayload = JSON.parse(transaction.payload)
                const responded = await this.flutterWaveService.verifyTransaction({
                    reference: transactionPayload.reference
                });
                // send the token to the user

                const transactionWallet = await Wallet.findOne({ wallet_id: transaction.wallet_id });
                const user = await User.findOne({ user_id: transactionWallet.user_id });
                if (!responded.data.token || responded.data.token != undefined || responded.data.token != '') {
                    token = responded.data.token
                    user.sendTokenToUser({ token: responded.data.token });
                }
                // update the transaction as completed with token sent
                transaction.sent_token = true;
                await transaction.save();
            });
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: 'Transaction token sent successfully',
                data: token
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }
}
