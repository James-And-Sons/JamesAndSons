import { NextResponse } from "next/server";
import {
  generateFinancialStatementWorkbook,
  generateFinancialCsv,
} from "@/lib/accounting-exporter";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const allTime = searchParams.get("allTime") === "true";
    const format = (searchParams.get("format") || "xlsx").toLowerCase();

    const todayStr = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      const csvData = await generateFinancialCsv({
        startDate,
        endDate,
        allTime,
      });
      const filename = allTime
        ? `Accounts_Ledger_AllTime_${todayStr}.csv`
        : `Accounts_Ledger_${startDate || "Start"}_to_${endDate || todayStr}.csv`;

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Default: Formatted Excel Workbook (.xlsx)
    const excelBuffer = await generateFinancialStatementWorkbook({
      startDate,
      endDate,
      allTime,
    });
    const filename = allTime
      ? `Accounts_Financial_Statement_AllTime_${todayStr}.xlsx`
      : `Accounts_Financial_Statement_${startDate || "Start"}_to_${endDate || todayStr}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting financial statement:", error);
    return NextResponse.json(
      {
        error:
          error.message || "Failed to generate financial statement export.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { startDate, endDate, allTime, format = "xlsx" } = body || {};

    const todayStr = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      const csvData = await generateFinancialCsv({
        startDate,
        endDate,
        allTime,
      });
      return NextResponse.json({ success: true, format: "csv", data: csvData });
    }

    const excelBuffer = await generateFinancialStatementWorkbook({
      startDate,
      endDate,
      allTime,
    });
    const base64 = excelBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      format: "xlsx",
      filename: allTime
        ? `Accounts_Financial_Statement_AllTime_${todayStr}.xlsx`
        : `Accounts_Financial_Statement_${startDate || "Start"}_to_${endDate || todayStr}.xlsx`,
      dataBase64: base64,
    });
  } catch (error: any) {
    console.error("Error in POST /api/accounting/export:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate export." },
      { status: 500 },
    );
  }
}
