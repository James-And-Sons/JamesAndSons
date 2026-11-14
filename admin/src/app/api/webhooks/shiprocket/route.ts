export { POST } from "../logistics/route";

export async function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Shiprocket Admin Webhook Endpoint Active",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
