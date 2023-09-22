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
                discountAvailable,
                companyID,
                addedDate
            } = req.body;
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.inventoryService.create({
                    productName,
                    productPrice,
                    quantityAmount,
                    quantitySold,
                    discountAvailable,
                    companyID,
                    addedDate
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
                data: await this.inventoryService.getOne({ code: req.params.code })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    updateProductQuantity = async (req: any, res: any, next: any) => {
        try {
            const {
                companyID, code, productQuantity
            } = req.body
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.inventoryService.updateProduct({ code, companyID, productQuantity })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    getTotalValue = async (req: any, res: any, next: any) => {
        try {
            const {
                companyId,
                startOfDay,
                endOfDay
            } = req.body
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.inventoryService.totalValue({
                    companyId,
                    startOfDay,
                    endOfDay })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}