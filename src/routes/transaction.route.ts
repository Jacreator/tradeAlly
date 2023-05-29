import express from "express";
import { TransactionController } from "@/controllers/TransactionController";
import { authenticated } from "@/middleware/authentication";

const router = express.Router();

const { 
    verifyFullerWaveTransaction,
    getTokenFromFlutterWave,
    getSingleTransactionToken
} = new TransactionController();


// router.use(authenticated);

router.get('/verify', verifyFullerWaveTransaction);

router.get('/send-token', getTokenFromFlutterWave);

router.get('/get-token/:ref', getSingleTransactionToken);
export default router;