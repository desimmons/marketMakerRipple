"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const common_1 = require("../../common");
function parseDepositPreauth(tx) {
    assert(tx.TransactionType === 'DepositPreauth');
    return common_1.removeUndefined({
        authorize: tx.Authorize,
        unauthorize: tx.Unauthorize
    });
}
exports.default = parseDepositPreauth;
//# sourceMappingURL=deposit-preauth.js.map