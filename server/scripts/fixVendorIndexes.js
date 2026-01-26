/**
 * Script to fix vendor collection indexes
 * Removes old userId index and ensures ownerUser index is correct
 * Run with: node server/scripts/fixVendorIndexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function fixVendorIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const vendorsCollection = db.collection('vendors');

    // Get all indexes
    console.log('\n📋 Current indexes on vendors collection:');
    const indexes = await vendorsCollection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key, null, 2));
    });

    // Check for old userId index
    const userIdIndex = indexes.find(idx => idx.name === 'userId_1' || (idx.key && idx.key.userId));
    
    if (userIdIndex) {
      console.log('\n🗑️ Found old userId index, removing...');
      try {
        await vendorsCollection.dropIndex(userIdIndex.name);
        console.log(`✅ Successfully dropped index: ${userIdIndex.name}`);
      } catch (error) {
        console.error(`⚠️ Error dropping index ${userIdIndex.name}:`, error.message);
      }
    } else {
      console.log('\n✅ No old userId index found');
    }

    // Check for any vendors with null ownerUser and fix them
    console.log('\n🔍 Checking for vendors with null ownerUser...');
    const vendorsWithNullOwner = await vendorsCollection.find({ ownerUser: null }).toArray();
    
    if (vendorsWithNullOwner.length > 0) {
      console.log(`⚠️ Found ${vendorsWithNullOwner.length} vendor(s) with null ownerUser:`);
      vendorsWithNullOwner.forEach(v => {
        console.log(`   - ${v.storeName || 'N/A'} (ID: ${v._id})`);
      });
      console.log('\n⚠️ These vendors need to be manually fixed or deleted.');
      console.log('   They may cause issues. Consider running deleteAllVendors.js to clean up.');
    } else {
      console.log('✅ No vendors with null ownerUser found');
    }

    // Ensure ownerUser index exists and is correct
    console.log('\n🔧 Ensuring ownerUser index is correct...');
    try {
      // Drop existing ownerUser index if it exists
      const ownerUserIndex = indexes.find(idx => idx.name === 'ownerUser_1' || (idx.key && idx.key.ownerUser));
      if (ownerUserIndex) {
        await vendorsCollection.dropIndex(ownerUserIndex.name);
        console.log('✅ Dropped existing ownerUser index');
      }

      // Create new sparse unique index on ownerUser
      await vendorsCollection.createIndex(
        { ownerUser: 1 },
        { 
          unique: true, 
          sparse: true,
          name: 'ownerUser_1'
        }
      );
      console.log('✅ Created ownerUser_1 index (unique, sparse)');
    } catch (error) {
      console.error('⚠️ Error creating ownerUser index:', error.message);
    }

    // Verify final indexes
    console.log('\n📋 Final indexes on vendors collection:');
    const finalIndexes = await vendorsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key, null, 2));
    });

    console.log('\n✅ Index fix completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixVendorIndexes();

