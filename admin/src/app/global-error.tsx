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
    console.error("[Admin Root Layout Critical Error]:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-red-900/50 text-red-400 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Critical System Error</h1>
          <p className="text-sm text-gray-400 mb-6">
            A root level error occurred in the Admin Portal.
            {error.digest && (
              <span className="block text-xs font-mono mt-1 text-gray-500">
                Digest: {error.digest}
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.assign("/")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition"
            >
              Reload Portal
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
