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
enum Vote {
    YAY,
    NAY
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
    modifier activeProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline > block.timestamp,
            "DEADLINE EXCEEDED"
        );
        _;
    }
    modifier inactiveProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline <= block.timestamp,
            "DEADLINE NOT EXCEEDED"
        );
        require(
            proposals[proposalIndex].executed == false,
            "PROPOSAL_ALREADY_EXECUTED"
        );
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

    function voteOnProposal(uint256 proposalIndex, Vote vote)
        external
        nftHolderOnly
        activeProposalOnly(proposalIndex)
    {
        Proposal storage proposal = proposals[proposalIndex];
        uint256 voterNFTBalance = cryptoDevDAO.balanceOf(msg.sender);
        uint256 numVotes = 0;

        for (uint256 i = 0; i < voterNFTBalance; i++) {
            uint256 tokenId = cryptoDevDAO.tokenOfOwnerByIndex(msg.sender, i);
            if (proposal.voters[tokenId] == false) {
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }
        require(numVotes > 0, "ALREADY VOTED");
        if (vote == Vote.YAY) {
            proposal.yayVotes += numVotes;
        } else {
            proposal.nayVotes += numVotes;
        }
    }

    function executeProposal(uint256 proposalIndex)
        external
        nftHolderOnly
        inactiveProposalOnly(proposalIndex)
    {
        Proposal storage proposal = proposals[proposalIndex];
        if (proposal.yayVotes > proposal.nayVotes) {
            uint256 nftPrice = nftMarketPlace.getPrice();
            require(address(this).balance >= nftPrice, "NOT ENOUGH FUNDS");
            nftMarketPlace.purchase{value: nftPrice}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    function withdrawEther() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw; contract balance empty");
        payable(owner()).transfer(amount);
    }

    receive() external payable {}

    fallback() external payable {}
}
