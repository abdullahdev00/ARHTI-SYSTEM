import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const farmers = pgTable("farmers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
});

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: varchar("farmer_id").notNull(),
  crop: text("crop").notNull(),
  bagType: text("bag_type").notNull(),
  bagWeight: decimal("bag_weight", { precision: 10, scale: 2 }),
  numberOfBags: integer("number_of_bags").notNull(),
  ratePerBag: decimal("rate_per_bag", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  notes: text("notes"),
});

export const stock = pgTable("stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  crop: text("crop").notNull(),
  bagType: text("bag_type").notNull(),
  bagWeight: decimal("bag_weight", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  buyRate: decimal("buy_rate", { precision: 10, scale: 2 }).notNull(),
  sellRate: decimal("sell_rate", { precision: 10, scale: 2 }).notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const cropRates = pgTable("crop_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  crop: text("crop").notNull().unique(),
  rate40kg: decimal("rate_40kg", { precision: 10, scale: 2 }).notNull(),
  rate60kg: decimal("rate_60kg", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: varchar("farmer_id").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(),
  netPayable: decimal("net_payable", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"),
  date: timestamp("date").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  invoiceId: varchar("invoice_id"),
  status: text("status").notNull().default("completed"),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
});

export const charges = pgTable("charges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  appliedTo: text("applied_to"),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFarmerSchema = createInsertSchema(farmers).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true });
export const insertStockSchema = createInsertSchema(stock).omit({ id: true });
export const insertCropRateSchema = createInsertSchema(cropRates).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertChargeSchema = createInsertSchema(charges).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmers.$inferSelect;

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stock.$inferSelect;

export type InsertCropRate = z.infer<typeof insertCropRateSchema>;
export type CropRate = typeof cropRates.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertCharge = z.infer<typeof insertChargeSchema>;
export type Charge = typeof charges.$inferSelect;

export interface MockFarmer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalAmount: string;
  status: string;
  lastDeal: string;
  notes: string;
}

export interface MockCropRate {
  id: string;
  crop: string;
  bag40kg: number;
  bag60kg: number;
}

export interface MockPurchase {
  id: string;
  farmerId: string;
  farmer: string;
  crop: string;
  quantity: string;
  rate: string;
  total: string;
  date: string;
  status: string;
}

export interface MockPayment {
  id: string;
  name: string;
  invoice: string;
  amount: string;
  type: string;
  status: string;
  date: string;
}

export interface MockStock {
  id: string;
  crop: string;
  bags60kg: {
    quantity: number;
    buyRate: number;
    sellRate: number;
  };
  bags40kg: {
    quantity: number;
    buyRate: number;
    sellRate: number;
  };
  totalValue: string;
}

export interface MockCharge {
  id: string;
  title: string;
  amount: number;
  type: string;
  lastEdited: string;
  notes: string;
}

export interface MockInvoice {
  id: string;
  farmerId: string;
  farmer: string;
  date: string;
  total: string;
  commission: string;
  netPayable: string;
  status: string;
}

export interface MockData {
  farmers: MockFarmer[];
  cropRates: MockCropRate[];
  purchases: MockPurchase[];
  payments: MockPayment[];
  stock: MockStock[];
  charges: MockCharge[];
  invoices: MockInvoice[];
}

import mockDataJson from './data.json';

export const mockData: MockData = mockDataJson as MockData;

export function getMockData(): MockData {
  return mockData;
}
