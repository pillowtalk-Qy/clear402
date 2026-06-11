import { sha256Hex } from "../../../packages/shared/src/index.mjs";

export const DEBUG_PAYMENT_KEY_ID = "clear402-local-debug-key-v1";
export const DEBUG_PAYMENT_KEY = "clear402 local debug payment key - not a secret";

export const DEFAULT_PROVIDER_CONFIG = Object.freeze({
  providerId: "local-provider-x402",
  origin: "http://localhost:4010",
  merchantAddress: "0x4020000000000000000000000000000000000402",
  network: "base-sepolia",
  chainId: "84532",
  tokenId: "USDC",
  asset: "0x4020000000000000000000000000000000000001",
  amount: "10000",
  amountDecimals: 6,
  facilitatorUrl: "https://facilitator.local.clear402.test",
  challengeTtlMs: 5 * 60 * 1000,
  providerPublicKey: sha256Hex(DEBUG_PAYMENT_KEY),
  allowedResources: ["/paid/report"]
});
