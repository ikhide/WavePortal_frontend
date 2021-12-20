import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import Loader from "react-loader-spinner";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalWaves, setTotalWaves] = useState(0);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [text, setText] = useState(null);
  const contractAddress = "0x303ef4234C2677708F9b0E5E3a1B89e7241C9422";
  const contractABI = abi.abi;

  /*
   * This runs our function when the page loads.
   */

  useEffect(() => {
    checkIfWalletIsConnected();
    setLoading(true);
  }, []);

  useEffect(() => {
    initContract();
  }, [currentAccount]);

  useEffect(() => {
    if (contract) {
      getTotalWaves();
      getAllWaves();
    }
  }, [contract]);

  const initContract = () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(wavePortalContract);
    } catch (err) {
      setLoading(false);
      console.log(err);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setLoading(true);
        const waveTxn = await contract.wave(text, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        setText("");
        getTotalWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const getTotalWaves = async () => {
    try {
      const count = await contract.getTotalWaves();
      console.log("Retrieved total wave count...", count.toNumber());
      setTotalWaves(count.toNumber());
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(() => {
    const onNewWave = (from, timestamp, message) => {
      setLoading(true);
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
      setLoading(false);
    };

    if (contract) {
      contract.on("NewWave", onNewWave);
    }

    return () => {
      if (contract) {
        contract.off("NewWave", onNewWave);
      }
    };
  }, [contract]);
  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum && contract) {
        const waves = await contract.getAllWaves();
        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
        setLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>
        <div className="bio">Chat with your friends on blockchain.</div>
        <div className="inputContainer">
          <input
            className="input"
            type="text"
            placeholder="Type your message here..."
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
        </div>
        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {contract && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}
        <div className="totalContainer">
          <p className="totalText">Total Wave Count</p>
          <h2 className="totalCount">{totalWaves}</h2>
        </div>
        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
        {loading && (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <Loader
              type="Puff"
              color="#aaa"
              height={20}
              width={20}
              // timeout={3000} //3 secs
            />
          </div>
        )}
      </div>
    </div>
  );
}
