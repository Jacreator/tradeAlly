import express from "express";

import { validationMw } from "@/middleware/validation.middleware";
import { InventoryDto } from "@/dtos/InventoryDto";
import { InventoryController } from "@/controllers/InventoryController";
import { keyVerified } from "@/middleware/keyVerified.middleware";

const router = express.Router();

const {
    create,
    getAll,
    getOne,
    updateProductQuantity,
    getTotalValue
} = new InventoryController();



router.use(keyVerified);
router.post('/', validationMw(InventoryDto), create);
router.post('/analytic', getTotalValue);
router.get('/', getAll);
router.get('/:code', getOne)
router.put('/update', updateProductQuantity);

export default router;