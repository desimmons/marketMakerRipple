import { isValidAddress } from 'ripple-address-codec';
import { isValidSecret } from './utils';
declare function schemaValidate(schemaName: string, object: any): void;
export { schemaValidate, isValidSecret, isValidAddress };
