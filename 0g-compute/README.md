# 0G Compute Inference Demo

A script that connects to the 0G Compute testnet, lists available inference providers, and sends a chat completion request.

## Requirements

- Node.js >= 20
- A wallet with 0G testnet tokens — get some at [faucet.0g.ai](https://faucet.0g.ai)

## Setup

```bash
npm install
```

## Usage

```bash
PRIVATE_KEY=your_private_key node index.js
```

## What It Does

1. Connects to the 0G Compute testnet (`https://evmrpc-testnet.0g.ai`)
2. Lists all available inference providers
3. Picks the first provider
4. Creates a ledger account if one doesn't exist (~0.5 0G tokens)
5. Funds the provider sub-account (~0.1 0G tokens)
6. Sends the question: *"What is beyond the edge of the universe?"*
7. Prints the response

> On subsequent runs against the same provider, the ledger and funding steps are skipped automatically.

## Sample Output

```
Wallet: 0x44FAdDB0daCC90e3FF70077AD0a8E5b8Fb892299
Connecting to 0G Compute...

Fetching inference providers...
Found 2 provider(s):
  - 0xa48f01287233509FD694a22Bf840225062E67836 | model: qwen/qwen-2.5-7b-instruct | type: chatbot
  - 0x4b2a941929E39Adbea5316dDF2B9Bd8Ff3134389 | model: qwen/qwen-image-edit-2511 | type: image-editing

Using provider: 0xa48f01287233509FD694a22Bf840225062E67836
Ledger account found.
Funding provider sub-account...
Endpoint: https://compute-network-6.integratenetwork.work/v1/proxy | Model: qwen/qwen-2.5-7b-instruct

Question: "What is beyond the edge of the universe?"

Response:

The concept of what lies beyond the edge of the observable universe is currently a topic of much
speculation and scientific inquiry...
```

## Notes

- The ledger account creation costs ~0.5 0G tokens (one-time)
- Each request funds the provider sub-account with ~0.1 0G tokens
- The script uses the OpenAI-compatible chat completions API under the hood, with request headers signed by the 0G SDK for on-chain billing
