import { FactoryModel } from "../models"
import { WineryFactory } from "../typechain"
// import { ethers } from "hardhat"
import { Copiable } from "../interface"
// import { HardhatRuntimeEnvironment } from "hardhat/types"

export class Factory implements Copiable {
  public model: FactoryModel
  public contract: WineryFactory
  // public pool: Pool[]

  constructor(model: FactoryModel, contract: WineryFactory) {
    this.model = model
    this.contract = contract
  }

  copy(): Factory {
    return new Factory(this.model.copy(), this.contract)
  }

  // static async fromModel(model: FactoryModel, hre: HardhatRuntimeEnvironment): Promise<Factory> {
  //   const contract: WineryFactory = await hre.ethers.getContractAt("WineryFactory", model.address)
  //   return new Factory(model, contract)
  // }
}
