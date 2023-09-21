import { Expose } from "class-transformer";
import { IsDefined, Matches } from "class-validator";

export class InventoryDto {
    @IsDefined()
    @Expose()
    productName: String;

    @IsDefined()
    @Expose()
    productPrice: String;

    @IsDefined()
    @Expose()
    quantityAmount: String;

    @Expose()
    quantitySold: String;

    @Expose()
    discountAvailable: String;
}