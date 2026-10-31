/**
 * Model Adapter - Dual Mode Mongoose / In-Memory Store
 * Allows standard Mongoose-style operations:
 * - find(query)
 * - findOne(query)
 * - findById(id)
 * - create(doc)
 * - findByIdAndUpdate(id, update, opts)
 * - findByIdAndDelete(id)
 * - countDocuments(query)
 */

const mongoose = require('mongoose');
const { isInMemory, getStore } = require('../config/db');

function createDualModel(collectionName, schemaDefinition) {
  // Always register Mongoose schema
  let MongoModel;
  try {
    MongoModel = mongoose.model(collectionName);
  } catch (e) {
    const schema = new mongoose.Schema(schemaDefinition, { timestamps: true });
    MongoModel = mongoose.model(collectionName, schema);
  }

  const dualModel = {
    mongooseModel: MongoModel,

    async find(filter = {}) {
      if (!isInMemory()) {
        return await MongoModel.find(filter).lean();
      }
      const store = getStore()[collectionName] || [];
      return store.filter(item => matchFilter(item, filter)).map(item => ({ ...item }));
    },

    async findOne(filter = {}) {
      if (!isInMemory()) {
        return await MongoModel.findOne(filter).lean();
      }
      const store = getStore()[collectionName] || [];
      const found = store.find(item => matchFilter(item, filter));
      return found ? { ...found } : null;
    },

    async findById(id) {
      if (!isInMemory()) {
        return await MongoModel.findById(id).lean();
      }
      const store = getStore()[collectionName] || [];
      const found = store.find(item => String(item._id) === String(id));
      return found ? { ...found } : null;
    },

    async create(doc) {
      if (!isInMemory()) {
        return await MongoModel.create(doc);
      }
      const store = getStore()[collectionName] || [];
      const newDoc = {
        _id: 'doc_' + Math.random().toString(36).substr(2, 9),
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.push(newDoc);
      return { ...newDoc };
    },

    async insertMany(docs) {
      if (!isInMemory()) {
        return await MongoModel.insertMany(docs);
      }
      const created = [];
      for (const d of docs) {
        created.push(await this.create(d));
      }
      return created;
    },

    async findByIdAndUpdate(id, update, options = { new: true }) {
      if (!isInMemory()) {
        return await MongoModel.findByIdAndUpdate(id, update, options).lean();
      }
      const store = getStore()[collectionName] || [];
      const index = store.findIndex(item => String(item._id) === String(id));
      if (index === -1) return null;

      const updated = {
        ...store[index],
        ...(update.$set || update),
        updatedAt: new Date().toISOString()
      };
      store[index] = updated;
      return { ...updated };
    },

    async findByIdAndDelete(id) {
      if (!isInMemory()) {
        return await MongoModel.findByIdAndDelete(id).lean();
      }
      const store = getStore()[collectionName] || [];
      const index = store.findIndex(item => String(item._id) === String(id));
      if (index === -1) return null;
      const removed = store.splice(index, 1)[0];
      return { ...removed };
    },

    async countDocuments(filter = {}) {
      if (!isInMemory()) {
        return await MongoModel.countDocuments(filter);
      }
      const store = getStore()[collectionName] || [];
      return store.filter(item => matchFilter(item, filter)).length;
    },

    async deleteMany(filter = {}) {
      if (!isInMemory()) {
        return await MongoModel.deleteMany(filter);
      }
      const store = getStore()[collectionName] || [];
      getStore()[collectionName] = store.filter(item => !matchFilter(item, filter));
      return { acknowledged: true };
    }
  };

  return dualModel;
}

function matchFilter(item, filter) {
  for (const key of Object.keys(filter)) {
    if (key === '_id') {
      if (String(item._id) !== String(filter._id)) return false;
    } else if (filter[key] && typeof filter[key] === 'object' && filter[key].$in) {
      if (!filter[key].$in.includes(item[key])) return false;
    } else if (item[key] !== filter[key]) {
      return false;
    }
  }
  return true;
}

module.exports = createDualModel;
