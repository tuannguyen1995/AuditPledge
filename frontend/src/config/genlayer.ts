import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// GenLayer studionet configuration
export const STUDIONET_CONFIG = {
  chainId: 61999,
  chainIdHex: "0xF1EF",
  chainName: "GenLayer StudioNet",
  rpcUrl: "https://studio.genlayer.com/api",
  nativeCurrency: {
    name: "GEN",
    symbol: "GEN",
    decimals: 18,
  },
  blockExplorerUrls: ["https://studio.genlayer.com"],
};

// Default deployed contract address on studionet
export const DEFAULT_CONTRACT_ADDRESS = "0xF14AD1F4fD9DfC623DF962892ab0234C4aB4cfAC";

export const genlayerClient = createClient({
  chain: studionet,
});

// ABI definition for AuditPledge Advanced Intelligent Contract
export const AUDIT_PLEDGE_ABI = [
  {
    name: "create_audit_bounty",
    type: "function",
    inputs: [
      { name: "target_repo_url", type: "string" },
      { name: "commit_hash", type: "string" },
      { name: "code_url", type: "string" },
      { name: "scope_spec", type: "string" },
      { name: "duration_blocks", type: "int" },
    ],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "payable",
  },
  {
    name: "submit_audit_report",
    type: "function",
    inputs: [
      { name: "bounty_id", type: "string" },
      { name: "report_url", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "adjudicate_audit",
    type: "function",
    inputs: [{ name: "bounty_id", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "raise_dispute",
    type: "function",
    inputs: [
      { name: "bounty_id", type: "string" },
      { name: "dispute_reason", type: "string" },
      { name: "appeal_evidence_url", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    name: "finalize_settlement",
    type: "function",
    inputs: [{ name: "bounty_id", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "adjudicate_appeal",
    type: "function",
    inputs: [{ name: "bounty_id", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "cancel_or_reclaim",
    type: "function",
    inputs: [{ name: "bounty_id", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "get_bounty",
    type: "function",
    inputs: [{ name: "bounty_id", type: "string" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "get_bounties_paginated",
    type: "function",
    inputs: [
      { name: "offset", type: "int" },
      { name: "limit", type: "int" },
    ],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "get_stats",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "get_bounty_count",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "int" }],
    stateMutability: "view",
  },
];

export async function switchToStudioNet(): Promise<boolean> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask or Web3 wallet is not installed.");
  }

  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: STUDIONET_CONFIG.chainIdHex,
              chainName: STUDIONET_CONFIG.chainName,
              nativeCurrency: STUDIONET_CONFIG.nativeCurrency,
              rpcUrls: [STUDIONET_CONFIG.rpcUrl],
              blockExplorerUrls: STUDIONET_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add StudioNet to wallet", addError);
        throw addError;
      }
    }
    throw switchError;
  }
}