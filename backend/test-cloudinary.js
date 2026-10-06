import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING");

async function testUpload() {
  try {
    const result = await cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", {
      folder: "exam-quest/test"
    });
    console.log("SUCCESS!", result.secure_url);
  } catch (err) {
    console.error("UPLOAD FAILED:");
    console.error(err);
  }
}

testUpload();
