import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { DBConnector, getBaseToken, getFrequentToken } from "../../db"
import { CyclicPathGenerator } from "../../class/cyclic_path_generator"
import { int } from "hardhat/internal/core/params/argumentTypes"

task("generate-cyclic", "Generate cyclic pool")
  .addOptionalParam(
    "cycliclength",
    "The length of cyclic, it should >= 3 and < 6 ortherwise if will take alot of time, if not set default will be [3, 4]",
    undefined,
    int
  )
  .addOptionalParam(
    "basetoken",
    "The address of basetoken, if not set any the task will go all base token exist in db",
    ""
  )
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    let frequentToken = await getFrequentToken(hre.network.name)
    // console.log(taskArgs.basetoken)
    let baseToken =
      taskArgs.basetoken == ""
        ? (await getBaseToken(hre.network.name)).map((item) => item.address)
        : [taskArgs.basetoken]

    let cyclicPathLength = taskArgs.cycliclength ? [taskArgs.cycliclength] : [3, 4]

    const db = await DBConnector.connectToDatabase(hre.network.name)

    const cylic = new CyclicPathGenerator(baseToken, frequentToken, hre, cyclicPathLength, db)

    await cylic.execute()

    // for (let index = 0; index < baseToken.length; index++) {
    //   const current = baseToken[index]
    //   console.log(current)
    //   let startTime = performance.now()

    //   let allTokenPath: any[] = generateTokenPath(
    //     frequentToken.map((item) => item.address),
    //     taskArgs.cycliclength,
    //     current
    //   )

    // const validPoolPath = await generateValidPoolPath(
    //   allTokenPath,
    //   reloadPoolToToken,
    //   hre.network.name
    // )

    //   let allValidPathModel = validPoolPath.map(
    //     (item) => new PathModel(hre.network.name, item, current)
    //   )

    //   let db = await DBConnector.connectToDatabase(hre.network.name)

    //   let promisePushPath: Promise<any>[] = []

    //   for (let i = 0; i < allValidPathModel.length; i++) {
    //     const element = allValidPathModel[i]
    //     promisePushPath.push(
    //       db
    //         .collection("path")
    //         .updateOne(
    //           { _id: new ObjectId(element._id) },
    //           { $set: { ...element, length: element.path.length, active: true } },
    //           { upsert: true }
    //         )
    //     )
    //   }

    //   await Promise.all(promisePushPath)

    //   let endTime = performance.now()
    //   console.log(
    //     `generate and save ${validPoolPath.length} paths to db took ${
    //       endTime - startTime
    //     } milliseconds at baseToken ${current}`
    //   )
    // }
  })
