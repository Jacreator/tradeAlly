import express from "express";

// local files
import { AirtimeController } from "@/controllers/AirtimeController";
import { authenticated } from "@/middleware/authentication";
import { UserVerification } from "@/middleware/userVerified.middleware";
import { TireCheck } from "@/middleware/tireCheck.middleware";

const router = express.Router();

const {
  initiateAirtime,
  verifyTransaction,
  getCategory,
  airtimeLessThan10k,
  billPayment,
  getBillsCategories,
  getWalletBalance
} = new AirtimeController;

router.use(
  authenticated,
  );


router.get('/bills-category', getCategory);

router.get('/bills/categories', getBillsCategories);

router.post('/initiate', UserVerification,
  TireCheck, initiateAirtime);

router.post('/verify-trans', verifyTransaction);

router.post('/bill-payment', UserVerification,
  TireCheck, billPayment);

router.get('/flutterwave-balance', getWalletBalance);


export default router;