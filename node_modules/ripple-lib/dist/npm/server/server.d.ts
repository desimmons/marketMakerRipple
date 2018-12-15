declare function isConnected(): boolean;
declare function getLedgerVersion(): Promise<number>;
declare function connect(): Promise<void>;
declare function disconnect(): Promise<void>;
declare function formatLedgerClose(ledgerClose: any): object;
export { connect, disconnect, isConnected, getLedgerVersion, formatLedgerClose };
