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


                    // revert funds to user wallet
                    if (responded.data.status == 'error') {
                        // reverse funds and send a reverse mail
                        wallet.available_balance = (
                            Number(wallet.available_balance) + wallet.currencyToKoboUnit(transaction.settlement_amount)
                        ).toString();
                        wallet.locked_fund = (Number(wallet.locked_fund) - wallet.currencyToKoboUnit(transaction.settlement_amount)).toString();
                        await wallet.save();

                        transaction.reversalEmail({ user, amount: transaction.settlement_amount, wallet });
                        transaction.payload = JSON.stringify(responded.data);
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
            let token: any[] = [];
            let payload: any[] = [];
            transactions.forEach(async transaction => {
                // check the response gotten and check the token for a valid value
                let transactionPayload = JSON.parse(transaction.payload)
                payload.push(transactionPayload);
                const responded = await this.flutterWaveService.verifyTransaction({
                    reference: transactionPayload.reference
                });
                // send the token to the user

                const transactionWallet = await Wallet.findOne({ wallet_id: transaction.wallet_id });
                const user = await User.findOne({ user_id: transactionWallet.user_id });
                if (!responded.data.data.extra || responded.data.data.extra != undefined || responded.data.data.extra != '') {
                    console.log({
                        token: responded.data.data.extra,
                        name: `${user._id}`
                    });
                    token.push(responded.data.data.extra);
                    user.sendTokenToUser({ token: responded.data.data.extra });
                    transaction.sent_token = true;
                    await transaction.save();
                } else {
                    transaction.sent_token = true;
                    await transaction.save();
                }
                // update the transaction as completed with token sent

            });
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: 'Transaction token sent successfully',
                data: { token, length: transactions.length, payload }
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }

    getSingleTransactionToken = async (req: any, res: any, next: any) => {
        try {
            const { ref } = req.params;
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: 'hit the transaction',
                data: await this.flutterWaveService.verifyTransaction({
                    reference: ref
                })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}
