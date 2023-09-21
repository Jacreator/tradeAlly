import { generateRandomString } from "@/helper";
import ApiError from "@/helper/ApiError"
import { Inventory } from "@/models/inventory";
import httpStatus from "http-status";

export class InventoryService {
    create = async (payload: any) => {
        try {
            const {
                productName,
                productPrice,
                quantityAmount,
                quantitySold,
                discountAvailable
            } = payload;

            // for the case of test
            let inventories: any[] = []
            for (let index = 0; index < 10; index++) {
                const cleanData = {
                    name: productName,
                    price: productPrice,
                    quantity: quantityAmount + index,
                    quantity_sold: quantitySold,
                    discount: discountAvailable,
                    code: await generateRandomString(7)
                };
                const inventoryCreated = await Inventory.create(cleanData);
                inventories.push(inventoryCreated);
            }
            return inventories;
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    all = async () => {
        try {
            return await Inventory.find();
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    getOne = async (payload: any) => {
        try {
            return await Inventory.findOne({
                code: payload.code
            });
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}