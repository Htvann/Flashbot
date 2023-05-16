import { hashMessage } from "@ethersproject/hash"
import { ObjectId } from "mongodb"
import mongoose from "mongoose"
import { Copiable } from "../interface"

export class PathModel {
  public baseToken: string
  public path: string[]
  public _id: ObjectId | undefined

  constructor(network: string, path: string[], baseToken: string) {
    this.baseToken = baseToken
    this.path = path
    this._id = new mongoose.Types.ObjectId(PathModel.convertPathToId(path))
  }

  static convertPathToId(path: string[]): string {
    let id = ""
    const eachLength = 24 / path.length
    for (let i = 0; i < path.length - 1; i++) {
      id += path[i].slice(2, eachLength + 2)
    }
    id += path[path.length - 1].slice(2, 24 - (path.length - 1) * eachLength + 2)
    return id
  }
}
