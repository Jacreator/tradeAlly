import { Schema, Document, model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'
import { customAlphabet } from 'nanoid'
import { sendEmail } from '../helper/mailer'

export interface ITransaction {
  wallet_id: string
  trans_ref: string
  pay_ref: string
  amount_paid: string
  settlement_amount: string
  fee: string
  switchFee: string
  convenienceFee: string
  paid_date: string
  status: string
  description: string
  currency: string
  payment_method: string
  payment_type: string
  reciever: string
  bank_name: string
  bank_code: string
  account_name: string
  account_number: string
  card_details: any
  account_details: any
  customer: any
  two_fa_code: string
  two_fa_code_verify: boolean
  phone_number: string
}

export interface ITransactionToAuthJSON {
  wallet_id: string
  trans_ref: string
  pay_ref: string
  amount_paid: string
  settlement_amount: string
  fee: string
  switchFee: string
  convenienceFee: string
  paid_date: string
  status: string
  description: string
  currency: string
  payment_method: string
  payment_type: string
  reciever: string
  bank_name: string
  bank_code: string
  account_name: string
  account_number: string
  card_details: any
  account_details: any
  customer: any
  phone_number: string
}

export default interface ITransactionModel extends Document, ITransaction {
  salaryCreditEmail(payload: any): void
  creditEmail(payload: any): void
  debitEmail(payload: any): void
  reversalEmail(payload: any): void
  setTWOFACode(strength: number): void
  sendTWOFACode(payload: any): void
  generateTransactionReference(strength: number): void
  generatePaymentReference(strength: number): void
  toTransactionJSON(): ITransactionToAuthJSON
}

const schema = new Schema<ITransactionModel>(
  {
    wallet_id: { type: String, required: true, ref: 'wallet' },
    trans_ref: { type: String, default: null },
    pay_ref: { type: String, default: null },
    amount_paid: { type: String, default: null },
    settlement_amount: { type: String, default: null },
    fee: { type: String, default: '0' },
    switchFee: { type: String, default: '0' }, // 3rd party
    convenienceFee: { type: String, default: '0' }, // taxtech
    paid_date: { type: Date, default: Date.now() },
    status: { type: String, default: null },
    description: { type: String, default: null },
    currency: { type: String, default: null },
    payment_method: { type: String, default: null },
    reciever: { type: String, default: null },
    bank_name: { type: String, default: null },
    bank_code: { type: String, default: null },
    account_name: { type: String, default: null },
    account_number: { type: String, default: null },
    card_details: { type: String, default: null },
    account_details: { type: String, default: null },
    customer: { type: String, default: null },
    payment_type: { type: String, default: null },
    two_fa_code: { type: String, default: null },
    two_fa_code_verify: { type: Boolean, default: false },
    phone_number: { type: String, default: null },
  },
  { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator)
schema.plugin(privateValidator)

schema.methods.setTWOFACode = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.two_fa_code = nanoid().toUpperCase()
}

schema.methods.sendTWOFACode = async function (payload: any) {
  const { user } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
    <h3>Hello ${name}</h3>

    <p>
      You are trying to perform a transaction!
    </p>

    <p>
      Kindly enter the code below to proceed!
    </p>

    <p>
      <strong>
        OTP: ${this.two_fa_code}
      </strong>
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Transaction OTP!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.generateTransactionReference = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.trans_ref = nanoid().toUpperCase()
}

schema.methods.generatePaymentReference = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.pay_ref = nanoid().toUpperCase()
}


schema.methods.toTransactionJSON = async function () {
  const { _id, wallet_id, trans_ref, pay_ref, amount_paid, settlement_amount, fee, paid_date, status, reciever, bank_name, bank_code, account_name, account_number, description, currency, payment_method, payment_type, card_details, account_details, customer } = this
  return { id: _id, wallet_id, trans_ref, pay_ref, amount_paid, settlement_amount, fee, paid_date, status, reciever, bank_name, bank_code, account_name, account_number, description, currency, payment_method, payment_type, card_details, account_details, customer }
}

schema.methods.creditEmail = async function (payload: any) {
  const { user, amount } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
    <h3>Hello ${name},</h3>

    <p>
      You have successfuly been credited ${amount}
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Credit Alert!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.salaryCreditEmail = async function (payload: any) {
  const { user, amount } = payload
  const body = `
    <h3>Hello ${user.first_name},</h3>

    <p>
      Your salary has been credited successfully ${amount}
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Credit Alert!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.debitEmail = async function (payload: any) {
  const { user, amount } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
    <h3>Hello ${name},</h3>

    <p>
      You have successfuly been debited ${amount}
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Debit Alert!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.reversalEmail = async function (payload: any) {
  const { user, amount } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
    <h3>Hello ${name},</h3>

    <p>
      We have successfuly reversed ${amount} to your wallet
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Debit Reversal!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}


export const Transaction = model<ITransactionModel>('Transaction', schema)
