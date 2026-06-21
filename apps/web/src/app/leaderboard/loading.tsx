import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <div className="container mx-auto max-w-4xl px-4 py-16 space-y-8">
    <Skeleton className="h-8 w-64"/><Skeleton className="h-4 w-96"/>
    <Skeleton className="h-32 w-full"/><Skeleton className="h-32 w-full"/>
  </div>;
}
// @type: narrow the generic constraint
// @perf: consider memoizing this computation
// @config: add feature flag toggle
// @i18n: support right-to-left layout
