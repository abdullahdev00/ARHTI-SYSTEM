import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFarmerSchema, insertPurchaseSchema, insertStockSchema, insertCropRateSchema, insertInvoiceSchema, insertPaymentSchema, insertChargeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Farmers
  app.get("/api/farmers", async (req, res) => {
    try {
      const farmers = await storage.getAllFarmers();
      res.json(farmers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch farmers" });
    }
  });

  app.get("/api/farmers/:id", async (req, res) => {
    try {
      const farmer = await storage.getFarmer(req.params.id);
      if (!farmer) {
        return res.status(404).json({ error: "Farmer not found" });
      }
      res.json(farmer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch farmer" });
    }
  });

  app.post("/api/farmers", async (req, res) => {
    try {
      const validatedData = insertFarmerSchema.parse(req.body);
      const farmer = await storage.createFarmer(validatedData);
      res.status(201).json(farmer);
    } catch (error) {
      res.status(400).json({ error: "Invalid farmer data" });
    }
  });

  app.patch("/api/farmers/:id", async (req, res) => {
    try {
      const validatedData = insertFarmerSchema.partial().parse(req.body);
      const farmer = await storage.updateFarmer(req.params.id, validatedData);
      if (!farmer) {
        return res.status(404).json({ error: "Farmer not found" });
      }
      res.json(farmer);
    } catch (error) {
      res.status(400).json({ error: "Failed to update farmer" });
    }
  });

  app.delete("/api/farmers/:id", async (req, res) => {
    try {
      await storage.deleteFarmer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete farmer" });
    }
  });

  // Purchases
  app.get("/api/purchases", async (req, res) => {
    try {
      const purchases = await storage.getAllPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const purchase = await storage.getPurchase(req.params.id);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const validatedData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(validatedData);
      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  app.patch("/api/purchases/:id", async (req, res) => {
    try {
      const validatedData = insertPurchaseSchema.partial().parse(req.body);
      const purchase = await storage.updatePurchase(req.params.id, validatedData);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Failed to update purchase" });
    }
  });

  app.delete("/api/purchases/:id", async (req, res) => {
    try {
      await storage.deletePurchase(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete purchase" });
    }
  });

  // Stock
  app.get("/api/stock", async (req, res) => {
    try {
      const stockItems = await storage.getAllStock();
      res.json(stockItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  app.get("/api/stock/:id", async (req, res) => {
    try {
      const stockItem = await storage.getStockItem(req.params.id);
      if (!stockItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(stockItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock item" });
    }
  });

  app.post("/api/stock", async (req, res) => {
    try {
      const validatedData = insertStockSchema.parse(req.body);
      const stockItem = await storage.createStockItem(validatedData);
      res.status(201).json(stockItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock data" });
    }
  });

  app.patch("/api/stock/:id", async (req, res) => {
    try {
      const validatedData = insertStockSchema.partial().parse(req.body);
      const stockItem = await storage.updateStockItem(req.params.id, validatedData);
      if (!stockItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(stockItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to update stock" });
    }
  });

  app.delete("/api/stock/:id", async (req, res) => {
    try {
      await storage.deleteStockItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  });

  // Crop Rates
  app.get("/api/crop-rates", async (req, res) => {
    try {
      const cropRates = await storage.getAllCropRates();
      res.json(cropRates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crop rates" });
    }
  });

  app.get("/api/crop-rates/:crop", async (req, res) => {
    try {
      const cropRate = await storage.getCropRate(req.params.crop);
      if (!cropRate) {
        return res.status(404).json({ error: "Crop rate not found" });
      }
      res.json(cropRate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crop rate" });
    }
  });

  app.post("/api/crop-rates", async (req, res) => {
    try {
      const validatedData = insertCropRateSchema.parse(req.body);
      const cropRate = await storage.createCropRate(validatedData);
      res.status(201).json(cropRate);
    } catch (error) {
      res.status(400).json({ error: "Invalid crop rate data" });
    }
  });

  app.patch("/api/crop-rates/:crop", async (req, res) => {
    try {
      const validatedData = insertCropRateSchema.partial().parse(req.body);
      const cropRate = await storage.updateCropRate(req.params.crop, validatedData);
      if (!cropRate) {
        return res.status(404).json({ error: "Crop rate not found" });
      }
      res.json(cropRate);
    } catch (error) {
      res.status(400).json({ error: "Failed to update crop rate" });
    }
  });

  app.delete("/api/crop-rates/:crop", async (req, res) => {
    try {
      await storage.deleteCropRate(req.params.crop);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete crop rate" });
    }
  });

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  app.patch("/api/payments/:id", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(req.params.id, validatedData);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      await storage.deletePayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Charges
  app.get("/api/charges", async (req, res) => {
    try {
      const charges = await storage.getAllCharges();
      res.json(charges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch charges" });
    }
  });

  app.get("/api/charges/:id", async (req, res) => {
    try {
      const charge = await storage.getCharge(req.params.id);
      if (!charge) {
        return res.status(404).json({ error: "Charge not found" });
      }
      res.json(charge);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch charge" });
    }
  });

  app.post("/api/charges", async (req, res) => {
    try {
      const validatedData = insertChargeSchema.parse(req.body);
      const charge = await storage.createCharge(validatedData);
      res.status(201).json(charge);
    } catch (error) {
      res.status(400).json({ error: "Invalid charge data" });
    }
  });

  app.patch("/api/charges/:id", async (req, res) => {
    try {
      const validatedData = insertChargeSchema.partial().parse(req.body);
      const charge = await storage.updateCharge(req.params.id, validatedData);
      if (!charge) {
        return res.status(404).json({ error: "Charge not found" });
      }
      res.json(charge);
    } catch (error) {
      res.status(400).json({ error: "Failed to update charge" });
    }
  });

  app.delete("/api/charges/:id", async (req, res) => {
    try {
      await storage.deleteCharge(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete charge" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
