import { Response, Request, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import httpStatus from 'http-status';
import ApiError from "@/helper/ApiError";


export const validationMw = (dtoClass: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const output: any = plainToInstance(dtoClass, req.body);
            validate(output, { skipMissingProperties: true }).then((errors: any) => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    let errorTexts = Array();
                    for (const errorItem of errors) {
                        errorTexts = errorTexts.concat(errorItem.constraints);
                    }
                    return res.status(httpStatus.BAD_REQUEST).json({
                        code: httpStatus.BAD_REQUEST,
                        message: errorTexts
                    });
                } else {
                    res.locals.input = output;
                    next();
                }
            });
        } catch (error) {
            next(error);
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    };
};