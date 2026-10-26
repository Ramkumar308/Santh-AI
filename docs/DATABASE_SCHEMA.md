# SanthAI Dual-Stack Database Architecture & Schema Specification

> **Review 2 & 3 Compliance Document**: PostgreSQL (Supabase) Relational DDL, Cloud Firestore Document Schemas, Row-Level Security (RLS), and Offline Synchronization Protocols.

---

## 1. Architectural Strategy: The Hybrid Data Engine

Produce vendors operate across two diametrically opposed connectivity states:
1. **At the Wholesale Mandi (4:00 AM - 8:00 AM)**: Intermittent 2G/3G connectivity or complete signal dead zones inside steel-roofed auction yards.
2. **At the Retail Stall / Post-Market (8:00 AM - 9:00 PM)**: Variable 4G/5G connections where transactional cloud backups, multi-device syncing, and market intelligence aggregation occur.

To support both extremes without compromising transaction speed or data integrity, SanthAI employs a **Dual-Stack Hybrid Architecture**:
- **Local Client Store**: Synchronous `localStorage` / IndexedDB caching providing **0ms offline latency** for daily inventory logging and fast customer checkouts.
- **Relational Cloud DB (PostgreSQL / Supabase)**: ACME-grade ACID relational schema with Row-Level Security (RLS) for multi-tenant data isolation, analytical aggregation, and financial audits.
- **Document Cloud DB (Cloud Firestore)**: Real-time NoSQL document store (`users/{userId}/...`) for live multi-device state synchronization and mobile notifications.

---

## 2. Entity Relationship Diagram (ERD)

```
┌────────────────────────────────┐
│            VENDORS             │
├────────────────────────────────┤
│ PK  id: UUID                   │
│     phone: VARCHAR(15) UNIQUE  │
│     market_name: VARCHAR(120)  │
│     stall_number: VARCHAR(40)  │
│     upi_vpa: VARCHAR(100)      │
│     closing_time: TIME         │
│     trust_score: NUMERIC(4,2)  │
└───────────────┬────────────────┘
                │ 1
                │
                ├─────────────────────────────────────────┐
                │ N                                       │ N
┌───────────────▼────────────────┐       ┌────────────────▼────────────────┐
│       DAILY_STOCK_LOGS         │       │        KHATA_CUSTOMERS          │
├────────────────────────────────┤       ├────────────────────────────────┤
│ PK  id: UUID                   │       │ PK  id: UUID                   │
│ FK  vendor_id: UUID            │       │ FK  vendor_id: UUID            │
│     log_date: DATE             │       │     name: VARCHAR(120)         │
│     commodity: VARCHAR(50)     │       │     phone: VARCHAR(15)         │
│     received_kg: NUMERIC(8,2)  │       │     total_due: NUMERIC(10,2)   │
│     sold_kg: NUMERIC(8,2)      │       │     credit_limit: NUMERIC(10,2)│
│     unsold_kg: NUMERIC(8,2)    │       │     risk_level: VARCHAR(20)    │
│     waste_kg: NUMERIC(8,2)     │       └───────────────┬────────────────┘
└────────────────────────────────┘                       │ 1
                                                         │
                                                         │ N
                                         ┌───────────────▼────────────────┐
                                         │       KHATA_TRANSACTIONS       │
                                         ├────────────────────────────────┤
                                         │ PK  id: UUID                   │
                                         │ FK  customer_id: UUID          │
                                         │     tx_date: TIMESTAMP         │
                                         │     tx_type: VARCHAR(10)       │
                                         │     amount: NUMERIC(10,2)      │
                                         │     description: TEXT          │
                                         │     days_delayed: INT          │
                                         └────────────────────────────────┘
```

---

## 3. Relational PostgreSQL (Supabase DDL)

The relational schema is defined with strict integrity constraints, foreign key cascades, check expressions, and performance indexes:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Vendors Master Table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    market_name VARCHAR(120) NOT NULL,
    stall_number VARCHAR(40) NOT NULL,
    upi_vpa VARCHAR(100) NOT NULL,
    market_closing_hour SMALLINT DEFAULT 20 CHECK (market_closing_hour BETWEEN 12 AND 24),
    trust_score NUMERIC(4,2) DEFAULT 80.00 CHECK (trust_score BETWEEN 0.00 AND 100.00),
    preferred_language VARCHAR(5) DEFAULT 'ta' CHECK (preferred_language IN ('ta', 'en'))
);

-- Index for phone-based authentication
CREATE INDEX idx_vendors_phone ON vendors(phone);

-- 2. Daily Stock & Wastage Logs
CREATE TABLE daily_stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    commodity VARCHAR(50) NOT NULL,
    received_kg NUMERIC(8,2) NOT NULL CHECK (received_kg >= 0),
    sold_kg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (sold_kg >= 0),
    unsold_kg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (unsold_kg >= 0),
    waste_kg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (waste_kg >= 0),
    procurement_price_per_kg NUMERIC(8,2),
    retail_price_per_kg NUMERIC(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_stock_balance CHECK (received_kg >= (sold_kg + waste_kg))
);

-- Composite index for fast vendor-commodity historical time-series queries
CREATE INDEX idx_stock_vendor_date ON daily_stock_logs(vendor_id, commodity, log_date DESC);

-- 3. Mandi Wholesale Price Cache
CREATE TABLE mandi_price_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_date DATE NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'Tamil Nadu',
    district VARCHAR(60) NOT NULL,
    market_name VARCHAR(100) NOT NULL,
    commodity VARCHAR(50) NOT NULL,
    min_price_per_kg NUMERIC(6,2) NOT NULL CHECK (min_price_per_kg >= 0),
    max_price_per_kg NUMERIC(6,2) NOT NULL CHECK (max_price_per_kg >= min_price_per_kg),
    modal_price_per_kg NUMERIC(6,2) NOT NULL,
    arrival_tons NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mandi_commodity_date ON mandi_price_records(commodity, record_date DESC);
CREATE INDEX idx_mandi_market ON mandi_price_records(market_name);

-- 4. Digital Khata Customer Ledger
CREATE TABLE khata_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(15),
    total_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    credit_limit NUMERIC(10,2) NOT NULL DEFAULT 3000.00 CHECK (credit_limit >= 0),
    risk_score SMALLINT NOT NULL DEFAULT 20 CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High')),
    last_purchase_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_khata_vendor ON khata_customers(vendor_id);
CREATE INDEX idx_khata_risk ON khata_customers(vendor_id, risk_level);

-- 5. Khata Transactions (Double-Entry Audit)
CREATE TABLE khata_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES khata_customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tx_type VARCHAR(10) NOT NULL CHECK (tx_type IN ('CREDIT', 'PAYMENT')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    items_description TEXT,
    days_delayed SMALLINT DEFAULT 0 CHECK (days_delayed >= 0),
    upi_ref_number VARCHAR(100)
);

CREATE INDEX idx_tx_customer ON khata_transactions(customer_id, created_at DESC);

-- 6. ResQ Surplus Clearance Listings
CREATE TABLE resq_clearance_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    commodity VARCHAR(50) NOT NULL,
    unsold_kg NUMERIC(8,2) NOT NULL CHECK (unsold_kg > 0),
    original_price_per_kg NUMERIC(6,2) NOT NULL,
    markdown_price_per_kg NUMERIC(6,2) NOT NULL CHECK (markdown_price_per_kg < original_price_per_kg),
    discount_percent SMALLINT NOT NULL CHECK (discount_percent BETWEEN 10 AND 70),
    urgency_level VARCHAR(10) NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED', 'EXPIRED')),
    buyer_name VARCHAR(120),
    buyer_type VARCHAR(30),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resq_active ON resq_clearance_deals(status, expires_at);
```

---

## 4. Row-Level Security (RLS) Policies

To protect private financial ledger data in multi-vendor environments, PostgreSQL Row-Level Security policies ensure vendors can only query and mutate their own records:

```sql
-- Enable RLS across tenant tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resq_clearance_deals ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can only access their own profile
CREATE POLICY vendor_self_access ON vendors
    FOR ALL USING (auth.uid() = id);

-- Policy: Vendors can only access their own stock logs
CREATE POLICY vendor_stock_access ON daily_stock_logs
    FOR ALL USING (auth.uid() = vendor_id);

-- Policy: Vendors can only view their own Khata customer ledgers
CREATE POLICY vendor_khata_access ON khata_customers
    FOR ALL USING (auth.uid() = vendor_id);

-- Policy: Public read access for wholesale Mandi benchmark prices
ALTER TABLE mandi_price_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_mandi_read ON mandi_price_records
    FOR SELECT TO public USING (true);
```

---

## 5. Cloud Firestore Document Hierarchy & Security Rules

When operating in Firebase Firestore mode, the database uses a scoped subcollection model:

```
/users/{userId}
   │
   ├── /stock_logs/{logId}
   ├── /khata_customers/{customerId}
   │      └── /transactions/{txId}
   ├── /resq_listings/{dealId}
   └── /custom_prices/{commodityId}
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: Validates user ownership
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /stock_logs/{logId} {
        allow read, write: if isOwner(userId);
      }

      match /khata_customers/{customerId} {
        allow read, write: if isOwner(userId);

        match /transactions/{txId} {
          allow read, write: if isOwner(userId);
        }
      }

      match /resq_listings/{dealId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Public read for baseline mandi prices
    match /mandi_records/{recordId} {
      allow read: if true;
      allow write: if false; // System ingestion only
    }
  }
}
```

---

## 6. Offline Synchronization & Conflict Resolution Protocol

1. **Optimistic Local Execution**: When a transaction is recorded (e.g. customer credit sale of ₹500), the app writes immediately to local storage with:
   - `id`: Client-generated UUID v4
   - `syncStatus`: `'pending'`
   - `localUpdatedAt`: ISO timestamp
2. **Online Delta Push**: When `navigator.onLine === true`, the sync manager flushes pending records to `/api/sync/push`.
3. **Conflict Resolution Strategy**:
   - **Financial Ledgers (Khata)**: **Additive append-only model**. Ledger transactions are never updated in place; corrections are recorded as distinct balancing debit/credit entries, preventing race conditions.
   - **Inventory Logs**: **Last-Write-Wins (LWW)** with client timestamp comparison. If cloud `updated_at > localUpdatedAt`, cloud state is adopted.
