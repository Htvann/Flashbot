import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { utils } from "ethers/lib/ethers"
import { MockERC20 } from "../../typechain"
import { getBaseToken } from "../../db"

task("check-erc-balance", "Prints erc 20 of account")
  .addParam("account", "Account address")
  .addOptionalParam("erc20", "Address of erc20 ")
  .addOptionalParam("dbname", "Database name")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const account: string = utils.getAddress(taskArgs.account)
    // const erc20: string = utils.getAddress(taskArgs.erc20)
    const dbName: string | undefined = taskArgs.dbname
    const erc20: string[] = !taskArgs.erc20
      ? (await getBaseToken(dbName ?? hre.network.name)).map((item) => item.address)
      : [taskArgs.erc20]

    for (let index = 0; index < erc20.length; index++) {
      const element = erc20[index]
      const erc20Contract: MockERC20 = await hre.ethers.getContractAt("MockERC20", element)
      console.log(`${element}:  ${(await erc20Contract.balanceOf(account)).toString()}`)
    }
  })
