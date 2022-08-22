import { Schema, Document, model } from 'mongoose';

export interface IBeneficiary {
  user_id: string
  name: string
  phoneNumber: string
  network: string
  is_deleted: boolean
}

export default interface IBeneficiaryModel extends Document, IBeneficiary { }

const schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    network: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
)

export const Beneficiary = model<IBeneficiaryModel>('Beneficiaries', schema);
