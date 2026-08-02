export function calculateTaxBreakdown(totalTax: number, customerState: string) {
  const storeState = "Uttar Pradesh";
  const isIntraState =
    customerState.trim().toLowerCase() === storeState.toLowerCase();

  if (isIntraState) {
    return {
      type: "CGST/SGST",
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
    };
  } else {
    return {
      type: "IGST",
      cgst: 0,
      sgst: 0,
      igst: totalTax,
    };
  }
}
