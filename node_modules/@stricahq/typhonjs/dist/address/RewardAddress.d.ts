/// <reference types="node" />
import { Buffer } from "buffer";
import { Credential, NetworkId } from "../types";
export declare class RewardAddress {
    protected _stakeCredential: Credential;
    protected networkId: NetworkId;
    protected addressHex: string;
    protected addressBytes: Buffer;
    protected addressBech32: string;
    constructor(networkId: NetworkId, stakeCredential: Credential);
    protected computeBech32(address: Buffer): string;
    protected computeHex(): void;
    get stakeCredential(): Credential;
    getHex(): string;
    getBytes(): Buffer;
    getBech32(): string;
    getNetworkId(): NetworkId;
}
export default RewardAddress;
