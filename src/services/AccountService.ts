import { ACCOUNT_TYPE } from "@/config/constants"
import { generateRandomString } from "@/helper"
import ApiError from "@/helper/ApiError";
import { UserKey } from "@/models/userKey.model";
import httpStatus from "http-status";

export class AccountService {


    create = async (payload: any) => {
        try {
            const {
                companyName, emailAddress, type
            } = payload;
            let apiKey = '';
            let apiSecret = '';
            if (payload.type == ACCOUNT_TYPE.production) {
                apiKey = 'TAL_' + await generateRandomString(24);
                apiSecret = 'TAL_' + await generateRandomString(24);
            } else {
                apiKey = 'TAL_SB_' + await generateRandomString(24);
                apiSecret = 'TAL_SB_' + await generateRandomString(24);
            }
            // generate api key and secrete
            const cleanData = {
                name: companyName,
                reference: emailAddress,
                secret: apiSecret,
                key: apiKey,
                type: type
            }
            return await UserKey.create(cleanData)
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }

    all = async () => {
        try {
            return await UserKey.find()
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }
}