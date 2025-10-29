import { 
  type Farmer, type InsertFarmer,
  type Purchase, type InsertPurchase,
  type Stock, type InsertStock,
  type CropRate, type InsertCropRate,
  type Invoice, type InsertInvoice,
  type Payment, type InsertPayment,
  type Charge, type InsertCharge
} from "@shared/schema";

const API_BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// Farmers
export const farmersAPI = {
  getAll: () => fetchJSON<Farmer[]>("/farmers"),
  getOne: (id: string) => fetchJSON<Farmer>(`/farmers/${id}`),
  create: (data: InsertFarmer) => fetchJSON<Farmer>("/farmers", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<InsertFarmer>) => fetchJSON<Farmer>(`/farmers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchJSON<void>(`/farmers/${id}`, { method: "DELETE" }),
};

// Purchases
export const purchasesAPI = {
  getAll: () => fetchJSON<Purchase[]>("/purchases"),
  getOne: (id: string) => fetchJSON<Purchase>(`/purchases/${id}`),
  create: (data: InsertPurchase) => fetchJSON<Purchase>("/purchases", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<InsertPurchase>) => fetchJSON<Purchase>(`/purchases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchJSON<void>(`/purchases/${id}`, { method: "DELETE" }),
};

// Stock
export const stockAPI = {
  getAll: () => fetchJSON<Stock[]>("/stock"),
  getOne: (id: string) => fetchJSON<Stock>(`/stock/${id}`),
  create: (data: InsertStock) => fetchJSON<Stock>("/stock", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<InsertStock>) => fetchJSON<Stock>(`/stock/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchJSON<void>(`/stock/${id}`, { method: "DELETE" }),
};

// Crop Rates
export const cropRatesAPI = {
  getAll: () => fetchJSON<CropRate[]>("/crop-rates"),
  getOne: (crop: string) => fetchJSON<CropRate>(`/crop-rates/${crop}`),
  create: (data: InsertCropRate) => fetchJSON<CropRate>("/crop-rates", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (crop: string, data: Partial<InsertCropRate>) => fetchJSON<CropRate>(`/crop-rates/${crop}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (crop: string) => fetchJSON<void>(`/crop-rates/${crop}`, { method: "DELETE" }),
};

// Invoices
export const invoicesAPI = {
  getAll: () => fetchJSON<Invoice[]>("/invoices"),
  getOne: (id: string) => fetchJSON<Invoice>(`/invoices/${id}`),
  create: (data: InsertInvoice) => fetchJSON<Invoice>("/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<InsertInvoice>) => fetchJSON<Invoice>(`/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchJSON<void>(`/invoices/${id}`, { method: "DELETE" }),
};

// Payments
export const paymentsAPI = {
  getAll: () => fetchJSON<Payment[]>("/payments"),
  getOne: (id: string) => fetchJSON<Payment>(`/payments/${id}`),
  create: (data: InsertPayment) => fetchJSON<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<InsertPayment>) => fetchJSON<Payment>(`/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchJSON<void>(`/payments/${id}`, { method: "DELETE" }),
};

// Charges
export const chargesAPI = {
  getAll: () => fetchJSON<Charge[]>("/charges"),
  getOne: (id: string) => fetchJSON<Charge>(`/charges/${id}`),
  create: (data: InsertCharge) => fetchJSON<Charge>("/charges", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<InsertCharge>) => fetchJSON<Charge>(`/charges/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchJSON<void>(`/charges/${id}`, { method: "DELETE" }),
};
