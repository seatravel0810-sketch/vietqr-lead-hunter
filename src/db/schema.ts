import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  doublePrecision,
  numeric,
  timestamp,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// 1. Bảng Người dùng (Tài khoản & Hạn mức Credits)
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique().notNull(),
    phone: text("phone"),
    fullName: text("full_name"),
    planTier: text("plan_tier").notNull().default("free"), // 'free', 'starter', 'pro', 'business'
    creditsBalance: integer("credits_balance").notNull().default(50),
    creditsResetAt: timestamp("credits_reset_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_users_email").on(table.email)]
);

// 2. Bảng Cơ sở kinh doanh (Pre-indexed Google Maps Lead Cache)
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: text("place_id").unique().notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(), // 'spa', 'dental', 'salon', 'clinic', 'restaurant'...
    categoryLabel: text("category_label"),
    phone: text("phone"),
    phoneStandard: text("phone_standard"), // +84908401994
    phoneType: text("phone_type").default("none"), // 'mobile', 'landline', 'none'
    address: text("address").notNull(),
    street: text("street"),
    ward: text("ward"),
    district: text("district"),
    city: text("city").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    plusCode: text("plus_code"),
    googleRating: numeric("google_rating", { precision: 2, scale: 1 }).default("5.0"),
    reviewsCount: integer("reviews_count").default(0),
    googleMapsUrl: text("google_maps_url").notNull(),
    website: text("website"),
    hasWebsite: boolean("has_website").default(false),
    isHttps: boolean("is_https").default(false),
    websiteStatus: integer("website_status").default(0), // 200, 404, 0, -1
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),
    openingHours: jsonb("opening_hours").default({}),
    operationalStatus: text("operational_status").default("OPERATIONAL"),
    rawData: jsonb("raw_data").default({}),
    lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_leads_city").on(table.city),
    index("idx_leads_category").on(table.category),
    index("idx_leads_phone_type").on(table.phoneType),
    index("idx_leads_has_website").on(table.hasWebsite),
    index("idx_leads_rating").on(table.googleRating),
  ]
);

// 3. Bảng Lịch sử Tìm kiếm
export const searchQueries = pgTable("search_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  keyword: text("keyword").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  radiusKm: integer("radius_km").default(10),
  totalResultsFound: integer("total_results_found").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 4. Bảng Lịch sử Xuất Dữ liệu & Trừ Credits (30-day Deduplication Protection)
export const userExports = pgTable("user_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  exportName: text("export_name").notNull(),
  leadsCount: integer("leads_count").notNull(),
  creditsSpent: integer("credits_spent").notNull(),
  fileFormat: text("file_format").notNull().default("xlsx"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userExportedLeads = pgTable(
  "user_exported_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    exportId: uuid("export_id").references(() => userExports.id, {
      onDelete: "set null",
    }),
    exportedAt: timestamp("exported_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("uq_user_lead_export").on(table.userId, table.leadId),
    index("idx_exported_leads_user_lead").on(table.userId, table.leadId),
  ]
);

// 5. Bảng Mini-CRM Lead Pipeline
export const leadPipeline = pgTable(
  "lead_pipeline",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    stage: text("stage").notNull().default("new"), // 'new', 'contacted', 'interested', 'won', 'lost'
    notes: text("notes"),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("uq_user_lead_pipeline").on(table.userId, table.leadId),
    index("idx_pipeline_user_stage").on(table.userId, table.stage),
  ]
);

// 6. Bảng Giao dịch Thanh toán Tự động VietQR
export const billingTransactions = pgTable(
  "billing_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planTier: text("plan_tier").notNull(),
    amount: integer("amount").notNull(),
    creditsAwarded: integer("credits_awarded").notNull(),
    paymentCode: text("payment_code").unique().notNull(),
    gateway: text("gateway").notNull().default("sepay"),
    status: text("status").notNull().default("pending"), // 'pending', 'paid', 'expired'
    transactionRef: text("transaction_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_transactions_payment_code").on(table.paymentCode)]
);
