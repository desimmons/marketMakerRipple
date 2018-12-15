import { FormattedTransactionType } from '../transaction/types';
export declare type TransactionOptions = {
    minLedgerVersion?: number;
    maxLedgerVersion?: number;
    includeRawTransaction?: boolean;
};
declare function getTransaction(id: string, options?: TransactionOptions): Promise<FormattedTransactionType>;
export default getTransaction;
