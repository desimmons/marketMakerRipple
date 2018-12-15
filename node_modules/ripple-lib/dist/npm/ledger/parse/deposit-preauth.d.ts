export declare type FormattedDepositPreauth = {
    authorize: string;
    unauthorize: string;
};
declare function parseDepositPreauth(tx: any): FormattedDepositPreauth;
export default parseDepositPreauth;
