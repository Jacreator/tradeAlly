import ApiError from "@/helper/ApiError";
import { AccountService } from "@/services/AccountService";
import httpStatus from "http-status";

export class AccountController {
    public accountService: any;
    constructor() {
        this.accountService = new AccountService();
    }

    create = async (req: any, res: any, next: any) => {
        try {
            const {
                companyName,
                emailAddress,
                type
            } = req.body;
            return res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: "Successfully created",
                data: await this.accountService.create({
                    companyName, emailAddress, type
                })
            })
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
                data: await this.accountService.all()
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    }
}