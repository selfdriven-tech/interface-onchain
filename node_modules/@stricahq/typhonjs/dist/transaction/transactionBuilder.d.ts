import { CardanoAddress, Input, CollateralInput } from "../types";
import Transaction from "./Transaction";
export declare function transactionBuilder({ transaction, inputs, changeAddress, collateralInputs, }: {
    transaction: Transaction;
    inputs: Array<Input>;
    changeAddress: CardanoAddress;
    collateralInputs?: Array<CollateralInput>;
}): Transaction;
export default transactionBuilder;
