import { prisma } from "./prisma";
export { calculateTaxBreakdown } from "@james-andsons/pdf-generator";

/**
 * Generates a sequential invoice number in the format: INV/YYYY-YY/XXXX
 * e.g., INV/2026-27/0001
 */
export async function generateSequentialInvoiceNumber() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Financial Year in India starts in April
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  const yearString = `${startYear}-${endYear}`;

  return await prisma.$transaction(async (tx) => {
    let counter = await tx.invoiceCounter.findFirst({
      where: { year: yearString },
    });

    if (!counter) {
      counter = await tx.invoiceCounter.create({
        data: { year: yearString, count: 1 },
      });
    } else {
      counter = await tx.invoiceCounter.update({
        where: { id: counter.id },
        data: { count: { increment: 1 } },
      });
    }

    const sequentialPart = counter.count.toString().padStart(4, "0");
    return `INV/${yearString}/${sequentialPart}`;
  });
}
