
import ApiError from '@/helper/ApiError';
import { User } from '@/models/user.model';

import httpStatus from 'http-status';

export class BaseService {

  constructor() {
  }

  all = async () => {
    try {
      return await User.find();
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  };

  create = async (payload: any) => {
    try {
      const cleanData = {
        first_name: payload.firstName,
        middle_name: payload.middleName,
        last_name: payload.lastName,
        email: payload.emailAddress,
        phone: payload.phoneNumber,
        occupation: payload.occupation,
      }
      return await User.create(cleanData);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }
}
