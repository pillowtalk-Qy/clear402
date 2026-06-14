# Summary
Execute one fresh EIP-3009 TransferWithAuthorization for Base Sepolia USDC.

# Operations
- Sign exactly one TransferWithAuthorization EIP-712 typed-data payload for Base Sepolia USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e.
- The authorization is from 0xab42bb255c4660b0879f007ab3ed9ae049d85859 to 0xA882b939c4Ca15c904760b8c240124Cb68cc2A88 for 1 USDC base unit.
- validAfter is Unix 1781404011; validBefore is Unix 1781405871; nonce is 0xa0ea67f1141a87205c6fb371097fd97d86604fe3b2e5a1b8d418215113bdfe90.
- After a successful signature, submit transferWithAuthorization on Base Sepolia only.

# Risk Controls
- message_sign only in this pact; no transfer or contract_call permission is granted by this pact.
- CAW chain is restricted to TBASE_SETH; EIP-712 domain.chainId is fixed at 84532.
- Source address, primary type, USDC verifying contract, sender, recipient, value, validity window, and nonce are exact-match allowlist conditions.
- Request-count limit is one signing request per 24h window for this fresh authorization.
