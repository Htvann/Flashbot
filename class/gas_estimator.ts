import { DBConnector } from "../db"
import { TokenModel } from "../models"

export class GasEstimator {
  public gasFee = BigInt(5000000000)

  public baseGas = BigInt(320000)

  public baseLength = BigInt(2)

  public gasToExtraLength = BigInt(110000)

  public gasBaseMapp = new Map<string, bigint>()

  public tokenPrice: Map<string, TokenModel> = new Map<string, TokenModel>()

  private static instance: GasEstimator

  private constructor() {}

  private async init(network: string) {
    const db = await DBConnector.connectToDatabase(network)
    // This should not implement because it's so coupling each others
    ;(await (await db.collection("token").find({ isBaseToken: true })).toArray()).map((item) => {
      const tokenModel = TokenModel.fromDocument(item)
      this.tokenPrice.set(tokenModel.address, tokenModel)
    })
  }

  public calculateGas(address: string, length: number): GasCaculated {
    if (length < this.baseLength) {
      throw new Error("Burh")
    }
    let caculatedBase: bigint | undefined = this.gasBaseMapp.get(address + length.toString())
    let caculatedNative: bigint | undefined
    let tokens = this.tokenPrice.get(address)
    if (!caculatedBase) {
      if (tokens && tokens.toNativePrice && tokens.toNativePrice > 0) {
        const fee: bigint =
          ((this.baseGas + this.gasToExtraLength * (BigInt(length) - BigInt(this.baseLength))) *
            this.gasFee *
            BigInt(1000000000000)) /
          BigInt(parseInt((tokens.toNativePrice * 1000000000000).toString()))

        this.gasBaseMapp.set(address + length.toString(), fee)
        caculatedBase = fee
        caculatedNative =
          (fee * BigInt(parseInt((tokens.toNativePrice * 1000000000000).toString()))) /
          BigInt(1000000000000)
      }
    } else {
      if (tokens && tokens.toNativePrice && tokens.toNativePrice > 0) {
        caculatedNative = (caculatedBase * BigInt(tokens.toNativePrice * 1000)) / BigInt(1000)
      }
    }
    return {
      toNative: caculatedNative,
      toBase: caculatedBase,
    }
  }

  public static async getInstance(network: string): Promise<GasEstimator> {
    if (!GasEstimator.instance) {
      GasEstimator.instance = new GasEstimator()
      await GasEstimator.instance.init(network)
    }
    return GasEstimator.instance
  }
}

export type GasCaculated = {
  toNative: bigint | undefined
  toBase: bigint | undefined
}
