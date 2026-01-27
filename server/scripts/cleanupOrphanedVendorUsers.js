/**
 * Script to clean up orphaned users created during failed vendor creation
 * Finds users with VENDOR role but no vendor account linked
 * Run with: node server/scripts/cleanupOrphanedVendorUsers.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import UserModel from '../models/user.model.js';
import VendorModel from '../models/vendor.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function cleanupOrphanedUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find users with VENDOR role
    const vendorUsers = await UserModel.find({ role: 'VENDOR' });
    console.log(`📋 Found ${vendorUsers.length} user(s) with VENDOR role\n`);

    const orphanedUsers = [];
    const usersWithVendors = [];

    for (const user of vendorUsers) {
      // Check if user has vendor linked
      const hasVendorLink = user.vendor || user.vendorId;
      
      if (hasVendorLink) {
        // Verify vendor actually exists
        const vendor = await VendorModel.findById(user.vendor || user.vendorId);
        if (vendor) {
          usersWithVendors.push({
            userId: user._id,
            email: user.email,
            vendorId: vendor._id,
            storeName: vendor.storeName
          });
        } else {
          // Vendor reference exists but vendor not found - orphaned
          orphanedUsers.push({
            userId: user._id,
            email: user.email,
            reason: 'Vendor reference exists but vendor not found',
            vendorId: user.vendor || user.vendorId
          });
        }
      } else {
        // No vendor link - check if vendor exists by ownerUser
        const vendorByOwner = await VendorModel.findOne({ ownerUser: user._id });
        if (!vendorByOwner) {
          // Truly orphaned - user has VENDOR role but no vendor account
          orphanedUsers.push({
            userId: user._id,
            email: user.email,
            reason: 'VENDOR role but no vendor account exists',
            createdAt: user.createdAt
          });
        } else {
          // Vendor exists but not linked to user - fix the link
          console.log(`🔧 Found vendor for user ${user.email} but not linked. Fixing...`);
          user.vendor = vendorByOwner._id;
          user.vendorId = vendorByOwner._id;
          await user.save();
          console.log(`✅ Fixed link for user ${user.email}`);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Users with valid vendors: ${usersWithVendors.length}`);
    console.log(`   ⚠️  Orphaned users found: ${orphanedUsers.length}\n`);

    if (orphanedUsers.length > 0) {
      console.log('⚠️  Orphaned users:');
      orphanedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.userId})`);
        console.log(`      Reason: ${user.reason}`);
        if (user.createdAt) {
          console.log(`      Created: ${user.createdAt}`);
        }
      });

      console.log('\n❓ Do you want to delete these orphaned users?');
      console.log('   This will remove users with VENDOR role but no vendor account.');
      console.log('   Run with --delete flag to automatically delete them.');
      console.log('   Example: node server/scripts/cleanupOrphanedVendorUsers.js --delete\n');

      // Check for --delete flag
      if (process.argv.includes('--delete')) {
        console.log('🗑️  Deleting orphaned users...\n');
        for (const user of orphanedUsers) {
          try {
            await UserModel.findByIdAndDelete(user.userId);
            console.log(`   ✅ Deleted user: ${user.email}`);
          } catch (error) {
            console.error(`   ❌ Failed to delete user ${user.email}:`, error.message);
          }
        }
        console.log(`\n✅ Cleanup complete. Deleted ${orphanedUsers.length} orphaned user(s).`);
      } else {
        console.log('ℹ️  No action taken. Use --delete flag to remove orphaned users.');
      }
    } else {
      console.log('✅ No orphaned users found. All VENDOR users have valid vendor accounts.');
    }

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
cleanupOrphanedUsers();

