export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-border border-t-primary" />
        <div className="absolute inset-0 h-14 w-14 animate-ping rounded-full border-4 border-primary/20" />
      </div>
      <p className="mt-5 text-sm font-medium text-text-dim">Loading SafeRoute AI...</p>
    </div>
  );
}
