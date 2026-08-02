import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { execSync } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, "../../../admin/.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const backupDir = path.resolve(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFileName = `db-backup-${timestamp}.sql`;
const backupFilePath = path.join(backupDir, backupFileName);
const compressedFilePath = `${backupFilePath}.gz`;

async function exportDatabaseData(pool: Pool): Promise<string> {
  const client = await pool.connect();
  try {
    let sqlDump = `-- James & Sons Database Backup Snapshot\n-- Generated: ${new Date().toISOString()}\n\n`;
    sqlDump += `SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\n\n`;

    // Fetch all public tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map((r) => r.table_name);
    console.log(`📦 Found ${tables.length} tables in PostgreSQL database.`);

    for (const table of tables) {
      if (table.startsWith("_prisma")) continue; // Skip migration tracking if desired

      // Fetch columns
      const colsRes = await client.query(
        `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `,
        [table],
      );

      const cols = colsRes.rows.map((c) => `"${c.column_name}"`).join(", ");

      // Fetch rows
      const rowsRes = await client.query(`SELECT * FROM "${table}"`);
      if (rowsRes.rows.length === 0) continue;

      sqlDump += `-- Table: ${table} (${rowsRes.rows.length} records)\n`;
      for (const row of rowsRes.rows) {
        const values = Object.values(row)
          .map((val) => {
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number" || typeof val === "boolean")
              return `${val}`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (Array.isArray(val)) {
              if (val.length === 0) return "'{}'";
              if (typeof val[0] === "object" && val[0] !== null) {
                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              }
              const items = val
                .map((v) =>
                  typeof v === "string"
                    ? `"${v.replace(/"/g, '\\"')}"`
                    : String(v),
                )
                .join(",");
              return `'${"{" + items + "}"}'`;
            }
            if (typeof val === "object") {
              return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
          })
          .join(", ");

        sqlDump += `INSERT INTO "${table}" (${cols}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlDump += `\n`;
    }

    return sqlDump;
  } finally {
    client.release();
  }
}

async function uploadToS3(filePath: string, s3Key: string): Promise<boolean> {
  const bucketName =
    process.env.AWS_S3_BACKUP_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "eu-west-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    console.log(
      "ℹ️ AWS S3 credentials or bucket name (AWS_S3_BACKUP_BUCKET) not set. Skipping AWS S3 upload.",
    );
    return false;
  }

  console.log(
    `☁️ Uploading compressed backup to AWS S3 bucket: ${bucketName}...`,
  );

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileContent,
    ContentType: "application/gzip",
    ServerSideEncryption: "AES256",
  });

  await s3Client.send(command);
  console.log(`✅ AWS S3 Upload Successful: s3://${bucketName}/${s3Key}`);
  return true;
}

async function main() {
  console.log("🚀 Starting James & Sons Secondary Database Backup...");

  let success = false;

  // Option 1: Native pg_dump if available
  try {
    console.log("Trying native pg_dump export...");
    execSync(
      `pg_dump "${dbUrl}" --no-owner --no-privileges -f "${backupFilePath}"`,
      { stdio: "ignore" },
    );
    const rawSql = fs.readFileSync(backupFilePath);
    const compressed = zlib.gzipSync(rawSql);
    fs.writeFileSync(compressedFilePath, compressed);
    fs.unlinkSync(backupFilePath);
    success = true;
    console.log(`✅ Native pg_dump export complete: ${compressedFilePath}`);
  } catch (err) {
    console.log(
      "ℹ️ Native pg_dump not installed or restricted. Falling back to Node.js JS SQL Exporter...",
    );
  }

  // Option 2: Fallback JS SQL Exporter
  if (!success) {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      const sqlContent = await exportDatabaseData(pool);
      const compressed = zlib.gzipSync(Buffer.from(sqlContent, "utf-8"));
      fs.writeFileSync(compressedFilePath, compressed);
      console.log(
        `✅ Database exported & compressed successfully: ${compressedFilePath}`,
      );
    } finally {
      await pool.end();
    }
  }

  const stat = fs.statSync(compressedFilePath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Final Backup File Size: ${sizeMb} MB (${stat.size} bytes)`);

  // Upload to AWS S3
  const dateFolder = new Date().toISOString().slice(0, 10);
  const s3Key = `db-backups/${dateFolder}/${path.basename(compressedFilePath)}`;
  await uploadToS3(compressedFilePath, s3Key);

  console.log("🎉 Secondary Database Backup Procedure Finished Successfully!");
}

main().catch((err) => {
  console.error("❌ Backup Failed:", err);
  process.exit(1);
});
