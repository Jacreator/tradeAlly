import { Schema, Document, model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import privateValidator from 'mongoose-private'

export interface ISale {
    
    code: string
    price: string
    quantity_sold: string
    company_id: string
    date: string
}

export interface ISaleJSON {
    
    code: string
    price: string
    quantity_sold: string
    company_id: string
    date: string
}

export default interface ISaleModel extends Document, ISale {
    toSaleJSON(): ISaleJSON
}

const schema = new Schema<ISaleModel>(
    {
        company_id: { type: String, require: true },
        code: { type: String, require: true },
        price: { type: String, default: null },
        quantity_sold: { type: String, require: true },
        date: { type: String, default: null }
    },
    { timestamps: true },
)

// Plugins
schema.plugin(uniqueValidator);
schema.plugin(privateValidator);

schema.methods.toSaleJSON = async function () {
    const { _id,
        code,
        price,
        quantity_sold,
        company_id, date } = this

    return {
        id: _id,
        code,
        price,
        quantity_sold,
        company_id,
        date
    }
}


export const Sale = model<ISaleModel>('Sales', schema)
