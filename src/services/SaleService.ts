import ApiError from "@/helper/ApiError";
import httpStatus from "http-status";
import { InventoryService } from '@/services/InventoryService';
import { randomDate } from "@/helper";
import { Sale } from "@/models/sale";

export class SaleService {
    public inventoryService: any;
    constructor() {
        this.inventoryService = new InventoryService();
    }

    create = async (payload: any) => {
        try {
            const {
                code,
                price,
                quantitySold,
                companyId
            } = payload;
            // find the product by code and companyId
            const productSold = await this.inventoryService.getOne({
                code, companyId
            });

            // update the product
            productSold.quantity = (parseInt(productSold.quantity) - parseInt(quantitySold)).toString();
            productSold.quantity_sold = (parseInt(productSold.quantity_sold) + parseInt(quantitySold)).toString();
            productSold.save();

            // create the sale record
            const cleanData = {
                code,
                price,
                quantity_sold: quantitySold,
                company_id: companyId,
                date: await randomDate()
            }

            return await Sale.create(cleanData);
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }

    salesAverage = async (payload: any) => {
        try {
            const {
                companyId,
                startOfDay,
                endOfDay
            } = payload;
            const products = await Sale.find({
                company_id: companyId,
                date: { $gte: startOfDay, $lt: endOfDay }
            });

            let totalPrice = 0;
            for (const product of products) {
                totalPrice += parseInt(product.price) * parseInt(product.quantity_sold);
            }

            const averagePrice = totalPrice / products.length;
            return averagePrice;
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }
}