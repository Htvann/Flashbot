/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  ISwapFeeReward,
  ISwapFeeRewardInterface,
} from "../../../contracts/interfaces/ISwapFeeReward";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "address",
        name: "input",
        type: "address",
      },
      {
        internalType: "address",
        name: "output",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "swap",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class ISwapFeeReward__factory {
  static readonly abi = _abi;
  static createInterface(): ISwapFeeRewardInterface {
    return new utils.Interface(_abi) as ISwapFeeRewardInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ISwapFeeReward {
    return new Contract(address, _abi, signerOrProvider) as ISwapFeeReward;
  }
}
