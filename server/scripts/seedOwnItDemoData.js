import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedOwnItDemoData } from '../services/ownItDemoSeed.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URI || process.env.MONGODB_URL || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MongoDB URI not found');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const result = await seedOwnItDemoData();
  console.log('Result:', result);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
