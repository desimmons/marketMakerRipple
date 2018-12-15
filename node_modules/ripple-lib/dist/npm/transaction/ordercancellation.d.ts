import { Instructions, Prepare } from './types';
declare function prepareOrderCancellation(address: string, orderCancellation: object, instructions?: Instructions): Promise<Prepare>;
export default prepareOrderCancellation;
