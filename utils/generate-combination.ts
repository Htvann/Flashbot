export function generateCombinations(sourceArray: string[], comboLength: number) {
  const sourceLength = sourceArray.length
  if (comboLength > sourceLength) return []
  if (comboLength == 1) return [...sourceArray]

  const combos: any[] = [] // Stores valid combinations as they are generated.

  // Accepts a partial combination, an index into sourceArray,
  // and the number of elements required to be added to create a full-length combination.
  // Called recursively to build combinations, adding subsequent elements at each call depth.
  const makeNextCombos = (workingCombo: any[], currentIndex: number, remainingCount: number) => {
    const oneAwayFromComboLength = remainingCount == 1

    // For each element that remaines to be added to the working combination.
    for (let sourceIndex = currentIndex; sourceIndex < sourceLength; sourceIndex++) {
      // Get next (possibly partial) combination.
      const next = [...workingCombo, sourceArray[sourceIndex]]

      if (oneAwayFromComboLength) {
        // Combo of right length found, save it.
        combos.push(next)
      } else {
        // Otherwise go deeper to add more elements to the current partial combination.
        makeNextCombos(next, sourceIndex + 1, remainingCount - 1)
      }
    }
  }

  makeNextCombos([], 0, comboLength)
  return combos
}

export const combineAll = (array: any[]) => {
  const res: any[] = []
  let max = array.length - 1
  const helper = (arr: any[], i: number) => {
    for (let j = 0, l = array[i].length; j < l; j++) {
      let copy = arr.slice(0)
      copy.push(array[i][j])
      if (i == max) res.push(copy)
      else helper(copy, i + 1)
    }
  }
  helper([], 0)
  return res
}

export const permutations = (arr: any[]): any[] => {
  if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr
  return arr.reduce(
    (acc, item, i) =>
      acc.concat(
        permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((val) => [item, ...val])
      ),
    []
  )
}

export function generateAllTokenPath(
  sourceArray: string[],
  pathLength: number,
  baseToken: string
): string[][] {
  if (pathLength < 2) {
    throw new Error("Invalid path length")
  }
  if (pathLength > 6) {
    throw new Error("Just dont :))")
  }
  let cloneSrcArray: string[] = [...sourceArray]
  if (pathLength - 2 < 3) {
    cloneSrcArray = cloneSrcArray.filter((item) => item != baseToken)
  }

  let combo = generateCombinations(cloneSrcArray, pathLength - 2)

  console.log("Combo length " + combo.length)

  let path: string[][] = []

  for (let i = 0; i < combo.length; i++) {
    if (pathLength > 3) {
      const permut = permutations(combo[i])
      for (let j = 0; j < permut.length; j++) {
        if (permut[j][0] == baseToken || permut[j][permut[j].length - 1] == baseToken) {
          continue
        }
        path.push([baseToken, ...permut[j], baseToken])
      }
    } else {
      path.push([baseToken, combo[i], baseToken])
    }
  }

  return path
}
