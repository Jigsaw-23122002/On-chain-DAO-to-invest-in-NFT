// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface ICryptoDevDAO {
    function balanceOf(address owner) external view returns (uint256);

    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256);
}
