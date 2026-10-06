import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CANDIDATES = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-preview",
];

async function check() {
  for (const name of CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent("Say 'OK'");
      console.log(`✅ [AVAILABLE]: ${name} -> ${res.response.text().trim()}`);
    } catch (err) {
      console.log(`❌ [ERROR]: ${name} -> ${err.message.substring(0, 100)}`);
    }
  }
  process.exit(0);
}

check();
