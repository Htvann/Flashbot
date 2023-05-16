import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments, network, ethers } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Flashbot", {
    contract: "FlashswapMultiPool",
    from: deployer,
    log: true,
  });

  // const flashbotV2 = await ethers.getContract("Flashbot")

  // await deploy("FlashbotCal", {
  //   contract: "CyclicProfitCalculator",
  //   from: deployer,
  //   log: true,
  //   args: [flashbotV2.address],
  // })
};

export default deployFunction;
deployFunction.tags = [`all`, `flashbot`, `testnet`, `cyclic-test`];
