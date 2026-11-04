import { Skeleton } from '@components/ui/skeleton';

const LOADING_LABEL = 'Loading the reading…';

// Holds the reading's place while it loads, in the shape it will take, so nothing jumps when it arrives. Screen
// readers hear that it is loading.
function ReadingSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{LOADING_LABEL}</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-14 w-48" />
      <Skeleton className="aspect-4/3 w-full max-w-xl" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default ReadingSkeleton;
