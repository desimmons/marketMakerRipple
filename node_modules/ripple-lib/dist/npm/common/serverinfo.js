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
const _ = require("lodash");
const utils_1 = require("./utils");
const bignumber_js_1 = require("bignumber.js");
function renameKeys(object, mapping) {
    _.forEach(mapping, (to, from) => {
        object[to] = object[from];
        delete object[from];
    });
}
function getServerInfo() {
    return this.request('server_info').then(response => {
        const info = utils_1.convertKeysFromSnakeCaseToCamelCase(response.info);
        renameKeys(info, { hostid: 'hostID' });
        if (info.validatedLedger) {
            renameKeys(info.validatedLedger, {
                baseFeeXrp: 'baseFeeXRP',
                reserveBaseXrp: 'reserveBaseXRP',
                reserveIncXrp: 'reserveIncrementXRP',
                seq: 'ledgerVersion'
            });
            info.validatedLedger.baseFeeXRP =
                info.validatedLedger.baseFeeXRP.toString();
            info.validatedLedger.reserveBaseXRP =
                info.validatedLedger.reserveBaseXRP.toString();
            info.validatedLedger.reserveIncrementXRP =
                info.validatedLedger.reserveIncrementXRP.toString();
        }
        return info;
    });
}
exports.getServerInfo = getServerInfo;
// This is a public API that can be called directly.
// This is not used by the `prepare*` methods. See `src/transaction/utils.ts`
function getFee(cushion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cushion === undefined) {
            cushion = this._feeCushion;
        }
        if (cushion === undefined) {
            cushion = 1.2;
        }
        const serverInfo = (yield this.request('server_info')).info;
        const baseFeeXrp = new bignumber_js_1.default(serverInfo.validated_ledger.base_fee_xrp);
        let fee = baseFeeXrp.times(serverInfo.load_factor).times(cushion);
        // Cap fee to `this._maxFeeXRP`
        fee = bignumber_js_1.default.min(fee, this._maxFeeXRP);
        // Round fee to 6 decimal places
        return (new bignumber_js_1.default(fee.toFixed(6))).toString(10);
    });
}
exports.getFee = getFee;
//# sourceMappingURL=serverinfo.js.map