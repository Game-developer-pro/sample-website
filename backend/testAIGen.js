import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function testAI() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  try {
    const res = await model.generateContent("Respond with JSON: {\"status\": \"ok\", \"subject\": \"Economics\"}");
    console.log("AI Test Success:", res.response.text());
  } catch (err) {
    console.error("AI Test Error:", err.message);
  }
}

testAI();
