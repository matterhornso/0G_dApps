import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import { CONTRACT_ADDRESS, ABI, NETWORK } from "./contract";

type Status = { text: string; type: "idle" | "loading" | "success" | "error" };

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [tipAmount, setTipAmount] = useState("");
  const [status, setStatus] = useState<Status>({ text: "", type: "idle" });

  const isOwner = account && owner && account.toLowerCase() === owner.toLowerCase();

  const getProvider = () => {
    if (!window.ethereum) throw new Error("No wallet detected. Install MetaMask.");
    return new BrowserProvider(window.ethereum);
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainId }],
      });
    } catch (err: unknown) {
      if ((err as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK],
        });
      } else {
        throw err;
      }
    }
  };

  const fetchContractData = useCallback(async (addr: string) => {
    if (!CONTRACT_ADDRESS) return;
    try {
      const provider = getProvider();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
      const [bal, ownerAddr] = await Promise.all([
        contract.getBalance(),
        contract.owner(),
      ]);
      setBalance(formatEther(bal));
      setOwner(ownerAddr);
    } catch {
      // silently fail if contract not yet deployed
    }
  }, []);

  const connect = async () => {
    try {
      setStatus({ text: "Connecting...", type: "loading" });
      const provider = getProvider();
      await switchNetwork();
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await fetchContractData(accounts[0]);
      setStatus({ text: "", type: "idle" });
    } catch (err: unknown) {
      setStatus({ text: (err as Error).message, type: "error" });
    }
  };

  const sendTip = async () => {
    if (!tipAmount || isNaN(Number(tipAmount)) || Number(tipAmount) <= 0) {
      setStatus({ text: "Enter a valid tip amount.", type: "error" });
      return;
    }
    if (!CONTRACT_ADDRESS) {
      setStatus({ text: "Set CONTRACT_ADDRESS in contract.ts first.", type: "error" });
      return;
    }
    try {
      setStatus({ text: "Sending tip...", type: "loading" });
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.tip({ value: parseEther(tipAmount) });
      await tx.wait();
      setTipAmount("");
      await fetchContractData(account!);
      setStatus({ text: `Tip of ${tipAmount} 0G sent!`, type: "success" });
    } catch (err: unknown) {
      setStatus({ text: (err as Error).message, type: "error" });
    }
  };

  const withdraw = async () => {
    if (!CONTRACT_ADDRESS) {
      setStatus({ text: "Set CONTRACT_ADDRESS in contract.ts first.", type: "error" });
      return;
    }
    try {
      setStatus({ text: "Withdrawing...", type: "loading" });
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.withdraw();
      await tx.wait();
      await fetchContractData(account!);
      setStatus({ text: "Withdrawn successfully.", type: "success" });
    } catch (err: unknown) {
      setStatus({ text: (err as Error).message, type: "error" });
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      setAccount(accounts[0] ?? null);
    });
  }, []);

  return (
    <div className="container">
      <header>
        <h1>0G Tip Jar</h1>
        <p className="subtitle">Send tips on 0G Galileo Testnet</p>
      </header>

      {!account ? (
        <button className="btn btn-primary" onClick={connect}>
          Connect Wallet
        </button>
      ) : (
        <>
          <div className="card info-card">
            <div className="info-row">
              <span className="label">Connected</span>
              <span className="value mono">{account.slice(0, 6)}…{account.slice(-4)}</span>
            </div>
            <div className="info-row">
              <span className="label">Jar Balance</span>
              <span className="value balance">{balance} 0G</span>
            </div>
            {isOwner && (
              <div className="owner-badge">Owner</div>
            )}
          </div>

          <div className="card">
            <h2>Send a Tip</h2>
            <div className="input-row">
              <input
                type="number"
                placeholder="Amount in 0G"
                value={tipAmount}
                min="0"
                step="0.01"
                onChange={(e) => setTipAmount(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={sendTip}
                disabled={status.type === "loading"}
              >
                {status.type === "loading" ? "…" : "Tip"}
              </button>
            </div>
          </div>

          {isOwner && (
            <div className="card admin-card">
              <h2>Admin</h2>
              <p className="admin-note">You are the contract owner.</p>
              <button
                className="btn btn-danger"
                onClick={withdraw}
                disabled={status.type === "loading" || balance === "0.0" || balance === "0"}
              >
                {status.type === "loading" ? "…" : "Withdraw All"}
              </button>
            </div>
          )}

          {status.text && (
            <div className={`status status-${status.type}`}>{status.text}</div>
          )}
        </>
      )}
    </div>
  );
}
