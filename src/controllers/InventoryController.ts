import ApiError from "@/helper/ApiError";
import { InventoryService } from "@/services/InventoryService";
import httpStatus from "http-status";

export class InventoryController {
    public inventoryService: any;
    constructor() {
        this.inventoryService = new InventoryService();
    }

    create = async (req: any, res: any, next: any) => {
        try {
            const {
                productName,
                productPrice,
                quantityAmount,
                quantitySold,
                discountAvailable
            } = req.body;
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.inventoryService.create({
                    productName,
                    productPrice,
                    quantityAmount,
                    quantitySold,
                    discountAvailable
                })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    getAll = async (req: any, res: any, next: any) => {
        try {
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.inventoryService.all()
            });
        } catch (error) {
            next(error)
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    getOne = async (req: any, res: any, next: any) => {
        try {
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.inventoryService.getOne({code: req.params.code})
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}