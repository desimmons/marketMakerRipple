export declare type ComputeLedgerHashOptions = {
    computeTreeHashes?: boolean;
};
declare function computeLedgerHash(ledger: any, options?: ComputeLedgerHashOptions): string;
export default computeLedgerHash;
