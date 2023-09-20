import express from "express";

// local files
import { BaseController } from "@/controllers/BaseController";
import { authenticated } from "@/middleware/authentication";
import { UserVerification } from "@/middleware/userVerified.middleware";

const router = express.Router();

const {
  getAll,
  store
} = new BaseController;

// router.use(
//   authenticated,
//   UserVerification,
//   );


router.get('/', getAll);
router.post('/', store);

export default router;