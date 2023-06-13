import { BITLY } from "@/config";
import axios from "axios";
import ApiError from "../ApiError";
import httpStatus from "http-status";

export class Bitly {
    public axiosInstance: any;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: BITLY.baseURL,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${BITLY.token}`,
            },
        });
    }

    shortenLink = async (url: string) => {
        try {
            const response = await this.axiosInstance.post(
                '/shorten', JSON.stringify({ "long_url": url, "domain": "bit.ly", "group_guid": "Ba1bc23dE4F" })
            );
            console.log(response);
            return response.link
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, error.message);
        }
    }
}