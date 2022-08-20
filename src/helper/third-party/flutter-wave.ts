var axios = require('axios');

import httpStatus from 'http-status';
// import { httpStatus } from 'http-status';
import {
  FLUTTERWAVE_URL,
  FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_PUBLIC_KEY,
} from './../../config/index';
const Flutterwave = require('flutterwave-node-v3');

export class FlutterWaveService {
  public axiosInstance: any;
  public flw: any;

  constructor() {
    this.flw = new Flutterwave(FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY);
    this.axiosInstance = axios.create({
      baseURL: FLUTTERWAVE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });
  }

  /**
   * Get Flutter wave bills category
   *
   * @returns {string}
   * @memberof FlutterWaveService
   * @param {string} category
   */
  getBillsCategory = async (category: String) => {
    const response = await this.axiosInstance.get(
      `/bill-categories?${category}=1`,
    );

    if (response.status === httpStatus.OK) {
      return response.data;
    }
    return false;
  };

  /**
   * All bills category
   */
  getAllBillsCategory = async () => {
    const response = await this.axiosInstance.get(`/bill-categories`);
    if (response.status === httpStatus.OK) {
      return response.data;
    }
    return false;
  }

  /**
   * Verify airtime transaction
   */
  verifyNumber = async (payload: any) => {
    const response = await this.flw.Bills.validate(payload);
    console.log(response);
    if (response.status === 'success' || response.status === httpStatus.OK) {
      return response.data;
    }
    return false;
  };

  /**
   * make airtime payment
   */
  makePayment = async (payload: any) => {
    // const response = await this.axiosInstance.post('/bills', payload);

    const response = await this.flw.Bills.create_bill(payload);

      console.log(response);
    if (response.status == "success" || response.status == "pending") {
      return {
        data: response.data,
        status: response.status,
        code: httpStatus.OK,
      };
    }
    return {
      data: response.data,
      status: response.status,
      
    };
  };

  getBalance = async () => {
    // const response = await this.flw.Misc.bal();
    const response = await this.axiosInstance.get('/balances');
    if (response.status == 'success' || response.status == httpStatus.OK) {
      return response.data;
    }
    return false;
  };
}