import { Schema, Document, model } from 'mongoose'
import crypto from 'crypto'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'
import { customAlphabet } from 'nanoid'
import { JWT_SECRET, JWT_EXPIRE, FRONT_END_URL } from '../config'
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
}

export default interface IUserModel extends Document, IUser {
  sendPasswordResetLink(): void
  sendVerificationEmail(): void
  sendWelcomeEmail(): void
  sendTWOFACode(): void
  setVerificationCode(strength: number): void
  setTWOFACode(strength: number): void
  setPassword(password: string): void
  validPassword(password: string): boolean
  toAuthIndividualJSON(): IUserToAuthJSON
  toAuthCorporateJSON(): IUserToAuthJSON
  generateIndividualJWT(): string
  generateCorporateJWT(): string
  generateAccessJWT(): string
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
  },
  { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator);
schema.plugin(privateValidator);

schema.virtual('name').get(function (this: IUserModel) {
  return `${this.first_name}` || `${this.entity_name}`;
})

schema.methods.setPassword = function (password: string) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.password = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
}

schema.methods.setVerificationCode = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.email_verification_code = nanoid().toUpperCase()
}

schema.methods.setTWOFACode = function (strength: number) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRESTUVWXYZ', strength)
  this.two_fa_code = nanoid().toUpperCase()
}

schema.methods.validPassword = function (password: string): boolean {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
  return this.password === hash
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
  const { _id, account_type, first_name, middle_name, last_name, name, email, phone, is_verified, nationality, occupation, address, city, state, postal_code, country, identification, identification_number, identification_url, proof_of_address, proof_of_address_url, company, company_id, roles, is_sub_account, is_active, is_locked } = this

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
  }
}

schema.methods.toAuthCorporateJSON = async function () {
  const { _id, entity_name, name, email, phone, is_verified, rc_number, country_of_incorporation, business_nature } = this
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
  }
}

schema.methods.sendVerificationEmail = async function () {
  const body = `
    <h3>Hi ${this.name}</h3>

    <p>
      You are one step away from becoming a user on TaxITPay!
    </p>

    <p>
      Kindly enter the below OTP!
    </p>

    <p>
      <strong>
        OTP: ${this.email_verification_code}
      </strong>
    </p>

    Regards.
  `

  const data = { from: 'tech@taxtech.com.ng', to: this.email, subject: 'TaxITPay Verification', html: body, email: this.email }
  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.sendPasswordResetLink = async function () {
  const body = `
    <h3>Hi ${this.name}</h3>

    <p>
      You requested for a password reset!
    </p>

    <p>
      Kindly kindly click on the link below!
    </p>

    <p>
      <a href='${FRONT_END_URL}?email=${this.email}'>Password Reset Link</a>
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: this.email, subject: 'Password Reset', html: body, email: this.email }

  await sendEmail(data)
  // return Promise.resolve();
}

schema.methods.sendTWOFACode = async function () {
  const body = `
    <h3>Hello ${this.name}</h3>

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
  const data = { from: 'tech@taxtech.com.ng', to: this.email, subject: 'Login 2FA Verification', html: body, email: this.email }

  await sendEmail(data)
  // return Promise.resolve();
}

//send welcome email
schema.methods.sendWelcomeEmail = async function () {
  const body = `
    <h3>Hello ${this.name}</h3>

    <p>
      Welcome to TaxITPay
    </p>

    <p>
      If this is not you, kindly ignore!
    </p>

    Regards.
  `
  const data = { from: 'tech@taxtech.com.ng', to: this.email, subject: 'Yaay! Welcome to TaxITPay', html: body, email: this.email }

  await sendEmail(data)

  return Promise.resolve()
}

export const User = model<IUserModel>('User', schema)
