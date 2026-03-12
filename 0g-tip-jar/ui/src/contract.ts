export const CONTRACT_ADDRESS = "0x66de956cDE147FF69d18f3d0eD295c9C8e08665e";

export const ABI = [
  "function tip() external payable",
  "function withdraw() external",
  "function getBalance() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event TipReceived(address indexed from, uint256 amount)",
  "event Withdrawn(address indexed to, uint256 amount)",
];

export const NETWORK = {
  chainId: "0x40DA", // 16602 in hex
  chainName: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: ["https://evmrpc-testnet.0g.ai"],
  blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
};
