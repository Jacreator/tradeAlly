import express from "express";

// local files
import { AirtimeController } from "@/controllers/AirtimeController";
import { authenticated } from "@/middleware/authentication";

const router = express.Router();

const {
  initiateAirtime
} = new AirtimeController;

router.use(authenticated);

router.post('/initiate', initiateAirtime);

export default router;