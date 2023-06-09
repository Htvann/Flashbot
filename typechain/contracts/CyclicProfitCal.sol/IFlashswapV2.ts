/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export type PoolStruct = {
  poolAddress: PromiseOrValue<string>;
  token0: PromiseOrValue<string>;
  token1: PromiseOrValue<string>;
  token0Reserve: PromiseOrValue<BigNumberish>;
  token1Reserve: PromiseOrValue<BigNumberish>;
  swapFee: PromiseOrValue<BigNumberish>;
};

export type PoolStructOutput = [
  string,
  string,
  string,
  BigNumber,
  BigNumber,
  BigNumber
] & {
  poolAddress: string;
  token0: string;
  token1: string;
  token0Reserve: BigNumber;
  token1Reserve: BigNumber;
  swapFee: BigNumber;
};

export interface IFlashswapV2Interface extends utils.Interface {
  functions: {
    "startSwapInMultiPool((address,address,address,uint256,uint256,uint256)[],address,uint256)": FunctionFragment;
  };

  getFunction(nameOrSignatureOrTopic: "startSwapInMultiPool"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "startSwapInMultiPool",
    values: [PoolStruct[], PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(
    functionFragment: "startSwapInMultiPool",
    data: BytesLike
  ): Result;

  events: {};
}

export interface IFlashswapV2 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IFlashswapV2Interface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    startSwapInMultiPool(
      poolPath: PoolStruct[],
      baseToken: PromiseOrValue<string>,
      debtAmount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  startSwapInMultiPool(
    poolPath: PoolStruct[],
    baseToken: PromiseOrValue<string>,
    debtAmount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    startSwapInMultiPool(
      poolPath: PoolStruct[],
      baseToken: PromiseOrValue<string>,
      debtAmount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    startSwapInMultiPool(
      poolPath: PoolStruct[],
      baseToken: PromiseOrValue<string>,
      debtAmount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    startSwapInMultiPool(
      poolPath: PoolStruct[],
      baseToken: PromiseOrValue<string>,
      debtAmount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
