# Summary
Submit one already-signed EIP-3009 transferWithAuthorization call to Base Sepolia USDC.

# Operations
- Call Base Sepolia USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e with selector 0xe3ee160e exactly for the fresh authorization nonce 0xa0ea67f1141a87205c6fb371097fd97d86604fe3b2e5a1b8d418215113bdfe90.
- The authorization transfers 1 USDC base unit from 0xab42bb255c4660b0879f007ab3ed9ae049d85859 to 0xA882b939c4Ca15c904760b8c240124Cb68cc2A88.
- The signed authorization expires at Unix 1781405871; do not submit after expiry.

# Risk Controls
- contract_call only on TBASE_SETH.
- Target restricted to the Base Sepolia USDC contract 0x036CbD53842c5426634e7929541eC2318f3dCF7e.
- One successful transaction completes the pact; short time window also completes it.
- No mainnet, no dashboard/runtime code path, no additional signing.
