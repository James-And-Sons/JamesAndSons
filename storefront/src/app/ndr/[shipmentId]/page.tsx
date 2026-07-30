import NDRSlotPickerClient from './NDRSlotPickerClient';

export default async function NDRPage({ 
  params,
  searchParams
}: { 
  params: { shipmentId: string },
  searchParams: { order: string }
}) {
  const { shipmentId } = await params;
  const orderNumber = (await searchParams).order || 'Your Order';
  
  return (
    <>
            <NDRSlotPickerClient shipmentId={shipmentId} orderNumber={orderNumber} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Schedule Re-delivery | James & Sons',
    description: 'Select a convenient time for your order delivery re-attempt.',
  };
}
