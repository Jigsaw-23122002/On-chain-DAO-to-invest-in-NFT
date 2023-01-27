const { ethers } = require("hardhat");
const { CRYPTODEV_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const FakeNFTMarketPlace = await ethers.getContractFactory("FakeNFTMarketPlace");
  const fakeNFTMarketPlace = await FakeNFTMarketPlace.deploy();
  await fakeNFTMarketPlace.deployed();

  console.log(
    "Fake NFT market place deployed to address : ",
    fakeNFTMarketPlace.address
  );

  const CryptoDevDAO = await ethers.getContractFactory("CryptoDevDAO");
  const cryptoDevDAO = await CryptoDevDAO.deploy(
    fakeNFTMarketPlace.address,
    CRYPTODEV_NFT_CONTRACT_ADDRESS,
    {
      value: ethers.utils.parseEther("0.5"),
    }
  );
  await cryptoDevDAO.deployed();

  console.log("Crypto Dev DAO deployed to address : ", cryptoDevDAO.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
