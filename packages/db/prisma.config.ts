import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "../.env.local") });
config({ path: path.join(__dirname, "../../storefront/.env.local") });
config();
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
