import express from "express";

// local files
import { AirtimeController } from "@/controllers/AirtimeController";
import { authenticated } from "@/middleware/authentication";

const router = express.Router();

const {
  initiateAirtime,
  verifyTransaction,
  getCategory,
  airtimeLessThan10k,
  billPayment,
  getBillsCategories,
  getWalletBalance,
  verifyFullerWaveTransaction
} = new AirtimeController;

router.use(authenticated);

router.get('/bills-category', getCategory);

router.get('/bills/categories', getBillsCategories);

router.post('/initiate', initiateAirtime);

router.post('/verify-trans', verifyTransaction);

router.post('/one-way', airtimeLessThan10k);

router.post('/bill-payment', billPayment);

router.get('/flutterwave-balance', getWalletBalance);

router.get('/balance', getWalletBalance);

router.get('/verify', verifyFullerWaveTransaction);

export default router;