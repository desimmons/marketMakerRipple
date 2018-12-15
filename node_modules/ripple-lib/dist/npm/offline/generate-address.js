"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keypairs = require("ripple-keypairs");
const common = require("../common");
const { errors, validate } = common;
function generateAddressAPI(options) {
    validate.generateAddress({ options });
    try {
        const secret = keypairs.generateSeed(options);
        const keypair = keypairs.deriveKeypair(secret);
        const address = keypairs.deriveAddress(keypair.publicKey);
        return { secret, address };
    }
    catch (error) {
        throw new errors.UnexpectedError(error.message);
    }
}
exports.generateAddressAPI = generateAddressAPI;
//# sourceMappingURL=generate-address.js.map