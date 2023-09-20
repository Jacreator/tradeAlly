import ApiError from '@/helper/ApiError';
import { AirtimeServices } from '@/services/BaseService';
import httpStatus from 'http-status';

export class BaseController {
  

  constructor() {
    
  }

  

  /**
   * Get all bills Categories
   *
   * @route GET /api/v1/
   * @param {any} req
   * @param {any} res
   * @param { any } next
   * @group Airtime
   * @returns {object} 200 - An array of bills categories
   * @memberOf AirtimeController
   */
  freeFunction = async (req: any, res: any, next: any) => {
    try {
      res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: '',
        data: {
        },
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };
}
