import { ObjectId, Document } from "mongodb"
import mongoose from "mongoose"
import axios, { AxiosResponse } from "axios"
import { WineryERC20 } from "../typechain"

export class TokenModel {
  public address: string
  public _id: ObjectId | undefined
  public isFrequentToken: boolean | undefined
  public isBaseToken: boolean | undefined
  public toNativePrice: number | undefined
  public lastUpdate: number | undefined
  public ignoreDuration: number | undefined
  public name: string | undefined
  public countsExist: number | undefined

  constructor(
    address: string,
    countsExist?: number,
    isFrequentToken?: boolean,
    name?: string,
    ignoreDuration?: number,
    lastUpdate?: number,
    toNativePrice?: number
  ) {
    this.address = address
    this.name = name
    this.ignoreDuration = ignoreDuration
    this.lastUpdate = lastUpdate
    this.toNativePrice = toNativePrice
    this.countsExist = countsExist
    this.isFrequentToken = isFrequentToken
    try {
      this._id = new mongoose.Types.ObjectId(address.slice(2, 26))
    } catch (error) {
      console.log(error)
      console.log(address.length)
      console.log(address)
    }
  }

  static fromDocument(doc: Document): TokenModel {
    return new TokenModel(
      doc["address"],
      doc["countsExist"],
      doc["isFrequentToken"],
      doc["name"],
      doc["ignoreDuration"],
      doc["lastUpdate"],
      doc["toNativePrice"]
    )
  }

  async update() {
    console.log(`Update token ${this.name}`)
    const api = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BNB&CMC_PRO_API_KEY=${process.env.COINMARKETCAP_API_KEY}&convert=${this.name}`
    try {
      const result: AxiosResponse = await axios.get(api)
      this.toNativePrice = 1 / result.data.data.BNB.quote[`${this.name}`].price
      this.lastUpdate = Date.now()
    } catch (error) {
      console.log(error)
    }
  }
}
