import { ObjectId, Document } from "mongodb"
import mongoose from "mongoose"
import { Copiable } from "../interface"

export class FactoryModel implements Copiable {
  public address: string
  public isPoolHaveSwapfee: boolean
  public defaultSwapFee: number
  public poolAddress: string[] | undefined
  public name: string | undefined
  public loadedPool: number
  public allPairsLength: number
  public _id: ObjectId | undefined

  constructor(
    address: string,
    isPoolHaveSwapfee: boolean,
    defaultSwapFee: number,
    allPairsLength: number,
    name?: string,
    poolAddress?: string[],
    loadedPool?: number
  ) {
    this.address = address
    this.isPoolHaveSwapfee = isPoolHaveSwapfee
    this.defaultSwapFee = defaultSwapFee
    this.name = name
    this.poolAddress = poolAddress
    this.allPairsLength = allPairsLength
    this.loadedPool = loadedPool ?? 0
    this._id = new mongoose.Types.ObjectId(address.slice(2, 26))
  }

  static fromDocument(doc: Document): FactoryModel {
    return new FactoryModel(
      doc["address"],
      doc["isPoolHaveSwapfee"],
      doc["defaultSwapFee"],
      doc["allPairsLength"],
      doc["name"],
      doc["poolAddress"],
      doc["loadedPool"]
    )
  }

  copy(): FactoryModel {
    return new FactoryModel(
      this.address,
      this.isPoolHaveSwapfee,
      this.defaultSwapFee,
      this.allPairsLength,
      this.name,
      this.poolAddress,
      this.loadedPool
    )
  }
}
