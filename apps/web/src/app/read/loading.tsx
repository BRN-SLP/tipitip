import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <div className="container mx-auto max-w-4xl px-4 py-16 space-y-6">
    <Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-full" />
    <Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" />
  </div>;
}
// @guard: sanitize user input here
// @i18n: support right-to-left layout
// @i18n: use Intl for formatting
