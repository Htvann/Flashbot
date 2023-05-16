import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy("PancakeF", {
    contract: "WineryFactory",
    from: deployer,
    log: true,
    args: [deployer],
  })

  await deploy("UniswapF", {
    contract: "WineryFactory",
    from: deployer,
    log: true,
    args: [deployer],
  })

  await deploy("WineryF", {
    contract: "WineryFactory",
    from: deployer,
    log: true,
    args: [deployer],
  })
}

export default deployFunction
deployFunction.tags = [`all`, `factory`, `main`, `testnet`, `cyclic-test`]
