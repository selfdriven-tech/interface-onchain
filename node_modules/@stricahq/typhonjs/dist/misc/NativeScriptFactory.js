"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeScriptFactory = void 0;
const buffer_1 = require("buffer");
const cbors = __importStar(require("@stricahq/cbors"));
const crypto_1 = require("../utils/crypto");
const encoder_1 = require("../utils/encoder");
class NativeScriptFactory {
    constructor(nativeScript) {
        this.nativeScript = nativeScript;
        const encodedNativeScript = (0, encoder_1.encodeNativeScript)(nativeScript);
        this._cbor = cbors.Encoder.encode(encodedNativeScript);
        this._policyId = (0, crypto_1.hash28)(buffer_1.Buffer.from(`00${this._cbor.toString("hex")}`, "hex"));
    }
    cbor() {
        return this._cbor;
    }
    policyId() {
        return this._policyId;
    }
    json() {
        return this.nativeScript;
    }
}
exports.NativeScriptFactory = NativeScriptFactory;
exports.default = NativeScriptFactory;
