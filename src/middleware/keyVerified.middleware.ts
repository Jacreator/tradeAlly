import ApiError from "@/helper/ApiError";
import { UserKey } from "@/models/userKey.model";
import httpStatus from "http-status";

export const keyVerified = async (req: any, res: any, next: any) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecret = req.headers['x-api-secret'];
        const keys = await UserKey.findOne({ key: apiKey, secret: apiSecret });
        if (keys && apiKey === keys.key && apiSecret === keys.secret) {
            next();
        } else {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid API key or secret');
        }
    } catch (error) {
        next(error);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid API key or secret');
    }
}