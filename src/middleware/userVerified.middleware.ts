import ApiError from "@/helper/ApiError";
import { User } from "@/models/user.model";
import httpStatus from "http-status";

export const UserVerification = async (req: any, res: any, next: any) => {

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
        res.status(httpStatus.NOT_FOUND).json(
            {
                code: httpStatus.NOT_FOUND,
                message: 'User not found'
            });
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // user not verified
    if (user.is_email_verified == false) {
        res.status(httpStatus.UNAUTHORIZED).json(
            {
                code: httpStatus.UNAUTHORIZED,
                message: 'User not verified'
            });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not verified');
    }

    // user not active
    if (user.is_active == false) {
        res.status(httpStatus.FORBIDDEN).json(
            {
                code: httpStatus.FORBIDDEN,
                message: 'User not active'
            });
        throw new ApiError(httpStatus.FORBIDDEN, 'User not active');
    }

    // user not locked
    if (user.is_locked == true) {
        res.status(httpStatus.FORBIDDEN).json(
            {
                code: httpStatus.FORBIDDEN,
                message: 'User not locked'
            });
        throw new ApiError(httpStatus.FORBIDDEN, 'User is locked');
    }

    // user not authorized
    if (user.is_email_verified == true
        || user.is_phone_verified == true
        || user.is_verified == true
    ) {
        next();
    } else {
        res.status(httpStatus.FORBIDDEN).json(
            {
                code: httpStatus.FORBIDDEN,
                message: 'User not authorized'
            });
        throw new ApiError(httpStatus.FORBIDDEN, 'User not authorized');
    }
};