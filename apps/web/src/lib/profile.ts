/**
 * Server-only writer-profile storage + signature-gated writes.
 *
 * Profiles are optional, mutable, off-chain metadata a writer attaches to their
 * wallet address: a display name, a short bio, social links, and a public
 * toggle. They live in Vercel Blob as JSON keyed by lowercase address.
 *
 * Writes are authorised by a wallet signature, not a session: the writer signs
 * a canonical message that commits to the exact field values plus a timestamp,
 * and the server verifies that signature came from the address being written.
 * This supports BOTH EOAs and smart-contract wallets (MiniPay) because we
 * verify through a Celo public client, which falls back to EIP-1271.
 *
 * Privacy note (MVP): the Blob is PUBLIC, like article bodies. `isPublic`
 * controls whether the app SURFACES a profile (the /u page renders it, future
 * discovery includes it); it is not cryptographic privacy. True private
 * profiles would need a private store, tracked as a follow-up.
 */
import "server-only";

import { head, put } from "@vercel/blob";
import { getAddress, type Hex } from "viem";
import { z } from "zod";

import { buildClient, getActiveChainId } from "./chain-logs";

const PROFILE_PREFIX = "profiles" as const;

function profilePath(address: string): string {
  return `${PROFILE_PREFIX}/${address.toLowerCase()}.json`;
}

export const MAX_NAME = 40;
export const MAX_BIO = 280;
export const MAX_LINKS = 5;

const linkSchema = z.object({
  label: z.string().min(1).max(30),
  url: z
    .string()
    .url()
    .max(200)
    .refine((u) => u.startsWith("https://"), "links must use https"),
});

/**
 * Validated, signable profile payload. Fields are NOT transformed (no trim)
 * so the message the server rebuilds is byte-identical to the one the client
 * signed — the client is responsible for sending already-clean values.
 */
export const profileInputSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "invalid address"),
  isPublic: z.boolean(),
  displayName: z.string().max(MAX_NAME),
  bio: z.string().max(MAX_BIO),
  links: z.array(linkSchema).max(MAX_LINKS),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Stored profile = validated input (empties dropped) + server-set updatedAt. */
export interface WriterProfile {
  address: string;
  isPublic: boolean;
  displayName?: string;
  bio?: string;
  links?: { label: string; url: string }[];
  updatedAt: number;
}

/** Max age of a signed profile-update message (replay protection). */
export const PROFILE_SIG_TTL_MS = 10 * 60 * 1000;

/**
 * Canonical message the writer signs. Built identically on client (before
 * signing) and server (before verifying), so the signature commits to EXACTLY
 * these values plus `issuedAt`. Keep this format frozen — any change invalidates
 * in-flight signatures.
 */
export function buildProfileMessage(p: ProfileInput, issuedAt: number): string {
  const links = p.links.map((l) => `${l.label}|${l.url}`).join(", ");
  return [
    "TipiTip: update my writer profile",
    `address: ${p.address.toLowerCase()}`,
    `public: ${p.isPublic}`,
    `name: ${p.displayName}`,
    `bio: ${p.bio}`,
    `links: ${links}`,
    `issued: ${issuedAt}`,
  ].join("\n");
}

/**
 * Verify `signature` over the canonical message for `input`+`issuedAt` was
 * produced by `input.address`, and that it is fresh. Returns the normalized
 * signer address on success, null otherwise. Uses a Celo public client so
 * smart-contract wallets (MiniPay, EIP-1271) verify as well as EOAs.
 */
export async function verifyProfileSignature(
  input: ProfileInput,
  issuedAt: number,
  signature: Hex,
  now: number,
): Promise<string | null> {
  if (
    !Number.isFinite(issuedAt) ||
    Math.abs(now - issuedAt) > PROFILE_SIG_TTL_MS
  ) {
    return null;
  }
  let address: `0x${string}`;
  try {
    address = getAddress(input.address);
  } catch {
    return null;
  }
  const chainId = getActiveChainId();
  if (chainId === null) return null;
  try {
    const ok = await buildClient(chainId).verifyMessage({
      address,
      message: buildProfileMessage(input, issuedAt),
      signature,
    });
    return ok ? address : null;
  } catch {
    return null;
  }
}

/** Read a writer's profile, or null if none stored. */
export async function getProfile(
  address: string,
): Promise<WriterProfile | null> {
  let url: string;
  try {
    url = (await head(profilePath(address))).url;
  } catch {
    return null;
  }
  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as WriterProfile;
  } catch {
    return null;
  }
}

/**
 * Persist a writer's profile (overwrites prior value). The CALLER must have
 * verified the signature first; this function does no auth.
 */
export async function putProfile(profile: WriterProfile): Promise<void> {
  await put(profilePath(profile.address), JSON.stringify(profile), {
    access: "public",
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 30,
  });
}

/** Build the stored shape from validated input: drop empty optionals. */
export function toStoredProfile(input: ProfileInput, now: number): WriterProfile {
  return {
    address: input.address.toLowerCase(),
    isPublic: input.isPublic,
    displayName: input.displayName || undefined,
    bio: input.bio || undefined,
    links: input.links.length ? input.links : undefined,
    updatedAt: now,
  };
}
