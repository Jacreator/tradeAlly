import { Schema, Document, model } from 'mongoose';

export interface IUserKey {
    name: string;
    reference: string;
    secret: string;
    key: string;
    type: string;
}

export interface IUserKeyModel extends Document, IUserKey { }

const UserKeySchema = new Schema({
    name: { type: String, required: true },
    reference: { type: String, required: true },
    secret: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

export const UserKey = model<IUserKeyModel>('UserKey', UserKeySchema);