# James & Sons — Enterprise Luxury E-Commerce & Omnichannel Sync Platform

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Yarn Version](https://img.shields.io/badge/yarn-4.14.1-blue.svg)](https://yarnpkg.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.5.0-2D3748.svg)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR%20%2F%20Postgres-3ECF8E.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.2.2-38bdf8.svg)](https://tailwindcss.com/)

---

## 1. Executive Platform Overview

**James & Sons** is a state-of-the-art, unified multi-channel e-commerce ecosystem built for high-end luxury lighting, architectural decor, and designer furniture.

Engineered as an enterprise **Yarn v4 Monorepo**, the platform integrates a D2C luxury storefront, a B2B procurement portal, an Admin Management Suite, and an automated **Omnichannel Inventory Sync Hub**.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          JAMES & SONS ENTERPRISE ECOSYSTEM                        │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌─────────────────────┐  │
│  │   D2C STOREFRONT      │   │   B2B WHOLESALE PORTAL│   │   ADMIN MANAGEMENT  │  │
│  │   • Dynamic Viewports │   │   • RFQ Quote Submits │   │   • Canvas Media Studio │  │
│  │   • 3D/AR View (.glb) │   │   • Tiered B2B Prices │   │   • AI Marketing Engine │  │
│  │   • Pincode Check     │   │   • Enterprise GSTIN  │   │   • Omnichannel Sync    │  │
│  └───────────┬───────────┘   └───────────┬───────────┘   └───────────┬─────────┘  │
└──────────────┼───────────────────────────┼───────────────────────────┼────────────┘
               │                           │                           │
┌──────────────┼───────────────────────────┼───────────────────────────┼────────────┐
│              ▼                           ▼                           ▼            │
│                              PERSISTENCE & SYNC HUB                               │
│  ┌──────────────────────────────────────┐   ┌──────────────────────────────────┐  │
│  │   Supabase PostgreSQL (Prisma ORM)   │   │   Omnichannel Sync Orchestrator  │  │
│  │   Connection Pooling (pg.Pool)       │   │   Amazon, Meta, Google, Pinterest│  │
│  └──────────────────────────────────────┘   └──────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Feature Highlights & Platform Capabilities

### 💎 D2C Luxury Storefront & Shopping Experience

- **Architectural Room Viewports**: Dynamic spatial filtering across luxury spaces (Living Room, Villa Foyer, Dining Room, Bedroom).
- **Interactive 3D/AR Viewer**: Integrated WebGL 3D model viewports (`.glb`) allowing customers to preview luxury light fixtures in augmented reality.
- **Persistent Cart Engine**: Built with Zustand for instant state persistence and seamless cart updates across user sessions.
- **Pincode Serviceability Check**: Real-time delivery availability and courier ETAs checked directly via the Shiprocket API.

### 🏢 B2B Procurement & Wholesale Portal

- **RFQ Submission System**: Dedicated procurement workflows for interior designers and architects to submit Request for Quotes (`RFQ` model).
- **Tiered B2B Pricing**: Automatically displays custom negotiated wholesale prices (`b2bPrice`) for authenticated B2B accounts (`B2B_BUYER` / `B2B_APPROVER`).
- **Corporate Account Management**: Supports enterprise client registration, GSTIN validation, corporate shipping/billing addresses, and parent-subsidiary company hierarchies (`Company` model).

### 🎨 Built-In Canvas Media Studio (`ProductImageEditor.tsx`)

- **2D Canvas Image Studio**: Embedded HTML5 canvas editor inside the Admin Portal for studio-grade asset preparation without desktop software.
- **Histogram Luminosity Auto-Enhance**: Auto-samples image exposure across a $100 \times 100$ pixel grid ($10,000$ points) to dynamically correct contrast and color saturation.
- **White Background Generation**: Inverts transparent backgrounds into solid studio `#FFFFFF` RGB fills to comply with Amazon and Google Merchant image listing standards.
- **Aspect Ratio Cropping & Watermarking**: Supports ratio locking (`1:1`, `4:3`, `16:9`), $90^\circ$ rotation, text watermarking, and direct WebP export to Cloudinary.

### 🚀 Automated Campaign & Marketing Engine (`/campaigns`)

- **Indian Holiday Calendar Sync**: Schedules automated promotional campaigns synchronized with national holidays (`IndianHoliday` model, e.g., Diwali, Dhanteras).
- **Customer Segmentation**: Targets specific segments (`VIP`, `LAPSED`, `ALL_CUSTOMERS`) with personalized promotional offers.
- **Gemini AI Product Recommendations**: Uses Google Gemini AI (`@google/generative-ai`) to auto-select top matching products for each customer segment.
- **Multi-Stage Automated Dispatch**: Sends customized HTML email layouts (via Resend) and WhatsApp text messages with automated 2-stage expiration warnings.
- **Dynamic 8-Character Coupons**: Auto-generates single-use discount codes (`DIWALI8X`) per customer.
- **PWA Push Notifications**: Pushes web browser alerts using VAPID keypairs (`web-push`).

### 🏷️ Promotions & Coupon Engine (`/promotions`)

- **Multi-Type Discount Engine**: Manages `PERCENTAGE` (e.g., 20% off), `FIXED_AMOUNT` (e.g., ₹500 off), and `FREE_SHIPPING` coupons.
- **Usage & Subtotal Caps**: Enforces minimum order subtotals (`minOrderAmount`), maximum discount limits (`maxDiscountCap`), platform-wide usage caps (`usageLimit`), and per-user limits (`usageLimitPerUser`).

### 📝 Editorial Blog CMS (`/blog`)

- **Rich-Text Publisher**: Full publishing suite for architectural lighting articles (`BlogPost` model).
- **Automated DOCX Document Importer**: Built-in CLI script (`publish_docx_blogs.ts`) and Admin UI portal (`/blog/import`) to convert Word `.docx` editorial manuscripts into formatted, SEO-optimized blog posts with live schema validation.
- **Embedded Product Pickers**: Uses `BlogProductPickerModal` to insert interactive purchase cards directly into blog content (`[product:slug]`).
- **Search Engine Schema Integration**: Manages meta titles, descriptions, geo takeaways, and embedded FAQ JSON schemas for Google Search indexing.

### 🛡️ Automated GSTIN Verification Engine

- **Format & Modulus-36 Checksum Validation**: Client & server validation helper (`validateGstinFormat`) checking official 15-character GSTIN structure (`09AABCJ8243A1ZT`) and state codes.
- **Live Verification API (`/api/verify-gstin`)**: Endpoint returning state name (e.g. Uttar Pradesh, Maharashtra, Delhi), business PAN, and taxpayer active status.
- **Storefront Integration**: Live verified badges and error checks at Storefront Checkout (`CheckoutPageClient.tsx`) and B2B Trade Application (`ApplyB2BForm.tsx`).

### 📊 Accounts & CA Financial Exporter (`/accounting`)

- **One-Click Statement Exporter**: Generates 4-sheet formatted Excel packages (`.xlsx`) via `exceljs` for CAs and accounting teams:
  - **Tab 1**: Master Sales Ledger & Orders Summary.
  - **Tab 2**: GSTR-1 B2B Sales Register (formatted for GST portal upload).
  - **Tab 3**: GSTR-1 B2CS Small Sales Register (State-wise & tax-rate-wise summaries).
  - **Tab 4**: HSN/SAC Code Summary.
- **Date Range & All-Time Export**: Interactive date controls (End Date defaulted to current date) plus **"Download Entire Data Up to Date"** one-click all-time export.
- **Zero-Human-Intervention Automated GST Email Filing**: Automated monthly GitHub Actions workflow (`.github/workflows/monthly-gst-filing.yml`) generating and emailing GSTR-1 Excel filing packages directly to `accounts@jamesandsons.in` on the 1st of every month at midnight.

### 🧾 Branded PDF Tax Invoice & Profile Download

- **Custom Luxury Header PDF Generator**: Generates clean, tax-compliant PDF invoices (`/api/orders/[id]/invoice`) featuring James & Sons logo header, invoice number, date, billing/shipping address, customer GSTIN details, itemized HSN codes, and CGST/SGST/IGST breakdown.
- **Customer Profile Download Action**: Provides a 1-click **"📄 Download Tax Invoice (PDF)"** button directly inside `/account/orders/[orderNumber]`.

### 🛒 Multi-Channel Abandoned Cart Recovery (Email + Meta WhatsApp)

- **Automated 2-Hour Recovery Engine**: `/api/recovery/cron` automatically detects carts abandoned for >30 minutes.
- **Dual Notification Dispatch**: Triggers customized HTML email nudges via Resend and instant personalized WhatsApp reminder pings via Meta WhatsApp Cloud API with 1-click recovery links (`/checkout?recoverCart=email`).

### 📈 Unified GA4 & Meta Pixel E-Commerce Analytics Engine

- **Plug-and-Play Ad Tracking (`tracking.ts`)**: Standardized data layer helper firing `ViewContent`, `AddToCart`, `InitiateCheckout`, and `Purchase` events simultaneously across both Google Analytics 4 (`gtag`) and Meta Pixel (`fbq`).

### 📱 Automated Meta WhatsApp Notifications

- **Zero-Cost Direct Messaging**: Powered by Meta Official WhatsApp Cloud API (`WHATSAPP_TOKEN` & `WHATSAPP_PHONE_NUMBER_ID`).
- **Instant Order Confirmation**: Sends automated WhatsApp pings upon payment confirmation with order summary and tracking link.
- **Shipment Dispatch & AWB Pings**: Dispatches instant WhatsApp updates when Shiprocket assigns courier AWB numbers.

### 🤝 Affiliate & Partner Portal (`/affiliates`)

- **Influencer Referral Tracking**: Assigns custom referral codes (e.g., `?ref=DESIGNERSTUDIO`) backed by 30-day tracking cookies (`jns_ref`).
- **Revenue & Commission Analytics**: Calculates real-time percentage commissions (`commissionRate`), tracks total revenue generated (`totalRevenue`), and logs conversions (`AffiliateConversion`).

### 🎫 Enterprise Support Ticket Center (`/tickets`)

- **Support Request Management**: Centralized ticketing inbox tied to customer orders (`Ticket` model).
- **Priority & Category Tagging**: Categorizes tickets by priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and type (`GENERAL`, `ORDER`, `PRODUCT`, `WARRANTY`).
- **Ticket Audit Trail**: Maintains audit logs (`TicketAuditLog`) for every status change, priority update, or agent reassignment.

### 🔄 Omnichannel Sync Engine (`admin/src/lib/sync`)

- **Parallel Sync Orchestrator**: Executes parallel background sync (`Promise.allSettled`) across all external marketplaces upon inventory or product updates.
- **Amazon Selling Partner API (SP-API)**: Authenticates via Login with Amazon (LWA) OAuth 2.0 and executes AWS SigV4 signed requests to update listings and stock levels.
- **Meta Commerce Catalog API**: Syncs product availability and image URLs to Meta Commerce Manager via Graph API.
- **Google Merchant Center API**: Pushes product feeds directly via Google Content API for Shopping.
- **Pinterest, Flipkart & Pepperfry**: Syncs channel catalog feeds and inventory balances.

### 💳 Payments & Logistics Integration

- **Razorpay Payment Gateway**: Manages order creation, payment links, instant refunds, and HMAC SHA-256 webhook signature verification.
- **Shiprocket Logistics**: Automated JWT token caching, volumetric rate calculation, automated AWB generation, pickup scheduling, and reverse return pickup management.

---

## 3. Tech Stack Matrix

| Layer                           | Technology                    | Details                                                  |
| :------------------------------ | :---------------------------- | :------------------------------------------------------- |
| **Monorepo Architecture**       | Yarn Workspaces               | v4.14.1 Corepack                                         |
| **Frontend Framework**          | Next.js (App Router)          | v16.2.1                                                  |
| **UI Library & Rendering**      | React                         | v19.2.4                                                  |
| **Styling & Design System**     | Vanilla CSS + Tailwind CSS    | v4.2.2 (PostCSS integration)                             |
| **State Management**            | Zustand                       | v5.0.12                                                  |
| **Icons & Visual Controls**     | Lucide React                  | v1.0.1                                                   |
| **Database & ORM**              | PostgreSQL + Prisma ORM       | `@prisma/client` & `@prisma/adapter-pg` v7.5.0           |
| **Connection Pooling**          | pg (Node-PostgreSQL Pool)     | v8.20.0 (Serverless max: 2 connections)                  |
| **Authentication & Auth Guard** | Supabase SSR & Supabase JS    | `@supabase/ssr` v0.9.0, `@supabase/supabase-js` v2.100.0 |
| **Asset Pipeline & Media**      | Cloudinary & Next-Cloudinary  | `cloudinary` v2.9.0, `next-cloudinary` v6.17.5           |
| **Payment Gateway**             | Razorpay Node SDK             | `razorpay` v2.9.6                                        |
| **Logistics Provider**          | Shiprocket API v2             | Direct REST API integration with token caching           |
| **Transactional Email & Push**  | Resend & Web-Push             | `resend` v6.12.3, `web-push` v3.6.7 (VAPID)              |
| **AI & Automation**             | Google Generative AI (Gemini) | `@google/generative-ai` v0.24.1                          |
| **Error Monitoring**            | Sentry SDK                    | `@sentry/nextjs` v10.69.0                                |
| **PDF Generation**              | jsPDF & Custom Canvas         | `jspdf` v4.2.1, `jspdf-autotable` v5.0.7                 |
| **Testing Frameworks**          | Vitest & Playwright           | `vitest` v3.0.5, `@playwright/test` v1.51.0              |

---

## 4. Quickstart & Environment Setup

### 1. Installation

```bash
git clone https://github.com/abhishiktemmanuel/HighEndLux-e-commerce.git
cd HighEndLux-e-commerce

# Enable Yarn 4 via Corepack
corepack enable

# Install workspace dependencies
yarn install
```

### 2. Environment Variables Setup

Copy `.env.example` to `.env.local` inside `admin` and `storefront`:

```ini
# =========================================================================
# SYSTEM & DATABASE
# =========================================================================
NEXT_PUBLIC_STOREFRONT_URL="https://jamesandsons.in"
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
DATABASE_URL="postgresql://postgres.ref:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# =========================================================================
# CLOUDINARY MEDIA PIPELINE
# =========================================================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="ml_default"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# =========================================================================
# PAYMENTS (RAZORPAY)
# =========================================================================
RAZORPAY_KEY_ID="rzp_test_or_live_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# =========================================================================
# LOGISTICS (SHIPROCKET)
# =========================================================================
SHIPROCKET_EMAIL="dev.team@jamesandsons.in"
SHIPROCKET_PASSWORD="your_shiprocket_password"
SHIPROCKET_WEBHOOK_TOKEN="your_shiprocket_webhook_token"
SHIPROCKET_PICKUP_LOCATION="Home PRIMARY"
STORE_PICKUP_PINCODE="202001"

# =========================================================================
# OMNICHANNEL MARKETPLACE SYNC
# =========================================================================
INVENTORY_SYNC_WEBHOOK_SECRET="your_inventory_sync_webhook_secret"

META_CATALOG_ID="your_meta_catalog_id"
META_ACCESS_TOKEN="your_meta_access_token"

PINTEREST_CATALOG_ID="your_pinterest_catalog_id"
PINTEREST_ACCESS_TOKEN="your_pinterest_access_token"

AMAZON_SELLER_ID="your_amazon_seller_merchant_id"
AMAZON_MARKETPLACE_ID="A21TJRUUN4KGV"
AMAZON_SP_API_ENDPOINT="https://sellingpartnerapi-eu.amazon.com"
AMAZON_LWA_CLIENT_ID="your_amazon_lwa_client_id"
AMAZON_LWA_CLIENT_SECRET="your_amazon_lwa_client_secret"
AMAZON_LWA_REFRESH_TOKEN="your_amazon_lwa_refresh_token"

AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="eu-west-1"

GOOGLE_MERCHANT_ID="5828116888"
GOOGLE_SERVICE_ACCOUNT_EMAIL="google-merchant-sync@jamesandsons.iam.gserviceaccount.com"
GOOGLE_APPLICATION_CREDENTIALS="jamesandsons-service-account-key.json"

# =========================================================================
# AI & NOTIFICATIONS
# =========================================================================
GEMINI_API_KEY="your_google_gemini_api_key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
VAPID_EMAIL="mailto:admin@jamesandsons.in"
```

### 3. Database Generation & Seed

```bash
# Generate Prisma client
yarn db:generate --workspace=@james-andsons/db

# Seed initial space categories
node admin/seed_spaces.js
```

### 4. Running Local Servers

```bash
# Admin Portal (http://localhost:3001)
yarn dev:admin

# D2C Storefront (http://localhost:3000)
yarn dev:storefront
```

---

## 5. Directory Structure

```
JamesAndSons/
├── admin/                         # Next.js 16 Admin Management Portal
│   ├── src/
│   │   ├── app/                   # Dashboard routes (Orders, Products, Campaigns, RFQs)
│   │   ├── components/            # Sidebar navigation, Cloudinary uploader, UI primitives
│   │   └── lib/sync/              # Omnichannel Sync Engine (Amazon, Meta, Google)
├── storefront/                    # Next.js 16 D2C & B2B Storefront App
│   ├── public/                    # 3D models (.glb), branding assets, fonts
│   └── src/                       # App Router (Catalog, Cart, Checkout, RFQs, Tickets)
├── packages/                      # Monorepo Shared Packages
│   ├── db/                        # Prisma Schema & PostgreSQL pool connection manager
│   ├── media/                     # Custom HTML5 Canvas ProductImageEditor studio
│   ├── razorpay/                  # Razorpay payments implementation
│   ├── shiprocket/                # Shiprocket logistics implementation
│   ├── auth/                      # Supabase SSR authentication helper
│   ├── blog-editor/               # Rich-text blog editor
│   ├── pdf-generator/             # jsPDF invoice generator
│   └── ui/                        # Design system & shared components
├── e2e/                           # Playwright End-to-End browser test suite
├── scripts/                       # DOCX blog importer & automated sync scripts
└── package.json                   # Root monorepo configuration
```

---

## 6. Deployment & Hosting

### Vercel Deployment Hook

```bash
# Root build command executed on Vercel:
yarn build
```

Executes `copy-assets.js`, `prisma generate`, package compilation, and Next.js production builds.

### Database Migrations

```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

---

## 7. License & Rights

Copyright © 2026 **James & Sons**. All rights reserved. Proprietary enterprise software.
