require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: QUICKNODE_HTTP_URL,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  },
};
