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
      You have successfully been credited ${amount}
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
  const { user, amount, wallet } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="x-apple-disable-message-reformatting" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css"
              integrity="sha512-5A8nwdMOWrSz20fDsjczgUidUBR8liPYU+WymTZP1lmY9G6Oc7HlZv156XqnsgNUzTyMefFTcsFH/tnJE/+xBg=="
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
            />
            <title>Transaction notification</title>
            <!--[if mso]>
              <noscript>
                <xml>
                  <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
                </xml>
              </noscript>
            <![endif]-->
            <style>
              body,
              div,
              h1,
              p,
              button,
              a {
                font-family: "Poppins", sans-serif;
              }
              i {
                color: rgba(255, 255, 255, 0.9);
              }
              * {
                padding: 0;
                margin: 0;
              }
              p {
                font-size: 1rem;
              }
              @media (max-width: 500px) {
                p {
                  font-size: 0.875rem;
                }
              }
              button:hover,
              a:hover {
                opacity: 0.75;
              }
              .main-container {
                padding: 1.5rem;
                margin: 1.5rem auto 0;
                max-width: 700px;
                width: 100%;
                background-color: white;
              }
              @media (max-width: 900px) {
                .main-container {
                  width: 80%;
                }
              }
              @media (max-width: 500px) {
                .main-container {
                  padding: 1rem;
                }
              }
              .page-header {
                color: rgba(0, 0, 0, 0.9);
                font-weight: 600;
                font-size: 1.5rem;
              }
              @media (max-width: 500px) {
                .page-header {
                  font-size: 1.25rem;
                }
              }
              .page-text {
                color: rgba(0, 0, 0, 0.7);
                font-weight: 400;
              }
              .btn-container {
                margin: 2rem auto;
                max-width: 300px;
                width: 100%;
              }
              @media (max-width: 500px) {
                .btn-container {
                  margin: 1.25rem auto;
                }
              }
              .social-container {
                background-color: #5cb23a;
                padding: 1rem 1.5rem;
                margin-top: 1.5rem;
                border-radius: 4px;
              }
              @media (max-width: 500px) {
                .social-container {
                  padding: 1rem;
                  margin-top: 1.25rem;
                }
              }
              .tax-text {
                text-align: center;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
                width: 80%;
                margin: auto;
              }
              @media (max-width: 500px) {
                .tax-text {
                  width: 100%;
                }
              }
              .social-flex {
                margin-top: 2rem;
                display: flex;
                gap: 2rem;
                align-items: center;
                justify-content: center;
              }
              @media (max-width: 500px) {
                .social-flex {
                  margin-top: 1.25rem;
                }
              }
              .social-link {
                font-size: 1.5rem;
              }
              .footer-link {
                font-size: 1rem;
                color: rgba(0, 0, 0, 0.5);
                text-decoration: none;
              }
              @media (max-width: 500px) {
                .footer-link {
                  font-size: 0.875rem;
                }
              }
              .mail-text {
                width: 80%;
                margin: 1rem auto;
                text-align: center;
              }
              @media (max-width: 500px) {
                .mail-text {
                  width: 100%;
                }
              }
              .txnBox {
                background-color: #f4f5fb;
                border-radius: 4px;
                padding: 0.75rem 1.5rem;
                margin-top: 1rem;
              }
              .txnBox .txn1 {
                color: #929292;
                display: inline-block;
              }
              .txnBox .txn2 {
                color: #424543;
                font-weight: 600;
                float: right;
              }
            </style>
          </head>
          <body style="margin: 2rem 0; background-color: #f4f5fb">
            <div style="width: 115px; height: 45px; margin: 0 auto">
              <image
                src="/assets/taxitpay-logo.png"
                alt="TaxitPay Logo"
                style="width: 100%; height: 100%"
              />
            </div>
            <div class="main-container">
              <div>
                <h1 class="page-header">TaxiTWallet® Debit Alert</h1>
                <hr style="margin: 12px 0; border: none; border-top: 1px solid rgba(0, 0, 0, 0.1)" />
                <p class="page-text">Dear ${name}</p>
                <br />
                <p class="page-text">
                  This is to notify you that your TaxiTWallet® account has been debited
                </p>
              </div>

              <div style="margin: 1.5rem 0; display: grid; grid-gap: 1rem">
                <div class="txnBox">
                  <p class="txn1">Amount</p>
                  <p class="txn2">${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)}</p>
                </div>
                <div class="txnBox">
                  <p class="txn1">Balance</p>
                  <p class="txn2">${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(wallet.available_balance) / 100)}</p>
                </div>
                <div class="txnBox">
                  <p class="txn1">Date</p>
                  <p class="txn2">${new Date()}</p>
                </div>
              </div>

              <div class="social-container">
                <div
                  style="background-color: rgba(255, 255, 255, 0.16); border-radius: 6px; padding: 12px 0"
                >
                  <p class="tax-text">
                    Taxtech®... developing efficient & effective technologies for the management of taxes.
                  </p>
                </div>
                <div class="social-flex">
                  <a href="" class="social-link"
                    ><i class="fa fa-facebook-official" aria-hidden="true"></i
                  ></a>
                  <a href="" class="social-link"><i class="fa fa-twitter" aria-hidden="true"></i></a>
                  <a href="" class="social-link"><i class="fa fa-youtube-play" aria-hidden="true"></i></a>
                  <a href="" class="social-link"
                    ><i class="fa fa-linkedin-square" aria-hidden="true"></i
                  ></a>
                </div>
              </div>

              <footer style="margin-top: 2rem; color: rgba(0, 0, 0, 0.5)">
                <div style="display: flex; width: fit-content; margin: 0 auto">
                  <a href="" class="footer-link">View web version</a>
                  <div
                    style="
                      background-color: #c9c9c9;
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      margin: 9px 1rem 0;
                    "
                  ></div>
                  <a href="" class="footer-link">Unsubscribe</a>
                </div>
                <p style="margin-top: 1rem; text-align: center">
                  &copy; 2015 - 2022 Taxaide Technologies Ltd. All rights reserved.
                </p>
                <p class="mail-text">
                  If you have any questions or feedback, please feel free to send a mail to
                  <a
                    href="mailto:support@taxtech.com.ng"
                    style="color: #5cb23a; font-weight: 600; text-decoration: none"
                    >support@taxtech.com.ng</a
                  >
                </p>
              </footer>
            </div>
          </body>
        </html>
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Debit Alert!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.reversalEmail = async function (payload: any) {
  const { user, amount, wallet } = payload
  const name = user.account_type === 'individual' ? `${user.first_name}` : `${user.entity_name}`
  const body = `
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="x-apple-disable-message-reformatting" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css"
              integrity="sha512-5A8nwdMOWrSz20fDsjczgUidUBR8liPYU+WymTZP1lmY9G6Oc7HlZv156XqnsgNUzTyMefFTcsFH/tnJE/+xBg=="
              crossorigin="anonymous"
              referrerpolicy="no-referrer"
            />
            <title>Transaction notification</title>
            <!--[if mso]>
              <noscript>
                <xml>
                  <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
                </xml>
              </noscript>
            <![endif]-->
            <style>
              body,
              div,
              h1,
              p,
              button,
              a {
                font-family: "Poppins", sans-serif;
              }
              i {
                color: rgba(255, 255, 255, 0.9);
              }
              * {
                padding: 0;
                margin: 0;
              }
              p {
                font-size: 1rem;
              }
              @media (max-width: 500px) {
                p {
                  font-size: 0.875rem;
                }
              }
              button:hover,
              a:hover {
                opacity: 0.75;
              }
              .main-container {
                padding: 1.5rem;
                margin: 1.5rem auto 0;
                max-width: 700px;
                width: 100%;
                background-color: white;
              }
              @media (max-width: 900px) {
                .main-container {
                  width: 80%;
                }
              }
              @media (max-width: 500px) {
                .main-container {
                  padding: 1rem;
                }
              }
              .page-header {
                color: rgba(0, 0, 0, 0.9);
                font-weight: 600;
                font-size: 1.5rem;
              }
              @media (max-width: 500px) {
                .page-header {
                  font-size: 1.25rem;
                }
              }
              .page-text {
                color: rgba(0, 0, 0, 0.7);
                font-weight: 400;
              }
              .btn-container {
                margin: 2rem auto;
                max-width: 300px;
                width: 100%;
              }
              @media (max-width: 500px) {
                .btn-container {
                  margin: 1.25rem auto;
                }
              }
              .social-container {
                background-color: #5cb23a;
                padding: 1rem 1.5rem;
                margin-top: 1.5rem;
                border-radius: 4px;
              }
              @media (max-width: 500px) {
                .social-container {
                  padding: 1rem;
                  margin-top: 1.25rem;
                }
              }
              .tax-text {
                text-align: center;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
                width: 80%;
                margin: auto;
              }
              @media (max-width: 500px) {
                .tax-text {
                  width: 100%;
                }
              }
              .social-flex {
                margin-top: 2rem;
                display: flex;
                gap: 2rem;
                align-items: center;
                justify-content: center;
              }
              @media (max-width: 500px) {
                .social-flex {
                  margin-top: 1.25rem;
                }
              }
              .social-link {
                font-size: 1.5rem;
              }
              .footer-link {
                font-size: 1rem;
                color: rgba(0, 0, 0, 0.5);
                text-decoration: none;
              }
              @media (max-width: 500px) {
                .footer-link {
                  font-size: 0.875rem;
                }
              }
              .mail-text {
                width: 80%;
                margin: 1rem auto;
                text-align: center;
              }
              @media (max-width: 500px) {
                .mail-text {
                  width: 100%;
                }
              }
              .txnBox {
                background-color: #f4f5fb;
                border-radius: 4px;
                padding: 0.75rem 1.5rem;
                margin-top: 1rem;
              }
              .txnBox .txn1 {
                color: #929292;
                display: inline-block;
              }
              .txnBox .txn2 {
                color: #424543;
                font-weight: 600;
                float: right;
              }
            </style>
          </head>
          <body style="margin: 2rem 0; background-color: #f4f5fb">
            <div style="width: 115px; height: 45px; margin: 0 auto">
              <image
                src="/assets/taxitpay-logo.png"
                alt="TaxitPay Logo"
                style="width: 100%; height: 100%"
              />
            </div>
            <div class="main-container">
              <div>
                <h1 class="page-header">TaxiTWallet® Reversal Alert</h1>
                <hr style="margin: 12px 0; border: none; border-top: 1px solid rgba(0, 0, 0, 0.1)" />
                <p class="page-text">Dear ${name}</p>
                <br />
                <p class="page-text">
                  This is to notify you that your TaxiTWallet® account has been credited
                </p>
              </div>

              <div style="margin: 1.5rem 0; display: grid; grid-gap: 1rem">
                <div class="txnBox">
                  <p class="txn1">Amount</p>
                  <p class="txn2">${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)}</p>
                </div>
                <div class="txnBox">
                  <p class="txn1">Balance</p>
                  <p class="txn2">${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(wallet.available_balance) / 100)}</p>
                </div>
                <div class="txnBox">
                  <p class="txn1">Date</p>
                  <p class="txn2">${new Date()}</p>
                </div>
              </div>

              <div class="social-container">
                <div
                  style="background-color: rgba(255, 255, 255, 0.16); border-radius: 6px; padding: 12px 0"
                >
                  <p class="tax-text">
                    Taxtech®... developing efficient & effective technologies for the management of taxes.
                  </p>
                </div>
                <div class="social-flex">
                  <a href="" class="social-link"
                    ><i class="fa fa-facebook-official" aria-hidden="true"></i
                  ></a>
                  <a href="" class="social-link"><i class="fa fa-twitter" aria-hidden="true"></i></a>
                  <a href="" class="social-link"><i class="fa fa-youtube-play" aria-hidden="true"></i></a>
                  <a href="" class="social-link"
                    ><i class="fa fa-linkedin-square" aria-hidden="true"></i
                  ></a>
                </div>
              </div>

              <footer style="margin-top: 2rem; color: rgba(0, 0, 0, 0.5)">
                <div style="display: flex; width: fit-content; margin: 0 auto">
                  <a href="" class="footer-link">View web version</a>
                  <div
                    style="
                      background-color: #c9c9c9;
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      margin: 9px 1rem 0;
                    "
                  ></div>
                  <a href="" class="footer-link">Unsubscribe</a>
                </div>
                <p style="margin-top: 1rem; text-align: center">
                  &copy; 2015 - 2022 Taxaide Technologies Ltd. All rights reserved.
                </p>
                <p class="mail-text">
                  If you have any questions or feedback, please feel free to send a mail to
                  <a
                    href="mailto:support@taxtech.com.ng"
                    style="color: #5cb23a; font-weight: 600; text-decoration: none"
                    >support@taxtech.com.ng</a
                  >
                </p>
              </footer>
            </div>
          </body>
        </html>
  `
  const data = { from: 'tech@taxtech.com.ng', to: user.email, subject: 'Debit Reversal!', html: body, email: user.email }

  await sendEmail(data)
  // return Promise.resolve();
}


export const Transaction = model<ITransactionModel>('Transaction', schema)
