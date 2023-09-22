import { SalesController } from "@/controllers/SalesController";
import { keyVerified } from "@/middleware/keyVerified.middleware";
import express from "express";


const router = express.Router();

const {
    createSale,
    getAverage
} = new SalesController();

router.use(keyVerified);
router.post('/', createSale);
router.post('/average', getAverage);

export default router;