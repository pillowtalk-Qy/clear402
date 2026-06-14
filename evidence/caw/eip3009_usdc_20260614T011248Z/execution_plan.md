# Summary
Verify one CAW EIP-712 EIP-3009 USDC transfer authorization signature on Base Sepolia.

# Operations
- Sign exactly one TransferWithAuthorization typed-data payload for Base Sepolia USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e.
- The authorization is from 0xab42bb255c4660b0879f007ab3ed9ae049d85859 to Clear402 recipient 0xA882b939c4Ca15c904760b8c240124Cb68cc2A88 for 1 USDC base unit and expires at Unix 1781400468.
- Attempt one deny-shaped typed-data payload with a mismatched recipient for CAW policy-denial evidence.

# Risk Controls
- message_sign only; no transfers or contract calls in this pact.
- CAW chain is restricted to TBASE_SETH while EIP-712 domain.chainId is fixed at 84532.
- Source address, primary type, USDC verifying contract, sender, recipient, value, expiry, and nonce are exact-match allowlist conditions.
- Request-count limit is two signing requests per 24h window for this probe.
