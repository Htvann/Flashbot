// import { Factory } from "../class/factory"
// import { combineAll } from "./generate-combination"
// import { allProgress } from "./promise-percentage"

// export async function getAllValidPathWithQuickLoad(
//   allPath: string[][],
//   factory: Factory[]
// ): Promise<string[]> {
//   let validPool: string[] = []
//   let validPathQuickLoadPromise: Promise<string[]>[] = []
//   for (let i = 0; i < allPath.length; i++) {
//     validPathQuickLoadPromise.push(getOneValidPathWithQuickLoadV2(allPath[i], factory))
//   }
//   console.log("Quickload pools")
//   const validQuickLoadResult = await allProgress(validPathQuickLoadPromise, (p: any) => {
//     console.log(`% Done = ${p.toFixed(2)}`)
//   })
//   console.log("Finsih quickload pools")
//   for (let i = 0; i < validQuickLoadResult.length; i++) {
//     if (validQuickLoadResult[i].length > 0) {
//       validPool = validPool.concat(validQuickLoadResult[i])
//     }
//   }
//   return validPool
// }

// export async function getOneValidPathWithQuickLoadV2(
//   path: string[],
//   factory: Factory[]
// ): Promise<string[]> {
//   let validPool: string[][] = []
//   let validPath: string[] = []
//   for (let i = 1; i < path.length; i++) {
//     validPool[i - 1] = []
//     for (let f = 0; f < factory.length; f++) {
//       let poolAddress = factory[f].quickLoadPoolAddressFromToken(path[i], path[i - 1])
//       validPool[i - 1].push(poolAddress ?? "")
//     }
//   }
//   const mergePath = combineAll(validPool)
//   for (let i = 0; i < mergePath.length; i++) {
//     let isValid = true
//     for (let j = 0; j < mergePath[i].length; j++) {
//       if (mergePath[i][j] == "" || mergePath[i][j] == mergePath[i][j + 1]) {
//         isValid = false
//         break
//       }
//     }
//     if (isValid) {
//       validPath.push(mergePath[i])
//     }
//   }
//   return validPath
// }
