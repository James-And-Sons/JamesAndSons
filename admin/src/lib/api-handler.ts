import { NextRequest, NextResponse } from "next/server";

export type RouteHandler = (
  req: NextRequest,
  context?: any,
) => Promise<NextResponse | Response> | NextResponse | Response;

/**
 * Higher-Order Function wrapper for Next.js API Route Handlers.
 * Ensures consistent error catching, structured server logging, and
 * sanitized 500 HTTP responses without leaking internal exception stacks or schemas.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const url = req.nextUrl?.pathname || req.url || "Unknown Route";
      const method = req.method || "GET";

      console.error(`[API Route Exception] ${method} ${url}:`, {
        error: errorMessage,
        stack,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: "An unexpected internal error occurred.",
          code: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }
  };
}
