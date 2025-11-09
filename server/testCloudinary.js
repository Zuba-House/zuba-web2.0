import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

cloudinary.api.ping((err, res) => {
  if (err) {
    console.error("❌ Cloudinary Ping Error:", err.message || err);
  } else {
    console.log("✅ Cloudinary Connection OK:", res);
  }
});
