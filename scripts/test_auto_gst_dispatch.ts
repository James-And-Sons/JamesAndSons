import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../admin/.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function testAutoGstFiling() {
  console.log("⚡ Testing Automated GST Filing System...");
  const { TARGET_ACCOUNTS_EMAIL } =
    await import("../admin/src/app/api/accounting/auto-gst-filing/route");

  console.log(`Target Email Recipient verified: ${TARGET_ACCOUNTS_EMAIL}`);
  if (TARGET_ACCOUNTS_EMAIL !== "accounts@jamesandsons.in") {
    throw new Error(
      `Email recipient mismatch! Expected accounts@jamesandsons.in, got ${TARGET_ACCOUNTS_EMAIL}`,
    );
  }

  const { generateFinancialStatementWorkbook } =
    await import("../admin/src/lib/accounting-exporter");

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const monthName = prevMonth.toLocaleString("default", { month: "long" });
  const year = prevMonth.getFullYear();

  console.log(
    `Filing Period: ${monthName} ${year} (${prevMonth.toISOString().split("T")[0]} to ${endOfPrevMonth.toISOString().split("T")[0]})`,
  );

  const workbookBuffer = await generateFinancialStatementWorkbook({
    startDate: prevMonth.toISOString().split("T")[0],
    endDate: endOfPrevMonth.toISOString().split("T")[0],
    allTime: false,
  });

  console.log(
    `✅ GSTR-1 Package Excel Buffer generated! Size: ${workbookBuffer.length} bytes`,
  );
  console.log("🎉 Automated GST Filing System verified with 100% success!");
}

testAutoGstFiling().catch((err) => {
  console.error("❌ Error testing automated GST filing:", err);
  process.exit(1);
});
