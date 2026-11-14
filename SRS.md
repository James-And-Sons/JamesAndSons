# Software Requirements Specification (SRS)

## Project: James & Sons High-End Luxury E-Commerce & Omnichannel Ecosystem

**Document Version:** 1.0.0  
**Date:** August 2026  
**Status:** Approved for Production Architecture

---

## 1. System Architecture & Scope

### 1.1 High-Level System Architecture

The James & Sons platform is an enterprise-grade multi-channel e-commerce system built on a Yarn v4 Monorepo workspace architecture. The system establishes a clean separation between D2C consumer interfaces, B2B procurement, administrative backoffice operations, and automated third-party marketplace synchronization engines.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT INTERFACES                                  │
│  ┌─────────────────────────────────────┐   ┌───────────────────────────────────┐  │
│  │   D2C Storefront & B2B Portal       │   │      Admin Management Portal      │  │
│  │     (Next.js 16 / React 19)         │   │     (Next.js 16 / Canvas Studio)  │  │
│  └──────────────────┬──────────────────┘   └─────────────────┬─────────────────┘  │
└─────────────────────┼────────────────────────────────────────┼────────────────────┘
                      │                                        │
┌─────────────────────┼────────────────────────────────────────┼────────────────────┐
│                     ▼                                        ▼                    │
│                               SHARED DOMAIN PACKAGES                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ @james-andsons/auth  │ @james-andsons/db      │ @james-andsons/media        │  │
│  │ @james-andsons/ui    │ @james-andsons/razorpay│ @james-andsons/shiprocket   │  │
│  └──────────────────────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────┼─────────────────────────────────────────┐
│                                         ▼                                         │
│                            PERSISTENCE & SYNC LAYER                               │
│  ┌──────────────────────────────────────┐   ┌──────────────────────────────────┐  │
│  │   Supabase PostgreSQL (Prisma ORM)   │   │   Omnichannel Sync Orchestrator  │  │
│  │   Row-Level Security (RLS) Policies  │   │   (Amazon, Meta, Google, etc.)   │  │
│  └──────────────────────────────────────┘   └──────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 System Boundaries & Scope

- **In-Scope**: D2C luxury storefront browsing, 3D model viewports, Zustand client cart management, dynamic B2B RFQs, coupon & affiliate attribution tracking, Razorpay payment processing, Shiprocket fulfillment & return logistics, Admin backoffice management, HTML5 2D canvas product image editing, and multi-channel marketplace listing & inventory synchronization.
- **Out-of-Scope**: Native mobile application binaries (platform utilizes progressive PWA push notifications via VAPID standard instead).

---

## 2. Functional Requirements by Module

### 2.1 Storefront Module

#### FR-ST-01: Catalog & Product Browsing

- **FR-ST-01.1**: The system shall render luxury product catalogs filtered by space (e.g., Living Room, Foyer, Dining Room) and subcategory.
- **FR-ST-01.2**: The system shall display structured technical specifications including Luminous Efficacy (`lm/W`), Color Rendering Index (CRI), BIS Certification standard (`IS 10322`), HSN Code, dimensions, bulb type, and finish.
- **FR-ST-01.3**: The system shall support interactive 3D model viewports (`.glb`) for augmented reality previewing.

#### FR-ST-02: B2B Procurement & RFQ Engine

- **FR-ST-02.1**: The system shall allow logged-in B2B accounts (`B2B_BUYER` / `B2B_APPROVER` role) to view negotiated B2B prices instead of standard D2C prices.
- **FR-ST-02.2**: The system shall provide an RFQ submission workflow allowing corporate buyers to submit quote requests for project procurement.
- **FR-ST-02.3**: The system shall enable administrators to review RFQs, assign approved unit prices, and convert RFQs into executable orders (`RFQStatus: APPROVED -> CONVERTED_TO_ORDER`).

#### FR-ST-03: Cart State & Checkout Processing

- **FR-ST-03.1**: Client cart state shall be managed using Zustand persistent state, maintaining item selections across sessions.
- **FR-ST-03.2**: The checkout pipeline shall enforce pincode serviceability checks against the Shiprocket courier API.
- **FR-ST-03.3**: The checkout system shall apply coupon codes (Percentage, Fixed Amount, Free Shipping) and attribute conversions to registered affiliates via `jns_ref` HTTP-only cookies.
- **FR-ST-03.4**: Payments shall be processed via Razorpay JS SDK, creating server-side Razorpay orders before initiating checkout modals.

#### FR-ST-04: Customer Support & Service Tickets

- **FR-ST-04.1**: Logged-in customers shall be able to raise support tickets tied to existing orders (`Ticket` model).
- **FR-ST-04.2**: Support communications shall support real-time message threading, status tracking (`OPEN`, `IN_PROGRESS`, `RESOLVED`), and file attachments.

---

### 2.2 Admin Portal & Studio Module

#### FR-AD-01: Catalog & Inventory Management

- **FR-AD-01.1**: Administrators shall manage products, variants, dimensions, stock levels, and multi-channel SEO metadata (Amazon bullet points, Google product categories).
- **FR-AD-01.2**: The system shall update stock quantities in real time and automatically trigger background synchronization across connected marketplace channels.

#### FR-AD-02: Custom Canvas Image Editor Panel (`ProductImageEditor`)

- **FR-AD-02.1**: The system shall provide a client-side HTML5 canvas editor supporting image cropping, aspect ratio locking (1:1, 4:3, 16:9), rotation (90° steps), brightness, contrast, saturation, and sharpness adjustments.
- **FR-AD-02.2**: The editor shall feature an **Auto-Enhance** algorithm that samples image luminosity via a 100x100 histogram grid to dynamically adjust exposure and contrast.
- **FR-AD-02.3**: The system shall render custom text watermarks and generate transparent background PNGs or solid white background outputs (`whiteBackgroundImages`).
- **FR-AD-02.4**: The system shall upload processed canvas blobs directly to Cloudinary via unsigned (`ml_default`) or signed upload APIs, returning optimized WebP/JPG image URLs.

#### FR-AD-03: Order Processing & Reverse Logistics

- **FR-AD-03.1**: Admins shall process pending orders, trigger e-invoice generation (IRN), and push order data to Shiprocket (`createShipmentParams`).
- **FR-AD-03.2**: Admins shall manage return requests, generate reverse pickup AWBs, and print return shipping labels directly from the portal.

#### FR-AD-04: Automated Campaign Engine

- **FR-AD-04.1**: The system shall schedule marketing campaigns tied to Indian national holidays (`IndianHoliday` model).
- **FR-AD-04.2**: The campaign engine shall auto-generate dynamic 8-character unique coupon codes (`DIWALI8X`), dispatch emails via Resend, and push PWA browser notifications using VAPID keys.

#### FR-AD-05: Accounts & Financial Exporter Engine

- **FR-AD-05.1**: The system shall provide a one-click Financial Statement Exporter at `/admin/accounting` generating a 4-sheet Excel workbook (`.xlsx`) containing Master Sales Ledger, GSTR-1 B2B Register, GSTR-1 B2CS Small Register, and HSN/SAC Summary.
- **FR-AD-05.2**: The exporter shall support customizable `Start Date` and `End Date` controls (defaulting End Date to current date) plus a **"Download Entire Data Up to Date"** option for all-time dataset export.

#### FR-AD-06: Automated GSTIN Verification & Filing Engine

- **FR-AD-06.1**: The system shall validate GSTIN input using 15-character pattern matching and Modulus-36 checksum verification (`validateGstinFormat`), resolving Indian State/UT and business PAN.
- **FR-AD-06.2**: The system shall run an automated monthly GitHub Actions workflow (`.github/workflows/monthly-gst-filing.yml`) on the 1st of every month at midnight, generating the GSTR-1 sales package and emailing it to `accounts@jamesandsons.in` with zero human intervention.

---

### 2.3 Marketplace & Sync Engine Module

#### FR-MP-01: Omnichannel Sync Orchestrator

- **FR-MP-01.1**: The system shall execute background inventory sync via `orchestrateOmnichannelSync`, triggering channel sync handlers in parallel using `Promise.allSettled`.
- **FR-MP-01.2**: The sync engine shall log each execution state (`SUCCESS`, `FAILED`, `SKIPPED`) to `inventory-sync-history.json` and Supabase audit tables.

#### FR-MP-02: Channel Integration Requirements

- **Amazon SP-API**: Authenticate via Login with Amazon (LWA) OAuth 2.0, execute AWS SigV4 signed HTTP requests to `sellingpartnerapi-eu.amazon.com`, update JSON product listings, update stock levels, and pull unshipped marketplace orders.
- **Meta Commerce Catalog API**: Post updated product catalogs, availability, prices, and image URLs to Graph API endpoint `https://graph.facebook.com/v19.0/{META_CATALOG_ID}/products`.
- **Google Merchant Center API**: Push product feeds using Google Content API for Shopping (`google-merchant-sync` service account).
- **Pinterest Shopping API**: Upload product catalogs and track pins via Pinterest OAuth access token.
- **Flipkart & Pepperfry**: Format CSV/JSON inventory updates for channel end-points.

---

### 2.4 Logistics & Payments Module

#### FR-LP-01: Razorpay Payment System

- **FR-LP-01.1**: Order creation via `createRazorpayOrder(amount, receipt)`.
- **FR-LP-01.2**: Payment signature verification via HMAC SHA-256 (`crypto.createHmac('sha256', secret)`).
- **FR-LP-01.3**: Payment link generation (`createPaymentLink`) for B2B invoice collection.
- **FR-LP-01.4**: Automated refund processing (`refundRazorpayPayment`) on order cancellation or inventory failure.

#### FR-LP-02: Shiprocket Fulfillment System

- **FR-LP-02.1**: Automated token authentication (`getShiprocketToken`) caching JWT tokens with 9-day expiration.
- **FR-LP-02.2**: Real-time shipping rate calculation (`calculateShippingRate`) based on volumetric weight (length × breadth × height / 5000) and delivery pincode.
- **FR-LP-02.3**: Automated order push and AWB generation (`createShipment`).
- **FR-LP-02.4**: Webhook handling (`/api/webhooks/logistics`) updating order tracking status (`SHIPPED`, `DELIVERED`, `CANCELLED`) in real-time.

---

## 3. Non-Functional Requirements

### 3.1 Performance Benchmarks

- **Page Load Speed**: D2C storefront hero pages must achieve Largest Contentful Paint (LCP) under 2.2 seconds on 4G networks.
- **Database Connection Pooling**: PostgreSQL connections in serverless environments must use `pg.Pool` with `max: 2` connections per instance to prevent connection exhaustion under high concurrency.
- **Image Optimization**: Images served via `@james-andsons/media` must utilize Cloudinary automatic format (`f_auto`) and quality (`q_auto`) transformations, capping maximum width at 800px for catalog thumbnails.

### 3.2 Scalability & Availability

- **System Uptime**: 99.9% availability for D2C Storefront and Checkout endpoints.
- **Serverless Scaling**: Next.js App Router API routes must execute within 15 seconds execution limit, delegating long-running sync tasks to asynchronous webhooks.

### 3.3 UI/UX Standards

- **Design Tokens**: Standardized CSS custom properties for typography (`Inter`, `Playfair Display`), colors (`gold`, `charcoal`, `cream`), and standard glassmorphism elements.
- **Accessibility (a11y)**: WCAG 2.1 Level AA compliance, proper ARIA labels on custom form controls, keyboard focus rings, and high contrast text ratios.

---

## 4. Security & Compliance

### 4.1 Data Encryption & Secret Isolation

- All data in transit must use TLS 1.3 encryption.
- Environment secrets (Supabase Service Role Key, Razorpay Key Secret, Shiprocket Credentials, AWS Access Keys) must strictly remain on server-side runtimes and never be prefixed with `NEXT_PUBLIC_`.

### 4.2 Supabase Row-Level Security (RLS)

- Public users (`CUSTOMER`) possess `SELECT` access strictly to published products (`Product`), categories (`Category`), and published blog posts (`BlogPost`).
- Users can access order records (`Order`), RFQs (`RFQ`), and addresses (`UserAddress`) strictly matching their authenticated user ID (`auth.uid() = user_id`).
- Admin operations require `ADMIN` role claim in Supabase JWT session.

### 4.3 Payment Compliance (PCI-DSS)

- Cardholder data is never stored on internal servers. All credit card, debit card, UPI, and net banking transactions are processed via Razorpay PCI-DSS Level 1 compliant hosted checkout modals.

### 4.4 Webhook Authorization & Signature Verification

- Webhooks from Razorpay must be verified using HMAC SHA-256 signatures before mutating order statuses in the database.
- Shiprocket webhooks must validate the `x-shiprocket-token` header against `SHIPROCKET_WEBHOOK_TOKEN`.
- Omnichannel inventory sync triggers must validate `INVENTORY_SYNC_WEBHOOK_SECRET`.
