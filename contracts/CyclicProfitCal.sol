// SPDX-ense-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./interfaces/IWineryPair.sol";
import "./interfaces/IWETH.sol";
import "./libraries/Decimal.sol";
import "./CyclicLibrary.sol";
import "hardhat/console.sol";

interface IFlashswapV2 {
  function startSwapInMultiPool(
    Pool[] memory poolPath,
    address baseToken,
    uint256 debtAmount
  ) external;
}

contract CyclicProfitCalculator {
  address flashSwap;

  constructor(address _flashSwap) {
    flashSwap = _flashSwap;
  }

  function calculateDebt(Pool[] memory poolPath, address baseToken)
    public
    view
    returns (uint256 debt)
  {
    debt = CyclicLibrary.calcDebtForMaximumProfitFromMultiPoolByMergingRecursion(
      poolPath,
      baseToken
    );
  }

  function reloadReservePool(Pool[] memory poolPath) internal view returns (Pool[] memory) {
    for (uint256 i = 0; i < poolPath.length; i++) {
      (poolPath[i].token0Reserve, poolPath[i].token1Reserve, ) = IWineryPair(
        poolPath[i].poolAddress
      ).getReserves();
    }
    return poolPath;
  }

  function startSwapInMultiPool(Pool[] memory poolPath, address baseToken) public {
    Pool[] memory _poolPath = reloadReservePool(poolPath);
    uint256 debt = calculateDebt(_poolPath, baseToken);
    console.log("Debt calculated: ");
    console.log(debt);
    IFlashswapV2(flashSwap).startSwapInMultiPool(_poolPath, baseToken, debt);
  }
}
