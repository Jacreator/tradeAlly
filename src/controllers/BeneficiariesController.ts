import { Beneficiary } from "@/models/Beneficary.model";
import httpStatus from "http-status";

export class BeneficiariesController {

    /**
     * Get all beneficiaries that are not deleted
     * 
     * @route GET api/v1/beneficiaries
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * 
     * @returns {Promise<beneficiaries>}
     * 
     * @memberOf BeneficiariesController
     */
    getAllBeneficiaries = async (req: any, res: any, next: any) => {
        try {
            const beneficiaries = await Beneficiary.find({ is_deleted: false });
            return res.status(httpStatus.OK).json(beneficiaries);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Get beneficiary by id
     * 
     * @route GET api/v1/beneficiaries/:id
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * 
     * @returns {Promise<beneficiaries>}
     * @memberOf BeneficiariesController
     */
    getBeneficiaryByUser = async (req: any, res: any, next: any) => {
        try {
            const beneficiaries = await Beneficiary.find({ user_id: req.params.id, is_deleted: false });
            return res.status(httpStatus.OK).json(beneficiaries);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * Delete beneficiary by id
     * 
     * @route DELETE api/v1/beneficiaries/:id
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * 
     * @returns {Promise<beneficiaries>}
     * @memberOf BeneficiariesController
     */
    deleteBeneficiary = async (req: any, res: any, next: any) => {
        try {
            const beneficiary = await Beneficiary.findOne({user_id: req.params.id});
            beneficiary.is_deleted = true;
            await beneficiary.save();
            return res.status(httpStatus.OK).json(beneficiary);
        } catch (error) {
            return next(error);
        }
    }
}