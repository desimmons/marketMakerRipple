"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const common = require("../common");
exports.common = common;
const txFlags = common.txFlags;
const errors_1 = require("../common/errors");
function formatPrepareResponse(txJSON) {
    const instructions = {
        fee: common.dropsToXrp(txJSON.Fee),
        sequence: txJSON.Sequence,
        maxLedgerVersion: txJSON.LastLedgerSequence === undefined ?
            null : txJSON.LastLedgerSequence
    };
    return {
        txJSON: JSON.stringify(txJSON),
        instructions
    };
}
function setCanonicalFlag(txJSON) {
    txJSON.Flags |= txFlags.Universal.FullyCanonicalSig;
    // JavaScript converts operands to 32-bit signed ints before doing bitwise
    // operations. We need to convert it back to an unsigned int.
    txJSON.Flags = txJSON.Flags >>> 0;
}
function scaleValue(value, multiplier, extra = 0) {
    return (new bignumber_js_1.default(value)).times(multiplier).plus(extra).toString();
}
function prepareTransaction(txJSON, api, instructions) {
    common.validate.instructions(instructions);
    const account = txJSON.Account;
    setCanonicalFlag(txJSON);
    function prepareMaxLedgerVersion() {
        if (instructions.maxLedgerVersion !== undefined) {
            if (instructions.maxLedgerVersion !== null) {
                txJSON.LastLedgerSequence = instructions.maxLedgerVersion;
            }
            return Promise.resolve(txJSON);
        }
        const offset = instructions.maxLedgerVersionOffset !== undefined ?
            instructions.maxLedgerVersionOffset : 3;
        return api.connection.getLedgerVersion().then(ledgerVersion => {
            txJSON.LastLedgerSequence = ledgerVersion + offset;
            return txJSON;
        });
    }
    function prepareFee() {
        const multiplier = instructions.signersCount === undefined ? 1 :
            instructions.signersCount + 1;
        if (instructions.fee !== undefined) {
            const fee = new bignumber_js_1.default(instructions.fee);
            if (fee.greaterThan(api._maxFeeXRP)) {
                const errorMessage = `Fee of ${fee.toString(10)} XRP exceeds ` +
                    `max of ${api._maxFeeXRP} XRP. To use this fee, increase ` +
                    '`maxFeeXRP` in the RippleAPI constructor.';
                throw new errors_1.ValidationError(errorMessage);
            }
            txJSON.Fee = scaleValue(common.xrpToDrops(instructions.fee), multiplier);
            return Promise.resolve(txJSON);
        }
        const cushion = api._feeCushion;
        return api.getFee(cushion).then(fee => {
            return api.connection.getFeeRef().then(feeRef => {
                const extraFee = (txJSON.TransactionType !== 'EscrowFinish' ||
                    txJSON.Fulfillment === undefined) ? 0 :
                    (cushion * feeRef * (32 + Math.floor(new Buffer(txJSON.Fulfillment, 'hex').length / 16)));
                const feeDrops = common.xrpToDrops(fee);
                const maxFeeXRP = instructions.maxFee ?
                    bignumber_js_1.default.min(api._maxFeeXRP, instructions.maxFee) : api._maxFeeXRP;
                const maxFeeDrops = common.xrpToDrops(maxFeeXRP);
                const normalFee = scaleValue(feeDrops, multiplier, extraFee);
                txJSON.Fee = bignumber_js_1.default.min(normalFee, maxFeeDrops).toString(10);
                return txJSON;
            });
        });
    }
    function prepareSequence() {
        return __awaiter(this, void 0, void 0, function* () {
            if (instructions.sequence !== undefined) {
                txJSON.Sequence = instructions.sequence;
                return Promise.resolve(txJSON);
            }
            const response = yield api.request('account_info', {
                account: account
            });
            txJSON.Sequence = response.account_data.Sequence;
            return txJSON;
        });
    }
    return Promise.all([
        prepareMaxLedgerVersion(),
        prepareFee(),
        prepareSequence()
    ]).then(() => formatPrepareResponse(txJSON));
}
exports.prepareTransaction = prepareTransaction;
function convertStringToHex(string) {
    return new Buffer(string, 'utf8').toString('hex').toUpperCase();
}
exports.convertStringToHex = convertStringToHex;
function convertMemo(memo) {
    return {
        Memo: common.removeUndefined({
            MemoData: memo.data ? convertStringToHex(memo.data) : undefined,
            MemoType: memo.type ? convertStringToHex(memo.type) : undefined,
            MemoFormat: memo.format ? convertStringToHex(memo.format) : undefined
        })
    };
}
exports.convertMemo = convertMemo;
//# sourceMappingURL=utils.js.map