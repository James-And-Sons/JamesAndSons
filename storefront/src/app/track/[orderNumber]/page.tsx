import TrackingPageClient from "./TrackingPageClient";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return (
    <>
      <TrackingPageClient orderNumber={orderNumber} />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return {
    title: `Track Order ${orderNumber} | James & Sons`,
    description: `Real-time tracking for your James & Sons order.`,
  };
}
