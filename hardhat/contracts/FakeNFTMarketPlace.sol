// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract FakeNFTMarketPlace {
    mapping(uint256 => address) public tokens;
    uint256 public nftPrice = 0.1 ether;

    function purchase(uint256 _tokenId) external payable {
        require(msg.value == nftPrice, "This NFT cost 0.1 Ether");
        tokens[_tokenId] = msg.sender;
    }

    function getPrice() external view returns (uint256) {
        return nftPrice;
    }

    function available(uint256 _tokenId) external view returns (bool) {
        if (tokens[_tokenId] == address(0)) {
            return true;
        }
        return false;
    }
}
