/**
 * Profile shapes shared by client and server. NO server-only imports here, so
 * the editor can build the exact message it signs and the server can rebuild
 * the exact message it verifies. Keep this free of Blob/RPC/node deps.
 */
import { z } from "zod";

export const MAX_NAME = 40;
export const MAX_BIO = 280;
export const MAX_LINKS = 5;

export const linkSchema = z.object({
  label: z.string().trim().min(1).max(30),
  url: z
    .string()
    .trim()
    .url()
    .max(200)
    .refine((u) => u.startsWith("https://"), "links must use https"),
});

/**
 * Validated, signable profile payload. Strings are trimmed so the canonical
 * message normalizes identically on both sides: the client trims before
 * signing and the server trims when parsing, so padded/whitespace variants
 * cannot be smuggled past the signature check (they would rebuild a different
 * message and fail verification).
 */
export const profileInputSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "invalid address"),
  isPublic: z.boolean(),
  displayName: z.string().trim().max(MAX_NAME),
  bio: z.string().trim().max(MAX_BIO),
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
 * signing) and server (before verifying). Keep this format frozen — any change
 * invalidates in-flight signatures.
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
// @todo: profile under high load
