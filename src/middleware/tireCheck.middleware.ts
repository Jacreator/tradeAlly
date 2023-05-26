import { TIRE_LEVELS } from "@/config/constants";
import ApiError from "@/helper/ApiError";
import { User } from "@/models/user.model";
import httpStatus from "http-status";

export const TireCheck = async (req: any, res: any, next: any) => {

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
        res.status(httpStatus.NOT_FOUND).json(
            {
                code: httpStatus.NOT_FOUND,
                message: 'User not found'
            });
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const amount = parseInt(req.body.amount);
    try {
        switch (user.tire) {
            case 'silver':
                if (amount <= TIRE_LEVELS.sliver) {
                    next();
                }
                break;
            case 'gold':
                if (amount <= TIRE_LEVELS.gold) {
                    next();
                }
                break;
            case 'platinum':
                if (amount >= TIRE_LEVELS.platinum || amount <= TIRE_LEVELS.platinum) {
                    next();
                }
                break;
            default:
                throw new ApiError(httpStatus.UNAUTHORIZED, "tier failing");
        }
    } catch (error) {
        // next(error);
        res.status(httpStatus.UNAUTHORIZED).json({
            code: httpStatus.UNAUTHORIZED,
            message: error.message
        });
    }

};