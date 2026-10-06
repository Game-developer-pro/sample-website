import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const testModels = [
  "gemini-2.0-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite"
];

async function testStream() {
  for (const modelName of testModels) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream("Explain in 1 sentence why water is wet.");
      for await (const chunk of result.stream) {
        process.stdout.write(chunk.text());
      }
      console.log(`\n✅ Stream test passed for ${modelName}!\n`);
      return;
    } catch (err) {
      console.error(`❌ Model ${modelName} failed:`, err.message);
    }
  }
}

testStream();
