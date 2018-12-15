import { SignOptions, KeyPair } from './types';
import { RippleAPI } from '../api';
declare function sign(this: RippleAPI, txJSON: string, secret?: any, options?: SignOptions, keypair?: KeyPair): {
    signedTransaction: string;
    id: string;
};
export default sign;
