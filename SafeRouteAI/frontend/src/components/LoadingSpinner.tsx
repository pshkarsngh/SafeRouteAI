"use client";

export default function LoadingSpinner({ message = "Analyzing route safety..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-border border-t-primary" />
        <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-primary/20" />
      </div>
      <p className="mt-6 text-sm font-medium text-text-dim">{message}</p>
      <div className="mt-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
