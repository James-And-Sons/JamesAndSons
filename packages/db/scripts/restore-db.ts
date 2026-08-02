import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
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

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1];
const s3KeyArg = args.find((a) => a.startsWith("--s3Key="))?.split("=")[1];

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function downloadFromS3(s3Key: string): Promise<Buffer> {
  const bucketName =
    process.env.AWS_S3_BACKUP_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials or bucket name missing for S3 download.");
  }

  console.log(
    `☁️ Fetching backup snapshot from AWS S3: s3://${bucketName}/${s3Key}...`,
  );
  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  if (!response.Body) throw new Error("Empty body returned from S3.");
  return await streamToBuffer(response.Body as Readable);
}

async function main() {
  console.log("🔄 Starting James & Sons Database Restore Procedure...");

  let compressedData: Buffer;

  if (fileArg) {
    const fullPath = path.resolve(process.cwd(), fileArg);
    console.log(`📄 Reading local backup snapshot: ${fullPath}`);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    compressedData = fs.readFileSync(fullPath);
  } else if (s3KeyArg) {
    compressedData = await downloadFromS3(s3KeyArg);
  } else {
    // Find latest local backup
    const backupDir = path.resolve(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      throw new Error(
        "No local backups found in packages/db/backups directory.",
      );
    }

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".sql.gz"))
      .sort()
      .reverse();
    if (files.length === 0) {
      throw new Error("No .sql.gz files found in packages/db/backups.");
    }

    const latestFile = path.join(backupDir, files[0]);
    console.log(`📦 Auto-selected latest local backup: ${latestFile}`);
    compressedData = fs.readFileSync(latestFile);
  }

  let sqlString: string;
  try {
    const uncompressed = zlib.gunzipSync(compressedData);
    sqlString = uncompressed.toString("utf-8");
  } catch (err) {
    sqlString = compressedData.toString("utf-8"); // If raw uncompressed SQL was provided
  }

  console.log("⚡ Executing restore on database...");

  const statements = sqlString
    .split(/;\s*\n/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let executedCount = 0;
      for (const stmt of statements) {
        if (stmt) {
          await client.query(stmt);
          executedCount++;
        }
      }
      await client.query("COMMIT");
      console.log(
        `✅ Database Restoration Completed Successfully! (${executedCount} SQL statements executed)`,
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Database Restore Failed:", err);
  process.exit(1);
});
