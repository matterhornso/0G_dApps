#!/usr/bin/env node
import { ZgFile, Indexer } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve, basename, dirname } from "path";

const EVM_RPC = "https://evmrpc-testnet.0g.ai";
const INDEXER_URL = "https://indexer-storage-testnet-turbo.0g.ai";

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function usage() {
  console.error(`
Usage:
  PRIVATE_KEY=0x... node cli.js <path-to-json-file>

Example:
  PRIVATE_KEY=0xabc123... node cli.js ./data.json
`);
  process.exit(1);
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) usage();

  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: PRIVATE_KEY environment variable is not set.");
    usage();
  }

  const provider = new ethers.JsonRpcProvider(EVM_RPC);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log(`Wallet:     ${signer.address}`);
  console.log(`File:       ${absPath}`);

  // SHA256 of original file
  const originalHash = sha256(absPath);
  console.log(`SHA256:     ${originalHash}`);

  // Build merkle tree and get root hash
  console.log("\n[1/3] Computing merkle tree...");
  const zgFile = await ZgFile.fromFilePath(absPath);
  const [tree, treeErr] = await zgFile.merkleTree();
  if (treeErr) {
    console.error("Failed to compute merkle tree:", treeErr);
    process.exit(1);
  }
  const rootHash = tree.rootHash();
  console.log(`Root hash:  ${rootHash}`);

  // Upload
  console.log("\n[2/3] Uploading to 0G Storage (Galileo)...");
  const indexer = new Indexer(INDEXER_URL);
  const [tx, uploadErr] = await indexer.upload(zgFile, EVM_RPC, signer);
  if (uploadErr) {
    console.error("Upload failed:", uploadErr);
    process.exit(1);
  }
  await zgFile.close();
  console.log(`Tx hash:    ${tx}`);
  console.log("Upload complete.");

  // Wait for propagation
  const delay = 45;
  process.stdout.write(`\nWaiting ${delay}s for storage propagation`);
  for (let i = 0; i < delay; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    process.stdout.write(".");
  }
  console.log(" done.");

  // Download
  console.log("\n[3/3] Downloading from 0G Storage...");
  const ext = basename(absPath).includes(".") ? "." + basename(absPath).split(".").pop() : "";
  const downloadPath = resolve(dirname(absPath), `downloaded_${Date.now()}${ext}`);

  const downloadErr = await indexer.download(rootHash, downloadPath, true);
  if (downloadErr) {
    console.error("Download failed:", downloadErr);
    process.exit(1);
  }
  console.log(`Saved to:   ${downloadPath}`);

  // Verify integrity
  const downloadedHash = sha256(downloadPath);
  console.log("\n--- Integrity Check ---");
  console.log(`Original SHA256:   ${originalHash}`);
  console.log(`Downloaded SHA256: ${downloadedHash}`);

  if (originalHash === downloadedHash) {
    console.log("\n✓ Hashes match — file integrity verified.");
  } else {
    console.error("\n✗ Hash mismatch — file may be corrupted!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
