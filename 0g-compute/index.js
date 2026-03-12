import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const QUESTION = "What is beyond the edge of the universe?";

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY env var is required");
  }

  const rpcProvider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, rpcProvider);
  console.log(`Wallet: ${wallet.address}`);

  console.log("Connecting to 0G Compute...");
  const broker = await createZGComputeNetworkBroker(wallet);

  // List providers
  console.log("\nFetching inference providers...");
  const services = await broker.inference.listService();
  if (services.length === 0) {
    throw new Error("No inference providers available on testnet");
  }

  console.log(`Found ${services.length} provider(s):`);
  for (const svc of services) {
    console.log(`  - ${svc.provider} | model: ${svc.model} | type: ${svc.serviceType}`);
  }

  const providerAddress = services[0].provider;
  console.log(`\nUsing provider: ${providerAddress}`);

  // Ensure ledger account exists
  try {
    await broker.ledger.getLedger();
    console.log("Ledger account found.");
  } catch (e) {
    if (e.message && e.message.includes("does not exist")) {
      console.log("Creating ledger account (0.5 0G tokens)...");
      await broker.ledger.addLedger(0.5);
      console.log("Ledger account created.");
    } else {
      throw e;
    }
  }

  // Fund provider sub-account
  console.log("Funding provider sub-account...");
  const amountInNeuron = BigInt(Math.floor(0.1 * 1e18));
  await broker.ledger.transferFund(providerAddress, "inference", amountInNeuron);

  // Acknowledge provider signer
  await broker.inference.acknowledgeProviderSigner(providerAddress);

  // Get endpoint + model
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  console.log(`Endpoint: ${endpoint} | Model: ${model}`);

  // Build and send request
  const requestBody = JSON.stringify({
    model,
    messages: [{ role: "user", content: QUESTION }],
  });

  console.log(`\nQuestion: "${QUESTION}"\n`);

  const headers = await broker.inference.getRequestHeaders(providerAddress, requestBody);
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: requestBody,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${JSON.stringify(result)}`);
  }

  console.log("Response:\n");
  console.log(result.choices[0].message.content);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
