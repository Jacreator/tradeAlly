import express from "express";

import { AirtimeController } from "@/controllers/AirtimeController";
import { keyVerified } from "@/middleware/keyVerified.middleware";
import { BeneficiariesController } from "@/controllers/BeneficiariesController";

const router = express.Router();

const {
    getWalletBalance
} = new AirtimeController;

const {
    getAllBeneficiaries,
} = new BeneficiariesController;

router.get('/flutterwave/balance', keyVerified, getWalletBalance);

router.get('/', getAllBeneficiaries)


export default router;