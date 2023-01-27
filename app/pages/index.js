import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { Contract, providers } from "ethers";
import {
  CRYPTODEV_DAO_CONTRACT_ADDRESS,
  CRYPTODEV_DAO_ABI,
  CRYPTODEV_NFT_CONTRACT_ADDRESS,
  CRYPTODEV_NFT_ABI,
} from "../constants";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";

export default function Home() {
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [nftBalance, setNftBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");

  const getDAOOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = await getDaoContractInstance(signer);

      const _owner = await contract.owner();
      const address = await signer.getAddress();

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getDaoContractInstance = async (providerOrSigner) => {
    return new Contract(
      CRYPTODEV_DAO_CONTRACT_ADDRESS,
      CRYPTODEV_DAO_ABI,
      providerOrSigner
    );
  };

  const getNumOfProposalsInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contract = await getDaoContractInstance(provider);
      const daoNumProposals = await contract.getNumProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getCryptodevsNFTContractInstance = async (providerOrSigner) => {
    return new Contract(
      CRYPTODEV_NFT_CONTRACT_ADDRESS,
      CRYPTODEV_NFT_ABI,
      providerOrSigner
    );
  };

  const getUserNFTBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = await getCryptodevsNFTContractInstance(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error);
    }
  };

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(CRYPTODEV_DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(balance);
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Please switch to the Goerli network");
        throw new Error("Please switch to the Goerli network");
      }
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumOfProposalsInDAO();
        getDAOOwner();
      });
    }
  }, [walletConnected]);

  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = await getDaoContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllProposals = async () => {
    try {
      const proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals[proposals];
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = await getDaoContractInstance(signer);
      const txn = await contract.createProposal(fakeNftTokenId);
      setLoading(true);
      await txn.wait();
      await getNumOfProposalsInDAO();
      setLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  };

  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for Transaction...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any CryptoDev NFTs.
          <br />
          <b>You cannot create or vote on proposals.</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase:</label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = await getCryptodevsNFTContractInstance(signer);
      const vote = _vote === "YAY" ? 0 : 1;
      const txn = await contract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = await getCryptodevsNFTContractInstance(signer);
      const txn = await contract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
      getDAOTreasuryBalance();
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  };

  function renderViewProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>
          No proposals have been created.
        </div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => {
            return (
              <div key={index} className={styles.proposalCard}>
                <p>Proposal ID: {p.proposalId}</p>
                <p>Fake NFT to Purchase: {p.nftTokenId}</p>
                <p>Deadline: {p.deadline.toLocaleString()}</p>
                <p>Yay Votes: {p.yayVotes}</p>
                <p>Nay Votes: {p.nayVotes}</p>
                <p>Executed?: {p.executed.toString()}</p>
                {p.deadline.getTime() > Date.now() && !p.executed ? (
                  <div className={styles.flex}>
                    <button
                      className={styles.button2}
                      onClick={() => voteOnProposal(p.proposalId, "YAY")}
                    >
                      Vote YAY
                    </button>
                    <button
                      className={styles.button2}
                      onClick={() => voteOnProposal(p.proposalId, "NAY")}
                    >
                      Vote NAY
                    </button>
                  </div>
                ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                  <div className={styles.flex}>
                    <button
                      className={styles.button2}
                      onClick={() => executeProposal(p.proposalId)}
                    >
                      Execute Proposal{" "}
                      {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                    </button>
                  </div>
                ) : (
                  <div className={styles.description}>Proposal Executed</div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
  }

  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalTab();
    }
  }
  const withdrawDAOEther = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);

      const tx = await contract.withdrawEther();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getDAOTreasuryBalance();
    } catch (err) {
      console.error(err);
      window.alert(err.reason);
    }
  };

  return (
    <div>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {isOwner ? (
            <div>
              {loading ? (
                <button className={styles.button}>Loading...</button>
              ) : (
                <button className={styles.button} onClick={withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
