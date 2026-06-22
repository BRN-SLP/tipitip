/**
 * Server-only writer-profile storage + signature-gated writes.
 *
 * Shapes, the zod schema, and the canonical signing message live in
 * `profile-shared.ts` (client + server safe) and are re-exported here so
 * existing server importers keep using `@/lib/profile`. This file adds the
 * pieces that must stay server-side: Blob I/O and signature verification.
 *
 * Privacy note (MVP): the Blob is PUBLIC, like article bodies. `isPublic`
 * controls whether the app SURFACES a profile (the /u page renders it, future
 * discovery includes it); it is not cryptographic privacy. True private
 * profiles would need a private store, tracked as a follow-up.
 */
import "server-only";

import { head, put } from "@vercel/blob";
import { getAddress, type Hex } from "viem";

import { buildClient, getActiveChainId } from "./chain-logs";
import {
  buildProfileMessage,
  PROFILE_SIG_TTL_MS,
  type ProfileInput,
  type WriterProfile,
} from "./profile-shared";

export * from "./profile-shared";

const PROFILE_PREFIX = "profiles" as const;

function profilePath(address: string): string {
  return `${PROFILE_PREFIX}/${address.toLowerCase()}.json`;
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
export function toStoredProfile(
  input: ProfileInput,
  now: number,
): WriterProfile {
  return {
    address: input.address.toLowerCase(),
    isPublic: input.isPublic,
    displayName: input.displayName || undefined,
    bio: input.bio || undefined,
    links: input.links.length ? input.links : undefined,
    updatedAt: now,
  };
}
// @types: type guard candidate
/** @module profile */
// @todo: profile under high load
// @cleanup: remove unused import on refactor
// @i18n: ensure this string is extracted
// @note: see issue tracker for context
// @edge: zero-value special case
