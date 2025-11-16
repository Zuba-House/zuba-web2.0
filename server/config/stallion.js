import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const stallionAPI = axios.create({
  baseURL: process.env.STALLION_API_URL || 'https://api.stallionexpress.ca/v3',
  headers: {
    'Authorization': `Bearer ${process.env.STALLION_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 second timeout
});

// Warehouse configuration
const WAREHOUSE = {
  name: process.env.WAREHOUSE_NAME || "Zuba House Warehouse",
  company: "Zuba House",
  address1: process.env.WAREHOUSE_ADDRESS1 || "119 Chem Rivermead",
  address2: "",
  city: process.env.WAREHOUSE_CITY || "Gatineau",
  province: process.env.WAREHOUSE_PROVINCE || "QC",
  postal_code: process.env.WAREHOUSE_POSTAL || "J9H5W5",
  country: process.env.WAREHOUSE_COUNTRY || "CA",
  phone: process.env.WAREHOUSE_PHONE || "+14375577487"
};

export { stallionAPI, WAREHOUSE };

