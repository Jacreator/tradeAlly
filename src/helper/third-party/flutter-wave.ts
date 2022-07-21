import { FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY } from "@/config";

export class FlutterWaveService {
  /**
   * Get Flutter wave Public Key
   * 
   * @returns {string}
   * @memberof FlutterWaveService
   */
  getPublicKey = () => {
    return FLUTTERWAVE_PUBLIC_KEY;
  }
  /**
   * Get Flutter wave Secret Key
   * 
   * @returns {string}
   * @memberof FlutterWaveService
   */
  getSecretKey = () => {
    return FLUTTERWAVE_SECRET_KEY;
  }

  /**
   * Get Flutter wave bills category
   * 
   * @returns {string}
   * @memberof FlutterWaveService
   * @param {string} category
   */
  getBillsCategory = (category: string) => {
    
  }
}