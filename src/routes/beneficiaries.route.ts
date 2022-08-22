import { authenticated } from "@/middleware/authentication";
import express from "express";
import { BeneficiariesController } from './../controllers/BeneficiariesController';

const router = express.Router();

const {
    getAllBeneficiaries,
    getBeneficiaryByUser,
    deleteBeneficiary
} = new BeneficiariesController;

router.use(authenticated)

router.get('/', getAllBeneficiaries);

router.get('/:id', getBeneficiaryByUser);

router.delete('/:id', deleteBeneficiary);


export default router;