import ApiError from '@/helper/ApiError';
import { BaseService } from '@/services/BaseService';
import httpStatus from 'http-status';

export class BaseController {
  public baseService: any;
  constructor() {
    this.baseService = new BaseService();
  }

  /**
   * Store a collection of user
   *
   * @route POST /api/v1/base
   * @param {any} req
   * @param {any} res
   * @param { any } next
   * @group Base
   * @returns {object} 200 - An array of User
   * @memberOf BaseController
   */
  store = async (req: any, res: any, next: any) => {
    try {
      const {
        firstName,
        middleName,
        lastName,
        emailAddress,
        phoneNumber,
        occupation,
      } = req.body;

      return res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: 'stored successfully',
        data: await this.baseService.create({
          firstName,
          middleName,
          lastName,
          emailAddress,
          phoneNumber,
          occupation
        }),
      });
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };

  getAll = async (req: any, res: any, next: any) => {
    try {
      return res.status(httpStatus.OK).json({
        code: httpStatus.OK,
        message: "users data fetched",
        data: await this.baseService.all()
      })
    } catch (error) {
      next(error);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
    }
  };
}
