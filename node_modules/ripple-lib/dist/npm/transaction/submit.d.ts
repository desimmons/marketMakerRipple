import { RippleAPI } from '..';
export interface FormattedSubmitResponse {
    resultCode: string;
    resultMessage: string;
}
declare function submit(this: RippleAPI, signedTransaction: string): Promise<FormattedSubmitResponse>;
export default submit;
