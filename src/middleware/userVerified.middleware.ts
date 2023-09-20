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

    // user verified
    if (user.is_verified == true) {
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