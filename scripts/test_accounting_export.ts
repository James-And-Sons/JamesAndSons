import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../admin/.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function runTest() {
  const { generateFinancialStatementWorkbook, generateFinancialCsv } =
    await import("../admin/src/lib/accounting-exporter");

  console.log("📊 Generating 4-sheet Excel workbook for all-time data...");
  const xlsxBuffer = await generateFinancialStatementWorkbook({
    allTime: true,
  });
  console.log(`✅ Excel Workbook Generated! Size: ${xlsxBuffer.length} bytes`);

  const outputPath = path.resolve(
    __dirname,
    "AllTime_Financial_Statement_Test.xlsx",
  );
  fs.writeFileSync(outputPath, xlsxBuffer);
  console.log(`💾 Saved sample Excel file to ${outputPath}`);

  console.log("\n📄 Generating CSV export...");
  const csvData = await generateFinancialCsv({ allTime: true });
  console.log(`✅ CSV Generated! Character count: ${csvData.length} chars`);
  console.log("Sample CSV Header:\n", csvData.split("\n")[0]);
}

runTest().catch((err) => {
  console.error("❌ Error testing accounting exporter:", err);
  process.exit(1);
});
