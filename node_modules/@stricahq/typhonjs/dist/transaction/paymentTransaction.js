"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentTransaction = void 0;
const Transaction_1 = __importDefault(require("./Transaction"));
const paymentTransaction = ({ inputs, outputs, changeAddress, auxiliaryData, ttl, protocolParams, }) => {
    const transaction = new Transaction_1.default({ protocolParams });
    // Add Outputs
    outputs.forEach((output) => {
        transaction.addOutput(output);
    });
    transaction.setTTL(ttl);
    if (auxiliaryData) {
        transaction.setAuxiliaryData(auxiliaryData);
    }
    return transaction.prepareTransaction({ inputs, changeAddress });
};
exports.paymentTransaction = paymentTransaction;
exports.default = exports.paymentTransaction;
