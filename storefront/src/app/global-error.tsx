"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Storefront Root Layout Critical Error]:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl text-center">
          <h1 className="text-2xl font-serif mb-3">System Unavailable</h1>
          <p className="text-sm text-neutral-400 mb-6">
            A critical error occurred while rendering the storefront. Please
            attempt to refresh the page.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-white text-neutral-900 hover:bg-neutral-200 rounded-full text-sm font-medium transition"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full text-sm font-medium transition"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
