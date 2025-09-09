"use strict";
/* eslint-disable no-bitwise */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const bn_js_1 = __importDefault(require("bn.js"));
const pbkdf2_1 = require("pbkdf2");
const Bip32PublicKey_1 = __importDefault(require("./Bip32PublicKey"));
const PrivateKey_1 = __importDefault(require("./PrivateKey"));
const utils_1 = require("./utils");
const EDDSA = require("./ed25519e");
const eddsa = new EDDSA();
class Bip32PrivateKey {
    constructor(xprv) {
        this.xprv = xprv;
    }
    static fromEntropy(entropy) {
        return new Promise((resolve, reject) => {
            pbkdf2_1.pbkdf2("", entropy, 4096, 96, "sha512", (err, xprv) => {
                if (err) {
                    reject(err);
                }
                xprv[0] &= 248;
                xprv[31] &= 0x1f;
                xprv[31] |= 64;
                resolve(new Bip32PrivateKey(xprv));
            });
        });
    }
    derive(index) {
        const kl = this.xprv.slice(0, 32);
        const kr = this.xprv.slice(32, 64);
        const cc = this.xprv.slice(64, 96);
        let z;
        let i;
        if (index < 0x80000000) {
            const data = buffer_1.Buffer.allocUnsafe(1 + 32 + 4);
            data.writeUInt32LE(index, 1 + 32);
            const keyPair = eddsa.keyFromSecret(kl.toString("hex"));
            const vk = buffer_1.Buffer.from(keyPair.pubBytes());
            vk.copy(data, 1);
            data[0] = 0x02;
            z = utils_1.hmac512(cc, data);
            data[0] = 0x03;
            i = utils_1.hmac512(cc, data);
        }
        else {
            const data = buffer_1.Buffer.allocUnsafe(1 + 64 + 4);
            data.writeUInt32LE(index, 1 + 64);
            kl.copy(data, 1);
            kr.copy(data, 1 + 32);
            data[0] = 0x00;
            z = utils_1.hmac512(cc, data);
            data[0] = 0x01;
            i = utils_1.hmac512(cc, data);
        }
        const chainCode = i.slice(32, 64);
        const zl = z.slice(0, 32);
        const zr = z.slice(32, 64);
        const left = new bn_js_1.default(kl, 16, "le")
            .add(new bn_js_1.default(zl.slice(0, 28), 16, "le").mul(new bn_js_1.default(8)))
            .toArrayLike(buffer_1.Buffer, "le", 32);
        let right = new bn_js_1.default(kr, 16, "le")
            .add(new bn_js_1.default(zr, 16, "le"))
            .toArrayLike(buffer_1.Buffer, "le")
            .slice(0, 32);
        if (right.length !== 32) {
            right = buffer_1.Buffer.from(right.toString("hex").padEnd(32, "0"), "hex");
        }
        const xprv = buffer_1.Buffer.concat([left, right, chainCode]);
        return new Bip32PrivateKey(xprv);
    }
    toBip32PublicKey() {
        const keyPair = eddsa.keyFromSecret(this.xprv.slice(0, 32).toString("hex"));
        const vk = buffer_1.Buffer.from(keyPair.pubBytes());
        return new Bip32PublicKey_1.default(buffer_1.Buffer.concat([vk, this.xprv.slice(64, 96)]));
    }
    toBytes() {
        return this.xprv;
    }
    toPrivateKey() {
        const keyPair = eddsa.keyFromSecret(this.xprv.slice(0, 64));
        return new PrivateKey_1.default(buffer_1.Buffer.from(keyPair.privBytes()));
    }
}
exports.default = Bip32PrivateKey;
