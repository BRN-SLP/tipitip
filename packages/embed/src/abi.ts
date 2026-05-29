/**
 * Minimal ABIs for the inline tipping engine.
 *
 * Only the three functions the engine actually calls are included
 * (cUSD allowance + approve, TipJar tipParagraph). Keeping the ABI
 * surface tiny keeps the bundle small and makes the engine's on-chain
 * footprint auditable at a glance.
 */
export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const tipJarAbi = [
  {
    type: "function",
    name: "tipParagraph",
    stateMutability: "nonpayable",
    inputs: [
      { name: "articleId", type: "bytes32" },
      { name: "paragraphKey", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
