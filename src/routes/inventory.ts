import express from "express";

import { validationMw } from "@/middleware/validation.middleware";
import { InventoryDto } from "@/dtos/InventoryDto";
import { InventoryController } from "@/controllers/InventoryController";

const router = express.Router();

const {
    create,
    getAll,
    getOne
} = new InventoryController();

router.post('/', validationMw(InventoryDto), create);
router.get('/', getAll);
router.get('/:code', getOne)

export default router;