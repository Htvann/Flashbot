import { BigNumber } from "ethers"
import { ObjectId, Document } from "mongodb"
import mongoose from "mongoose"
import { PoolStruct } from "../typechain/contracts/Flashbot.sol/FlashswapMultiPool"
import { Copiable } from "../interface"

export class PoolModel implements Copiable {
  public address: string
  public factory_address: string | undefined
  public token0Address: string
  public token1Address: string
  public token0Reserve: string
  public token1Reserve: string
  public swapFee: number
  public usage: number | undefined
  public index: number | undefined
  public lastUpdateTimeStamp: number | undefined
  public _id: ObjectId | undefined

  constructor(
    address: string,
    token0Address: string,
    token1Address: string,
    token0Reserve: string,
    token1Reserve: string,
    swapFee: number,
    lastUpdate?: number,
    factory_address?: string,
    usage?: number
  ) {
    this.address = address
    this.token0Address = token0Address
    this.token0Reserve = token0Reserve
    this.token1Address = token1Address
    this.token1Reserve = token1Reserve
    this.swapFee = swapFee
    this.lastUpdateTimeStamp = lastUpdate
    this.factory_address = factory_address
    this.usage = usage
    this._id = new mongoose.Types.ObjectId(address.slice(2, 26))
  }

  static fromDocument(doc: Document): PoolModel {
    return new PoolModel(
      doc["address"],
      doc["token0Address"],
      doc["token1Address"],
      doc["token0Reserve"],
      doc["token1Reserve"],
      doc["swapFee"],
      doc["lastUpdate"],
      doc["factory_address"],
      doc["usage"]
    )
  }

  copy(): PoolModel {
    return new PoolModel(
      this.address,
      this.token0Address,
      this.token1Address,
      this.token0Reserve,
      this.token1Reserve,
      this.swapFee,
      this.lastUpdateTimeStamp,
      this.factory_address,
      this.usage
    )
  }

  toPoolStruct(): PoolStruct {
    return {
      poolAddress: this.address,
      token0: this.token0Address,
      token1: this.token1Address,
      token0Reserve: BigNumber.from(this.token0Reserve),
      token1Reserve: BigNumber.from(this.token1Reserve),
      swapFee: BigNumber.from(this.swapFee),
    }
  }
}
