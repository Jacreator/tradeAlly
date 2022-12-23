import { Transaction } from "@/models/transaction.model";
import httpStatus from "http-status";
import { FlutterWaveService } from './../helper/third-party/flutter-wave';
import { AirtimeServices } from '@/services/AirtimeServices';
import { Wallet } from "@/models/wallet.model";
import { User } from "@/models/user.model";
import ApiError from "@/helper/ApiError";
import { NODE_APP_INSTANCE } from "@/config";

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

            // if (NODE_APP_INSTANCE == '0') {
            const job = new CronJob('*/01 * * * * *', async function () {
                    const flutterWaveService = new FlutterWaveService();
                    const transactions = await Transaction.find({ status: "retry" });
                    if (transactions.length < 1) {
                        return res.status(httpStatus.NOT_FOUND).json({
                            message: 'No transactions found',
                            statusCode: httpStatus.NOT_FOUND,
                        });
                    } else {
                        transactions.forEach( async (transaction: any) => {
                            const responded = await flutterWaveService.verifyTransaction({
                                reference: transaction.trans_ref
                            });
                            console.log(`verify response`, responded, transaction.trans_ref);
                            const wallet = await Wallet.findOne({ wallet_id: transaction.wallet_id });
                            const user = await User.findOne({ user_id: wallet.user_id });

                            if (responded.data.status === 'success') {
                                // update wallet and send funds to company wallet
                                const taxtechWallet = await this.airtimeService.sendFundToCompanyWallet({
                                    user: user,
                                    amount_paid: transaction.settlement_amount,
                                    tran_ref: transaction.trans_ref,
                                });

                                if (!taxtechWallet) {
                                    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'could not complete money move');
                                }
                                transaction.status = 'success';
                                await transaction.save();
                            }

                            if (responded.data.status === 'error') {
                                // revert funds to user wallet
                                wallet.available_balance = wallet.available_balance + transaction.settlement_amount;
                                wallet.locked_fund = wallet.locked_fund - transaction.settlement_amount;
                                wallet.save();
                                transaction.status = 'failed';
                                transaction.reversalEmail({ user, amount: transaction.settlement_amount });
                                await transaction.save();
                            }
                        });
                    }
                });

                job.start();
            // }
            return res.status(httpStatus.OK).json({
                message: 'Transactions verified',
            });
        
    }
}
