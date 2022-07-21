import { Schema, Document, model } from 'mongoose'

export interface INotification {
  user: string
  subject: string
  message: string
  read: boolean
}

export default interface INotificationModel extends Document, INotification {}

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
)

export const Notification = model<INotificationModel>('Notification', schema)
