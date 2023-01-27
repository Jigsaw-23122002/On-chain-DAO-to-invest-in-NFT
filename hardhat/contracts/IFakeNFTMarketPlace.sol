// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IFakeNFTMarketPlace {
    function getPrice() external view returns (uint256);

    function purchase(uint256 _tokenId) external payable;

    function available(uint256 _tokenId) external view returns (bool);
}
