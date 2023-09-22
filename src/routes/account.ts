import express from "express";

import { AccountController } from "@/controllers/AccountController";
import { validationMw } from "@/middleware/validation.middleware";
import { AccountDto } from "@/dtos/AccountDto";

const router = express.Router();

const {
    create,
    getAll
} = new AccountController;

router.post('/', validationMw(AccountDto), create);
router.get('/', getAll);


export default router;