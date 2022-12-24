import express from "express";

import { AirtimeController } from "@/controllers/AirtimeController";
import { keyVerified } from "@/middleware/keyVerified.middleware";

const router = express.Router();

const {
    getWalletBalance
} = new AirtimeController;

router.get('/flutterwave-balance', keyVerified, getWalletBalance);


export default router;