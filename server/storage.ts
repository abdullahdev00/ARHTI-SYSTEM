import { 
  type User, type InsertUser, users,
  type Farmer, type InsertFarmer, farmers,
  type Purchase, type InsertPurchase, purchases,
  type Stock, type InsertStock, stock,
  type CropRate, type InsertCropRate, cropRates,
  type Invoice, type InsertInvoice, invoices,
  type Payment, type InsertPayment, payments,
  type Charge, type InsertCharge, charges
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Farmers
  getAllFarmers(): Promise<Farmer[]>;
  getFarmer(id: string): Promise<Farmer | undefined>;
  createFarmer(farmer: InsertFarmer): Promise<Farmer>;
  updateFarmer(id: string, farmer: Partial<InsertFarmer>): Promise<Farmer | undefined>;
  deleteFarmer(id: string): Promise<void>;
  
  // Purchases
  getAllPurchases(): Promise<Purchase[]>;
  getPurchase(id: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: string, purchase: Partial<InsertPurchase>): Promise<Purchase | undefined>;
  deletePurchase(id: string): Promise<void>;
  
  // Stock
  getAllStock(): Promise<Stock[]>;
  getStockItem(id: string): Promise<Stock | undefined>;
  getStockByCrop(crop: string): Promise<Stock[]>;
  createStockItem(stockItem: InsertStock): Promise<Stock>;
  updateStockItem(id: string, stockItem: Partial<InsertStock>): Promise<Stock | undefined>;
  deleteStockItem(id: string): Promise<void>;
  
  // Crop Rates
  getAllCropRates(): Promise<CropRate[]>;
  getCropRate(crop: string): Promise<CropRate | undefined>;
  createCropRate(cropRate: InsertCropRate): Promise<CropRate>;
  updateCropRate(crop: string, cropRate: Partial<InsertCropRate>): Promise<CropRate | undefined>;
  deleteCropRate(crop: string): Promise<void>;
  
  // Invoices
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<void>;
  
  // Payments
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<void>;
  
  // Charges
  getAllCharges(): Promise<Charge[]>;
  getCharge(id: string): Promise<Charge | undefined>;
  createCharge(charge: InsertCharge): Promise<Charge>;
  updateCharge(id: string, charge: Partial<InsertCharge>): Promise<Charge | undefined>;
  deleteCharge(id: string): Promise<void>;
}

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private farmers: Map<string, Farmer> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private stock: Map<string, Stock> = new Map();
  private cropRates: Map<string, CropRate> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, Payment> = new Map();
  private charges: Map<string, Charge> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { id: this.generateId(), ...insertUser };
    this.users.set(user.id, user);
    return user;
  }

  // Farmers
  async getAllFarmers(): Promise<Farmer[]> {
    return Array.from(this.farmers.values());
  }

  async getFarmer(id: string): Promise<Farmer | undefined> {
    return this.farmers.get(id);
  }

  async createFarmer(insertFarmer: InsertFarmer): Promise<Farmer> {
    const farmer: Farmer = { 
      id: this.generateId(), 
      status: "active",
      address: null,
      notes: null,
      ...insertFarmer 
    };
    this.farmers.set(farmer.id, farmer);
    return farmer;
  }

  async updateFarmer(id: string, farmerData: Partial<InsertFarmer>): Promise<Farmer | undefined> {
    const farmer = this.farmers.get(id);
    if (!farmer) return undefined;
    const updated = { ...farmer, ...farmerData };
    this.farmers.set(id, updated);
    return updated;
  }

  async deleteFarmer(id: string): Promise<void> {
    this.farmers.delete(id);
  }

  // Purchases
  async getAllPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const purchase: Purchase = { 
      id: this.generateId(), 
      date: new Date(),
      paymentStatus: "pending",
      bagWeight: null,
      notes: null,
      ...insertPurchase 
    };
    this.purchases.set(purchase.id, purchase);
    return purchase;
  }

  async updatePurchase(id: string, purchaseData: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const purchase = this.purchases.get(id);
    if (!purchase) return undefined;
    const updated = { ...purchase, ...purchaseData };
    this.purchases.set(id, updated);
    return updated;
  }

  async deletePurchase(id: string): Promise<void> {
    this.purchases.delete(id);
  }

  // Stock
  async getAllStock(): Promise<Stock[]> {
    return Array.from(this.stock.values()).sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  async getStockItem(id: string): Promise<Stock | undefined> {
    return this.stock.get(id);
  }

  async getStockByCrop(crop: string): Promise<Stock[]> {
    return Array.from(this.stock.values()).filter(s => s.crop === crop);
  }

  async createStockItem(insertStock: InsertStock): Promise<Stock> {
    const stockItem: Stock = { 
      id: this.generateId(), 
      lastUpdated: new Date(),
      ...insertStock 
    };
    this.stock.set(stockItem.id, stockItem);
    return stockItem;
  }

  async updateStockItem(id: string, stockData: Partial<InsertStock>): Promise<Stock | undefined> {
    const stockItem = this.stock.get(id);
    if (!stockItem) return undefined;
    const updated = { ...stockItem, ...stockData, lastUpdated: new Date() };
    this.stock.set(id, updated);
    return updated;
  }

  async deleteStockItem(id: string): Promise<void> {
    this.stock.delete(id);
  }

  // Crop Rates
  async getAllCropRates(): Promise<CropRate[]> {
    return Array.from(this.cropRates.values());
  }

  async getCropRate(crop: string): Promise<CropRate | undefined> {
    return this.cropRates.get(crop);
  }

  async createCropRate(insertCropRate: InsertCropRate): Promise<CropRate> {
    const cropRate: CropRate = { 
      id: this.generateId(), 
      ...insertCropRate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.cropRates.set(cropRate.crop, cropRate);
    return cropRate;
  }

  async updateCropRate(crop: string, cropRateData: Partial<InsertCropRate>): Promise<CropRate | undefined> {
    const cropRate = this.cropRates.get(crop);
    if (!cropRate) return undefined;
    const updated = { ...cropRate, ...cropRateData, updatedAt: new Date() };
    this.cropRates.set(crop, updated);
    return updated;
  }

  async deleteCropRate(crop: string): Promise<void> {
    this.cropRates.delete(crop);
  }

  // Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoice: Invoice = { 
      id: this.generateId(), 
      date: new Date(),
      status: "unpaid",
      ...insertInvoice 
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    const updated = { ...invoice, ...invoiceData };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    this.invoices.delete(id);
  }

  // Payments
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const payment: Payment = { 
      id: this.generateId(), 
      date: new Date(),
      status: "completed",
      notes: null,
      invoiceId: null,
      ...insertPayment 
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async updatePayment(id: string, paymentData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    const updated = { ...payment, ...paymentData };
    this.payments.set(id, updated);
    return updated;
  }

  async deletePayment(id: string): Promise<void> {
    this.payments.delete(id);
  }

  // Charges
  async getAllCharges(): Promise<Charge[]> {
    return Array.from(this.charges.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getCharge(id: string): Promise<Charge | undefined> {
    return this.charges.get(id);
  }

  async createCharge(insertCharge: InsertCharge): Promise<Charge> {
    const charge: Charge = { 
      id: this.generateId(), 
      date: new Date(),
      notes: null,
      appliedTo: null,
      ...insertCharge 
    };
    this.charges.set(charge.id, charge);
    return charge;
  }

  async updateCharge(id: string, chargeData: Partial<InsertCharge>): Promise<Charge | undefined> {
    const charge = this.charges.get(id);
    if (!charge) return undefined;
    const updated = { ...charge, ...chargeData };
    this.charges.set(id, updated);
    return updated;
  }

  async deleteCharge(id: string): Promise<void> {
    this.charges.delete(id);
  }
}

export class DBStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Farmers
  async getAllFarmers(): Promise<Farmer[]> {
    return await this.db.select().from(farmers);
  }

  async getFarmer(id: string): Promise<Farmer | undefined> {
    const result = await this.db.select().from(farmers).where(eq(farmers.id, id));
    return result[0];
  }

  async createFarmer(farmer: InsertFarmer): Promise<Farmer> {
    const result = await this.db.insert(farmers).values(farmer).returning();
    return result[0];
  }

  async updateFarmer(id: string, farmer: Partial<InsertFarmer>): Promise<Farmer | undefined> {
    const result = await this.db.update(farmers).set(farmer).where(eq(farmers.id, id)).returning();
    return result[0];
  }

  async deleteFarmer(id: string): Promise<void> {
    await this.db.delete(farmers).where(eq(farmers.id, id));
  }

  // Purchases
  async getAllPurchases(): Promise<Purchase[]> {
    return await this.db.select().from(purchases).orderBy(desc(purchases.date));
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    const result = await this.db.select().from(purchases).where(eq(purchases.id, id));
    return result[0];
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const result = await this.db.insert(purchases).values(purchase).returning();
    return result[0];
  }

  async updatePurchase(id: string, purchase: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const result = await this.db.update(purchases).set(purchase).where(eq(purchases.id, id)).returning();
    return result[0];
  }

  async deletePurchase(id: string): Promise<void> {
    await this.db.delete(purchases).where(eq(purchases.id, id));
  }

  // Stock
  async getAllStock(): Promise<Stock[]> {
    return await this.db.select().from(stock).orderBy(desc(stock.lastUpdated));
  }

  async getStockItem(id: string): Promise<Stock | undefined> {
    const result = await this.db.select().from(stock).where(eq(stock.id, id));
    return result[0];
  }

  async getStockByCrop(crop: string): Promise<Stock[]> {
    return await this.db.select().from(stock).where(eq(stock.crop, crop));
  }

  async createStockItem(stockItem: InsertStock): Promise<Stock> {
    const result = await this.db.insert(stock).values(stockItem).returning();
    return result[0];
  }

  async updateStockItem(id: string, stockItem: Partial<InsertStock>): Promise<Stock | undefined> {
    const result = await this.db.update(stock).set(stockItem).where(eq(stock.id, id)).returning();
    return result[0];
  }

  async deleteStockItem(id: string): Promise<void> {
    await this.db.delete(stock).where(eq(stock.id, id));
  }

  // Crop Rates
  async getAllCropRates(): Promise<CropRate[]> {
    return await this.db.select().from(cropRates);
  }

  async getCropRate(crop: string): Promise<CropRate | undefined> {
    const result = await this.db.select().from(cropRates).where(eq(cropRates.crop, crop));
    return result[0];
  }

  async createCropRate(cropRate: InsertCropRate): Promise<CropRate> {
    const result = await this.db.insert(cropRates).values(cropRate).returning();
    return result[0];
  }

  async updateCropRate(crop: string, cropRateData: Partial<InsertCropRate>): Promise<CropRate | undefined> {
    const result = await this.db.update(cropRates).set(cropRateData).where(eq(cropRates.crop, crop)).returning();
    return result[0];
  }

  async deleteCropRate(crop: string): Promise<void> {
    await this.db.delete(cropRates).where(eq(cropRates.crop, crop));
  }

  // Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    return await this.db.select().from(invoices).orderBy(desc(invoices.date));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await this.db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await this.db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.db.delete(invoices).where(eq(invoices.id, id));
  }

  // Payments
  async getAllPayments(): Promise<Payment[]> {
    return await this.db.select().from(payments).orderBy(desc(payments.date));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await this.db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await this.db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    return result[0];
  }

  async deletePayment(id: string): Promise<void> {
    await this.db.delete(payments).where(eq(payments.id, id));
  }

  // Charges
  async getAllCharges(): Promise<Charge[]> {
    return await this.db.select().from(charges).orderBy(desc(charges.date));
  }

  async getCharge(id: string): Promise<Charge | undefined> {
    const result = await this.db.select().from(charges).where(eq(charges.id, id));
    return result[0];
  }

  async createCharge(charge: InsertCharge): Promise<Charge> {
    const result = await this.db.insert(charges).values(charge).returning();
    return result[0];
  }

  async updateCharge(id: string, charge: Partial<InsertCharge>): Promise<Charge | undefined> {
    const result = await this.db.update(charges).set(charge).where(eq(charges.id, id)).returning();
    return result[0];
  }

  async deleteCharge(id: string): Promise<void> {
    await this.db.delete(charges).where(eq(charges.id, id));
  }
}

// Use in-memory storage for development, DB storage when DATABASE_URL is available
export const storage: IStorage = process.env.DATABASE_URL 
  ? new DBStorage()
  : new MemoryStorage();

console.log(`[Storage] Using ${process.env.DATABASE_URL ? 'Database' : 'In-Memory'} storage`);
