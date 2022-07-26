import express from "express";

// local files
import { AirtimeController } from "@/controllers/AirtimeController";
import { authenticated } from "@/middleware/authentication";

const router = express.Router();

const {
  initiateAirtime,
  verifyTransaction,
  getBeneficiaries,
} = new AirtimeController;

router.use(authenticated);

router.get('/bills-category', getBeneficiaries);

router.post('/initiate', initiateAirtime);

router.post('/verify-trans', verifyTransaction);

export default router;