import { Schema, Document, model } from 'mongoose'
import crypto from 'crypto'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'
import { customAlphabet } from 'nanoid'
import { JWT_SECRET, JWT_EXPIRE, FRONT_END_URL, POSTMARK_MAIL_FROM } from '../config'
import { sendEmail } from '../helper/mailer'
import { seal } from '../middleware/authentication'

export interface IUser {
  account_type: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone: string
  occupation: string
  nationality: string

  entity_name: string
  rc_number: string
  country_of_incorporation: string
  business_nature: string

  address: string
  city: string
  state: string;
  postal_code: string
  country: string;

  roles: any
  company_id: string
  company: string
  is_sub_account: boolean

  identification: string;
  identification_number: string;
  identification_url: string;
  proof_of_address: string;
  proof_of_address_url: string;

  email_verification_code: string
  two_fa_code: string

  last_login: Date
  login_count: number
  password: string
  salt: string

  is_verified: boolean
  is_locked: boolean
  is_active: boolean
  is_deleted: boolean
  is_email_verified: boolean
  is_phone_verified: boolean
  reason: string
  otp: number
  otp_expiry: Date
  tire: string
  daily_limit: number
  pin_trans_auth: boolean
  set_pin: boolean
}

export interface IUserToAuthJSON {
  account_type: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone: string
  occupation: string
  nationality: string
  entity_name: string
  rc_number: string
  country_of_incorporation: string
  business_nature: string
  address: string
  city: string
  state: string;
  postal_code: string
  country: string;
  identification: string;
  identification_number: string;
  identification_url: string;
  proof_of_address: string;
  proof_of_address_url: string;
  roles: any
  company_id: string
  company: string
  is_sub_account: boolean
  is_email_verified: boolean
  is_phone_verified: boolean
  reason: string
  otp: number
  otp_expiry: Date
  tire: string
  daily_limit: number
  pin_trans_auth: boolean
  set_pin: boolean
}

export default interface IUserModel extends Document, IUser {

  setTWOFACode(strength: number): void
  toAuthIndividualJSON(): IUserToAuthJSON
  toAuthCorporateJSON(): IUserToAuthJSON
  generateIndividualJWT(): string
  generateCorporateJWT(): string
  sendTokenToUser(payload: any): void
  name: string
}

const schema = new Schema<IUserModel>(
  {
    account_type: { type: String, default: null },
    first_name: { type: String, default: null },
    middle_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    occupation: { type: String, default: null },
    nationality: { type: String, default: null },
    entity_name: { type: String, default: null },
    rc_number: { type: String, default: null },
    country_of_incorporation: { type: String, default: null },
    business_nature: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    postal_code: { type: String, default: null },
    country: { type: String, default: null },
    identification: { type: String, default: null },
    identification_number: { type: String, default: null },
    identification_url: { type: String, default: null },
    proof_of_address: { type: String, default: null },
    proof_of_address_url: { type: String, default: null },
    email_verification_code: { type: String, default: null },
    two_fa_code: { type: String, default: null },
    company: { type: String, default: null },
    company_id: { type: Schema.Types.ObjectId, default: null },
    roles: [{ type: String }],
    is_sub_account: { type: Boolean, default: false },
    last_login: { type: Date },
    login_count: { type: Number, default: 0 },
    password: { type: String, default: null },
    salt: { type: String, default: null },
    is_verified: { type: Boolean, default: false },
    is_locked: { type: Boolean, default: false },
    is_active: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_deactivated: { type: Boolean, default: false },
    otp: { type: String, default: null },
    is_email_verified: { type: Boolean, default: false },
    is_phone_verified: { type: Boolean, default: false },
    reason: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    tire: { type: String, default: null },
    daily_limit: { type: Number, default: null },
    pin_trans_auth: { type: Boolean, default: false },
    set_pin: { type: Boolean, default: false },
  },
  { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator);
schema.plugin(privateValidator);

schema.virtual('name').get(function (this: IUserModel) {
  return `${this.first_name}` || `${this.entity_name}`;
})

schema.methods.setTWOFACode = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.two_fa_code = nanoid().toUpperCase()
}

schema.methods.generateIndividualJWT = async function (): Promise<string> {

  const token = await seal({
    id: this._id,
    account_type: this.account_type,
    name: this.name,
    email: this.email,
    first_name: this.first_name,
    middle_name: this.middle_name,
    last_name: this.last_name,
    phone: this.phone,
    occupation: this.occupation,
    nationality: this.nationality,
    is_verified: this.is_verified,
  }, JWT_SECRET, JWT_EXPIRE);

  return token;
}

schema.methods.generateCorporateJWT = async function (): Promise<string> {

  const token = await seal({
    id: this._id,
    name: this.name,
    email: this.email,
    entity_name: this.entity_name,
    phone: this.phone,
    rc_number: this.rc_number,
    country_of_incorporation: this.country_of_incorporation,
    business_nature: this.business_nature,
    is_verified: this.is_verified,
  }, JWT_SECRET, JWT_EXPIRE);

  return token;
}

schema.methods.toAuthIndividualJSON = async function () {
  const { _id, account_type, first_name, middle_name, last_name, name, email, phone, is_verified, nationality, occupation, address, city, state, postal_code, country, identification, identification_number, identification_url, proof_of_address, proof_of_address_url, company, company_id, roles, is_sub_account, is_active, is_locked, is_email_verified, pin_trans_auth, set_pin,
    is_phone_verified, reason, tire,
    daily_limit } = this

  return {
    id: _id,
    account_type,
    first_name,
    middle_name,
    last_name,
    name,
    email,
    phone,
    is_verified,
    occupation,
    nationality,
    address,
    city,
    state,
    postal_code,
    country,
    identification,
    identification_number,
    identification_url,
    proof_of_address,
    proof_of_address_url,
    company,
    company_id,
    roles,
    is_sub_account,
    is_locked,
    is_active,
    token: await this.generateIndividualJWT(),
    is_email_verified,
    is_phone_verified, reason, tire,
    daily_limit, pin_trans_auth, set_pin,
  }
}

schema.methods.toAuthCorporateJSON = async function () {
  const { _id, entity_name, name, email, phone, is_verified, rc_number, country_of_incorporation, business_nature, is_email_verified,
    is_phone_verified, reason, tire, pin_trans_auth, set_pin,
    daily_limit } = this
  return {
    id: _id,
    entity_name,
    name,
    email,
    phone,
    is_verified,
    rc_number,
    country_of_incorporation,
    business_nature,
    token: await this.generateCorporateJWT(),
    is_email_verified,
    is_phone_verified, reason, tire,
    daily_limit,
    pin_trans_auth, set_pin,
  }
}

schema.methods.sendTokenToUser = async function (payload: any) {
  const { user } = payload;
  const name =
    user.account_type === 'individual'
      ? `${user.first_name}`
      : `${user.entity_name}`;
  const body = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css"
    integrity="sha512-5A8nwdMOWrSz20fDsjczgUidUBR8liPYU+WymTZP1lmY9G6Oc7HlZv156XqnsgNUzTyMefFTcsFH/tnJE/+xBg=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />
  <title>Bill Token</title>
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
      width: 80%;
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
  </style>
</head>

<body style="margin: 2rem 0; background-color: #f4f5fb">
  <div style="width: 115px; height: 45px; margin: 0 auto">
    <image src="https://www.taxitpay.com.ng/_next/static/media/taxitpay-logo.9c068d5e.png?imwidth=384" alt="TaxitPay Logo" style="width: 100%; height: 100%" />
  </div>
  <div class="main-container">
    <div>
      <h1 class="page-header">Bills Token</h1>
      <hr style="margin: 12px 0; border: none; border-top: 1px solid rgba(0, 0, 0, 0.1)" />
      <p class="page-text">Dear ${name}</p>
      <br />
      <p class="page-text">
        Congratulations on your recent purchase of electricity through our innovative platform! We are thrilled to
        provide you with an exclusive token that unlocks a world of boundless power and convenience.
      <p class="page-text">Without further ado, please find your unique electricity token below:</p>

      <div style="margin: 1.5rem 0">
        <p style="color: rgba(0, 0, 0, 0.5); font-size: 12px; text-align: center">
          BILL'S TOKEN
        </p>
        <p style="
            color: rgba(0, 0, 0, 0.9);
            text-align: center;
            font-weight: 700;
            font-size: 2rem;
            letter-spacing: 1rem;
          ">
          ${payload.token}
        </p>
      </div>
      </p>

    </div>

    <div class="social-container">
      <div style="background-color: rgba(255, 255, 255, 0.16); border-radius: 6px; padding: 12px 0">
        <p class="tax-text">
          Taxtech®... developing efficient & effective technologies for the management of taxes.
        </p>
      </div>
      <div class="social-flex">
        <a href="" class="social-link"><i class="fa fa-facebook-official" aria-hidden="true"></i></a>
        <a href="" class="social-link"><i class="fa fa-twitter" aria-hidden="true"></i></a>
        <a href="" class="social-link"><i class="fa fa-youtube-play" aria-hidden="true"></i></a>
        <a href="" class="social-link"><i class="fa fa-linkedin-square" aria-hidden="true"></i></a>
      </div>
    </div>

    <footer style="margin-top: 2rem; color: rgba(0, 0, 0, 0.5)">
      <div style="display: flex; width: fit-content; margin: 0 auto">
        <a href="" class="footer-link">View web version</a>
        <div style="
              background-color: #c9c9c9;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              margin: 9px 1rem 0;
            "></div>
        <a href="" class="footer-link">Unsubscribe</a>
      </div>
      <p style="margin-top: 1rem; text-align: center">
        &copy; 2015 - ${new Date().getFullYear()} Taxaide Technologies Ltd. All rights reserved.
      </p>
      <p class="mail-text">
        If you have any questions or feedback, please feel free to send a mail to
        <a href="mailto:support@taxtech.com.ng"
          style="color: #5cb23a; font-weight: 600; text-decoration: none">support@taxtech.com.ng</a>
      </p>
    </footer>
  </div>
</body>

</html>`;
  //  of <b>NGN ${amount}</b>
  const data = {
    from: POSTMARK_MAIL_FROM,
    to: user.email,
    subject: 'Expense OTP!',
    html: body,
    email: user.email,
  };

  await sendEmail(data);
  // return Promise.resolve();
};

export const User = model<IUserModel>('User', schema)
