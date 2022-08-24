import express from "express";
import { TransactionController } from "@/controllers/TransactionController";
import { authenticated } from "@/middleware/authentication";

const router = express.Router();

const { 
    verifyFullerWaveTransaction
} = new TransactionController();


router.use(authenticated);

router.get('/verify', verifyFullerWaveTransaction);

export default router;