import { Schema, Document, model } from 'mongoose';
import privateValidator from 'mongoose-private';
import { customAlphabet } from 'nanoid';
import { sendEmail } from '../helper/mailer';
import uniqueValidator from 'mongoose-unique-validator';

export interface IWallet {
  user_id: string
  wallet_id: string
  currency: string
  available_balance: any
  ledger_balance: string
  locked_fund: any
  two_fa_code: string
  is_locked: boolean
}

export interface IWalletToAuthJSON {
  user_id: string
  wallet_id: string
  currency: string
  available_balance: any
  ledger_balance: string
  locked_fund: any
  two_fa_code: string
  is_locked: boolean
}

export default interface IWalletModel extends Document, IWallet {
  walletUnlockedEmail(payload: any): void
  sendTWOFACode(payload: any): void
  generateWalletId(strength: number): void
  setTWOFACode(strength: number): void
  toAuthWalletJSON(): IWalletToAuthJSON
  currencyToKoboUnit(amount: string): number
  currencyToNariaValue(amount: string): number

  debitWalletToLockFunds(amount: string): void
  debitLockedFundAndLedger(amount: string): void
  creditWalletFromLockedFund(amount: string): void
  creditWalletDirect(amount: string): void
}

const schema = new Schema<IWalletModel>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    wallet_id: { type: String, required: true },
    currency: { type: String, required: true },
    available_balance: { type: Number, required: true },
    ledger_balance: { type: Number, required: true },
    locked_fund: {type: Number, required: true },
    two_fa_code: { type: String, default: null },
    is_locked: { type: Boolean, default: false },
  },
  { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator);
schema.plugin(privateValidator);

schema.methods.generateWalletId = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength);
  this.wallet_id = nanoid().toUpperCase();
}

schema.methods.setTWOFACode = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.two_fa_code = nanoid().toUpperCase();
}

schema.methods.currencyToKoboUnit = function (amount: string) {
  return Number(amount) * 100
}

schema.methods.currencyToNariaValue = function (amount: string) {
  return Number(amount) / 100
}

schema.methods.debitWalletToLockFunds = function (amount: string) {
  this.available_balance = (Number(this.available_balance) - Number(amount)).toString()
  this.locked_fund = (Number(this.locked_fund) + Number(amount)).toString()
}

schema.methods.debitLockedFundAndLedger = function (amount: string) {
  this.locked_fund = (Number(this.locked_fund) - Number(amount)).toString()
  this.ledger_balance = (Number(this.ledger_balance) - Number(amount)).toString()
}

schema.methods.creditWalletFromLockedFund = function (amount: string) {
  this.locked_fund = (Number(this.locked_fund) - Number(amount)).toString()
  this.available_balance = (Number(this.available_balance) + Number(amount)).toString()
}

schema.methods.creditWalletDirect = function (amount: string) {
  this.available_balance = (Number(this.available_balance) + Number(amount)).toString()
  this.ledger_balance = (Number(this.ledger_balance) + Number(amount)).toString()
}

schema.methods.toAuthWalletJSON = async function () {
  const { _id, user_id, wallet_id, currency, available_balance, ledger_balance, locked_fund } = this
  return { id: _id, user_id, wallet_id, currency, available_balance, ledger_balance, locked_fund }
}

schema.methods.walletUnlockedEmail = async function (payload: any) {
  const { user } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
    <h3>Hello ${name},</h3>

    <p>
      You have successfuly been assigned a wallet on TaxIT Pay! Your wallet id (${this.wallet_id})
    </p>

    <p>
      Kindly login to fund your wallet and perform other types of transaction!
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Wallet Activation', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.sendTWOFACode = async function (payload: any) {
  const { senderName, email } = payload
  const body = `
    <h3>Hello ${senderName},</h3>

    <p>
      You are trying to login to your vendor account!
    </p>

    <p>
      Kindly enter the code below to proceed!
    </p>

    <p>
      <strong>
        2FA Code: ${this.two_fa_code}
      </strong>
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: email, subject: 'Login 2FA Verification', html: body, email }

  await sendEmail(data)
  // return Promise.resolve();
}

export const Wallet = model<IWalletModel>('Wallet', schema)
