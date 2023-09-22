import ApiError from "@/helper/ApiError";
import { SaleService } from "@/services/SaleService";
import httpStatus from "http-status";

export class SalesController {
    public saleService: any;

    constructor() {
        this.saleService = new SaleService();
    }

    createSale = async (req: any, res: any, next: any) => {
        try {
            const {
                code,
                price,
                quantitySold,
                companyId
            } = req.body;
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.saleService.create({
                    code,
                    price,
                    quantitySold,
                    companyId,
                })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }

    getAverage = async (req: any, res:any, next:any) => {
        try {
            const {
                companyId,
                startOfDay,
                endOfDay
            } = req.body
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.saleService.salesAverage({
                    companyId,
                    startOfDay,
                    endOfDay
                })
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}