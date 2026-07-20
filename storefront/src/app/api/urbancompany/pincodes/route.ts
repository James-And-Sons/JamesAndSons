import { NextResponse } from 'next/server';

// Standard serviceable metro/tier-1 pincode prefixes for demonstration
// (In production, this queries the Urban Company Enterprise check-serviceability API)
const SERVICEABLE_PREFIXES = [
  '11', // Delhi NCR
  '12', // Haryana / NCR
  '20', // UP / NCR
  '40', // Mumbai / Maharashtra
  '41', // Pune / Maharashtra
  '56', // Bangalore / Karnataka
  '50', // Hyderabad / Telangana
  '60', // Chennai / Tamil Nadu
  '70', // Kolkata / West Bengal
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code || code.length !== 6 || isNaN(Number(code))) {
    return NextResponse.json({ serviceable: false, error: 'Valid 6-digit pin code required' }, { status: 400 });
  }

  // Check if pincode starts with any serviceable metro prefix
  const prefix = code.slice(0, 2);
  const serviceable = SERVICEABLE_PREFIXES.includes(prefix);

  if (!serviceable) {
    return NextResponse.json({ 
      serviceable: false, 
      message: 'Urban Company installation service is not currently available at this location.' 
    });
  }

  // Generate dynamic booking slots beginning 3 days from now (to allow for courier shipping transit)
  const slots = [];
  const daysAhead = [3, 4, 5, 6, 7];
  
  for (const offset of daysAhead) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dateString = date.toISOString().split('T')[0];
    const formattedDate = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    
    slots.push({
      date: dateString,
      displayDate: formattedDate,
      times: ['10:00 AM - 12:30 PM', '01:00 PM - 03:30 PM', '04:00 PM - 06:30 PM']
    });
  }

  return NextResponse.json({
    serviceable: true,
    slots
  });
}
