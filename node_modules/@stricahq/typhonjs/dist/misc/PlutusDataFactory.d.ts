/// <reference types="node" />
import { Buffer } from "buffer";
import { PlutusData } from "../types";
export declare class PlutusDataFactory {
    private plutusData;
    private _cbor;
    private _plutusDataHash;
    constructor(plutusData: PlutusData);
    cbor(): Buffer;
    plutusDataHash(): Buffer;
    json(): PlutusData;
}
export default PlutusData;
