import { generateRandomString, randomDate } from "@/helper";
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
                discountAvailable,
                companyID,
                addedDate
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
                    code: await generateRandomString(7),
                    company_id: companyID,
                    date: await randomDate()
                };
                const inventoryCreated = await Inventory.create(cleanData);
                inventories.push(inventoryCreated);
            }
            return inventories;
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    all = async (payload: any) => {
        try {
            return await Inventory.find({ company_id: payload.companyId });
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    getOne = async (payload: any) => {
        try {
            return await Inventory.findOne({
                code: payload.code,
                company_id: payload.companyId
            });
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    updateProduct = async (payload: any) => {
        try {
            const {
                companyID, code, productQuantity
            } = payload;
            // find the inventory
            const inventory = await Inventory.findOne({ company_id: companyID, code })
            inventory.quantity = (parseInt(inventory.quantity) + parseInt(productQuantity)).toString()
            return await inventory.save();
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    totalValue = async (payload: any) => {
        try {
            const inventories = await Inventory.find({
                company_id: payload.companyId
            });
            let totalInventories = 0;
            for (const inventory of inventories) {
                totalInventories += parseInt(inventory.price) * parseInt(inventory.quantity)
            }
            return totalInventories;
        } catch (error) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}