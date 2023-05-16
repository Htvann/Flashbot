import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { TokenModel } from "../../models"
import { DBConnector, checkFrequentToken } from "../../db"
import { ObjectId } from "mongodb"
import { WineryERC20 } from "../../typechain"
import { boolean, int } from "hardhat/internal/core/params/argumentTypes"
import axios, { AxiosResponse } from "axios"

task("analyze-token", "Analyze token for setting frequent and base token")
  .addOptionalParam("testing", "Is this testing enviroment", false, boolean)
  .addOptionalParam(
    "frequentbysort",
    "Get first $frequentbysort token sort by descending count_exist and mark those at frequent token",
    100,
    int
  )
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    await checkFrequentToken(hre.network.name, taskArgs.testing)
    if (!taskArgs.testing) {
      const db = await DBConnector.connectToDatabase(hre.network.name)

      const allTokenSorted: TokenModel[] = (
        await db.collection("token").find().sort({ countsExist: -1 }).toArray()
      ).map((item) => TokenModel.fromDocument(item))

      for (let index = 0; index < allTokenSorted.length; index++) {
        if (index <= taskArgs.frequentbysort) {
          await setFrequentToken(allTokenSorted[index], hre)
          await checkBaseToken(allTokenSorted[index])
        } else {
          allTokenSorted[index].isFrequentToken = false
          allTokenSorted[index].isBaseToken = false
        }
        await db
          .collection("token")
          .updateOne(
            { _id: new ObjectId(allTokenSorted[index]._id) },
            { $set: allTokenSorted[index] },
            { upsert: true }
          )
      }
    }
  })

async function setFrequentToken(model: TokenModel, hre: HardhatRuntimeEnvironment) {
  console.log("set frequent")
  let contract: WineryERC20 = await hre.ethers.getContractAt("WineryERC20", model.address)
  try {
    model.name = await contract.symbol()
    model.isFrequentToken = true
  } catch (e) {
    console.log(e)
  }
}

async function checkBaseToken(model: TokenModel) {
  console.log("check base")
  await new Promise((res) => setTimeout(res, 1000))
  console.log("query price")
  const api = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BNB&CMC_PRO_API_KEY=${process.env.COINMARKETCAP_API_KEY}&convert=${model.name}`
  try {
    const result: AxiosResponse = await axios.get(api)
    if (result.data.data.BNB.quote[`${model.name}`].price) {
      model.toNativePrice = 1 / result.data.data.BNB.quote[`${model.name}`].price
      model.lastUpdate = Date.now()
      model.isBaseToken = true
      model.ignoreDuration = 360000
    }
  } catch (error) {
    console.log(model.address)
    console.log(error)
  }
}
