import { Schema, Document, model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'
import { JWT_SECRET, JWT_EXPIRE} from '../config'
import { seal } from '../middleware/authentication'

export interface IUser {
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone: string
  occupation: string
  is_verified: boolean
}

export interface IUserToAuthJSON {
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone: string
  occupation: string
  is_verified: boolean
}

export default interface IUserModel extends Document, IUser {

  toAuthIndividualJSON(): IUserToAuthJSON
  generateIndividualJWT(): string
  name: string
}

const schema = new Schema<IUserModel>(
  {
    first_name: { type: String, default: null },
    middle_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    occupation: { type: String, default: null },
    is_verified: { type: Boolean, default: false}
  },
  { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator);
schema.plugin(privateValidator);

schema.virtual('name').get(function (this: IUserModel) {
  return `${this.first_name}` || `${this.last_name}`;
})

schema.methods.generateIndividualJWT = async function (): Promise<string> {

  const token = await seal({
    id: this._id,
    name: this.name,
    email: this.email,
    first_name: this.first_name,
    middle_name: this.middle_name,
    last_name: this.last_name,
    phone: this.phone,
    occupation: this.occupation,
    is_verified: this.is_verified,
  }, JWT_SECRET, JWT_EXPIRE);

  return token;
}

schema.methods.toAuthIndividualJSON = async function () {
  const { _id, first_name, middle_name, last_name, name, email, phone, is_verified, occupation } = this

  return {
    id: _id,
    first_name,
    middle_name,
    last_name,
    name,
    email,
    phone,
    is_verified,
    occupation,
    token: await this.generateIndividualJWT(),
  }
}


export const User = model<IUserModel>('User', schema)
