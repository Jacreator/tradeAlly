
import ApiError from '@/helper/ApiError';
import { User } from '@/models/user.model';

import httpStatus from 'http-status';

export class AirtimeServices {

  constructor() {
  }
  all = async () => {
    try {
      return await User.find();;
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  };
}
