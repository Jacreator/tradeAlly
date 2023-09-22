import { Schema, Document, model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'

export interface IInventory {
    name: string
    code: string
    price: string
    quantity: string
    quantity_sold: string
    discount: string
    company_id: string
    date: string
}

export interface IInventoryJSON {
    name: string
    code: string
    price: string
    quantity: string
    quantity_sold: string
    discount: string
    company_id: string
    date: string
}

export default interface IInventoryModel extends Document, IInventory {
    toInventoryJSON(): IInventoryJSON
}

const schema = new Schema<IInventoryModel>(
    {
        company_id: { type: String, require: true },
        name: { type: String, default: null },
        code: { type: String, default: null },
        price: { type: String, default: null },
        quantity: { type: String, default: '0' },
        quantity_sold: { type: String, default: '0' },
        discount: { type: String, default: '0' },
        date: {type: String, default: null}
    },
    { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator);
schema.plugin(privateValidator);

schema.methods.toInventoryJSON = async function () {
    const { _id, name,
        code,
        price,
        quantity,
        quantity_sold,
        discount, company_id, date } = this

    return {
        id: _id,
        name,
        code,
        price,
        quantity,
        quantity_sold,
        discount,
        company_id,
        date
    }
}


export const Inventory = model<IInventoryModel>('Inventory', schema)
