# ServiceEscrow Sepolia Deployment

This repo includes an onchain-ready `ServiceEscrow` contract and ABI, but no deployment is claimed until a real Sepolia transaction hash and contract address are recorded.

## Contract

- Source: `contracts/ServiceEscrow.sol`
- ABI: `contracts/abi/ServiceEscrow.json`
- Runtime calldata helper: `services/runtime/src/escrow/service_escrow_onchain.ts`

## Steps

1. Compile `contracts/ServiceEscrow.sol` with your Solidity toolchain of choice.
2. Save the deployment artifact at `contracts/artifacts/ServiceEscrow.json` with a `bytecode` field.
3. Install a deploy-time EVM helper outside committed runtime state if needed:

```bash
pnpm add -D viem
```

4. Export deploy-only environment variables:

```bash
export SEPOLIA_RPC_URL="https://..."
export DEPLOYER_PRIVATE_KEY="0x..."
```

5. Deploy:

```bash
node contracts/scripts/deploy-service-escrow.mjs
```

6. Only after the transaction confirms, record the contract address and transaction hash in an evidence document. Do not mark `CLEAR402_SERVICE_ESCROW_ADDRESS` as live without that evidence.

## Runtime Environment

For CAW `contract_call` funding, configure:

```bash
export CLEAR402_SERVICE_ESCROW_ADDRESS="0x..."
export CLEAR402_CAW_CHAIN_ID="SETH"
export CLEAR402_CAW_TOKEN_ID="SETH"
```

The current runtime can generate guarded `fund(bytes32,address,uint256)` and `refund(bytes32)` calldata. Live execution still depends on an approved CAW pact that allows `contract_call` to the deployed escrow contract and returns wallet, tx, audit, and raw evidence anchors.

`ServiceEscrow` is intentionally minimal and native-value based: `fund` requires `msg.value == amount`. It is not an ERC-20 escrow, does not custody USDC, and should not be described as production settlement infrastructure.
