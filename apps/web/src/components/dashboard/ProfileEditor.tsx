"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSignMessage } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildProfileMessage,
  MAX_BIO,
  MAX_LINKS,
  type ProfileInput,
  profileInputSchema,
} from "@/lib/profile-shared";
import { cn } from "@/lib/utils";

const formSchema = profileInputSchema.omit({ address: true });
type FormValues = Omit<ProfileInput, "address">;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/40 transition focus:ring-2";

/** Small accessible switch. Knob is bg-background so it reads on the seamless surface. */
function Switch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

/**
 * W3 — writer profile editor. Loads the current profile, lets the writer set a
 * public toggle, display name, bio and social links, then saves by signing a
 * canonical message with their wallet (verified server-side, EIP-1271 aware).
 */
export function ProfileEditor({ address }: { address: `0x${string}` }) {
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { isPublic: false, displayName: "", bio: "", links: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "links" });

  const isPublic = watch("isPublic");
  const bio = watch("bio") ?? "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profile/${address}`);
        const json = await res.json();
        if (!cancelled && json.profile) {
          reset({
            isPublic: Boolean(json.profile.isPublic),
            displayName: json.profile.displayName ?? "",
            bio: json.profile.bio ?? "",
            links: json.profile.links ?? [],
          });
        }
      } catch {
        // Keep the empty form; the writer can still create a profile.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const input: ProfileInput = {
        address,
        isPublic: values.isPublic,
        displayName: values.displayName.trim(),
        bio: values.bio.trim(),
        links: values.links.map((l) => ({
          label: l.label.trim(),
          url: l.url.trim(),
        })),
      };
      const issuedAt = Date.now();
      const signature = await signMessageAsync({
        message: buildProfileMessage(input, issuedAt),
      });
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, issuedAt, signature }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      toast.success("Profile saved", {
        description: values.isPublic
          ? "Your public profile is live."
          : "Saved. It stays hidden until you make it public.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message.split("\n")[0] : "save failed";
      toast.error("Could not save profile", { description: message });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">Public profile</CardTitle>
        <Link
          href={`/u/${address}`}
          className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          View <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label htmlFor="isPublic" className="text-sm font-medium">
                  Make my profile public
                </label>
                <p className="text-xs text-muted-foreground">
                  Shows your bio, links and totals at /u/{address.slice(0, 6)}…
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={isPublic}
                onChange={(v) => setValue("isPublic", v, { shouldDirty: true })}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="displayName" className="text-sm font-medium">
                Display name
              </label>
              <input
                id="displayName"
                placeholder="Your name or pen name"
                className={inputClass}
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {bio.length}/{MAX_BIO}
                </span>
              </div>
              <textarea
                id="bio"
                rows={3}
                placeholder="A line about what you write."
                className={cn(inputClass, "resize-none")}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-xs text-destructive">{errors.bio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Links</span>
              <div className="space-y-2">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <input
                      placeholder="Label (e.g. X, site)"
                      className={cn(inputClass, "w-1/3")}
                      {...register(`links.${i}.label` as const)}
                    />
                    <input
                      placeholder="https://…"
                      className={cn(inputClass, "flex-1")}
                      {...register(`links.${i}.url` as const)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label="Remove link"
                      className="mt-1.5 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {fields.length < MAX_LINKS && (
                <button
                  type="button"
                  onClick={() => append({ label: "", url: "" })}
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add link
                </button>
              )}
              {errors.links && (
                <p className="text-xs text-destructive">
                  Check your links: labels are required and URLs must start with
                  https://
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full transition-transform active:scale-[0.98] sm:w-auto"
            >
              {isSubmitting ? "Sign in your wallet…" : "Save profile"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
