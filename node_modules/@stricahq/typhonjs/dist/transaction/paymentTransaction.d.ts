import Transaction from "./Transaction";
import { CardanoAddress, Output, Input, ProtocolParams, AuxiliaryData } from "../types";
export declare const paymentTransaction: ({ inputs, outputs, changeAddress, auxiliaryData, ttl, protocolParams, }: {
    inputs: Array<Input>;
    outputs: Array<Output>;
    changeAddress: CardanoAddress;
    auxiliaryData?: AuxiliaryData | undefined;
    ttl: number;
    protocolParams: ProtocolParams;
}) => Transaction;
export default paymentTransaction;
