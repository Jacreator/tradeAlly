import { Expose } from "class-transformer";
import { IsDefined, Matches } from "class-validator";

export class AccountDto {
    @IsDefined()
    @Expose()
    @Matches(RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    emailAddress: String;

    @IsDefined()
    @Expose()
    companyName: String;

    @IsDefined()
    @Expose()
    type: String;
}