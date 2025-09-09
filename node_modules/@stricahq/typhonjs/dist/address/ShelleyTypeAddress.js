"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShelleyTypeAddress = void 0;
const buffer_1 = require("buffer");
const bech32_1 = require("bech32");
const types_1 = require("../types");
class ShelleyTypeAddress {
    constructor(networkId, paymentCredential) {
        this.addressHex = "";
        this.addressBytes = buffer_1.Buffer.alloc(0);
        this.addressBech32 = "";
        this.networkId = networkId;
        this._paymentCredential = paymentCredential;
    }
    computeBech32(address) {
        const data = this.networkId === types_1.NetworkId.MAINNET ? "addr" : "addr_test";
        const words = bech32_1.bech32.toWords(address);
        const encoded = bech32_1.bech32.encode(data, words, 1000);
        return encoded;
    }
    get paymentCredential() {
        return this._paymentCredential;
    }
    getHex() {
        return this.addressHex;
    }
    getBytes() {
        return this.addressBytes;
    }
    getBech32() {
        return this.addressBech32;
    }
    getNetworkId() {
        return this.networkId;
    }
}
exports.ShelleyTypeAddress = ShelleyTypeAddress;
exports.default = ShelleyTypeAddress;
