// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevDAO.sol";
import "./IFakeNFTMarketPlace.sol";

struct Proposal {
    uint256 nftTokenId;
    uint256 deadline;
    uint256 yayVotes;
    uint256 nayVotes;
    bool executed;
    mapping(uint256 => bool) voters;
}

contract CryptoDevDAO is Ownable {
    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;

    ICryptoDevDAO cryptoDevDAO;
    IFakeNFTMarketPlace nftMarketPlace;

    modifier nftHolderOnly() {
        require(cryptoDevDAO.balanceOf(msg.sender) > 0, "NOT_A_DAO_MEMBER");
        _;
    }

    constructor(address _nftMarketPlace, address _cryptoDevDAO) payable {
        cryptoDevDAO = ICryptoDevDAO(_cryptoDevDAO);
        nftMarketPlace = IFakeNFTMarketPlace(_nftMarketPlace);
    }

    function createProposal(uint256 _nftTokenId)
        external
        nftHolderOnly
        returns (uint256)
    {
        require(nftMarketPlace.available(_nftTokenId), "NFT_NOT_FOR_SALE");
        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;
        numProposals++;
        return numProposals - 1;
    }
}
