/**
 * Database Connection & Dual-Mode Fallback Configuration
 * 
 * Hackathon-Ready Architecture:
 * 1. Attempts connection to MongoDB via Mongoose.
 * 2. If MongoDB is unavailable (offline demo, local machine without daemon),
 *    gracefully activates an in-memory mock document engine with standard Mongoose API.
 *    This ensures 100% demo reliability without system crashes.
 */

const mongoose = require('mongoose');

let isConnected = false;
let isInMemoryFallback = false;

// In-Memory storage collections for fallback mode
const inMemoryStore = {
  users: [],
  products: [],
  plans: [],
  customers: [],
  subscriptions: [],
  invoices: [],
  payments: [],
  discounts: []
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brightloop_subscriptions';

  try {
    // Attempt Mongoose connection with 3-second timeout for rapid fallback
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to: ${uri}`);
  } catch (error) {
    isInMemoryFallback = true;
    console.warn(`[Database] MongoDB not reachable (${error.message}).`);
    console.log(`[Database] Activating In-Memory Hackathon Demo Mode (Zero Dependencies Required).`);
  }
};

module.exports = {
  connectDB,
  isInMemory: () => isInMemoryFallback,
  getStore: () => inMemoryStore
};
