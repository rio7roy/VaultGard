import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a strict financial data extraction API. Your sole function is to parse raw UPI payment notifications or SMS messages from Indian banks and extract the key transaction details into a precise JSON format.

You must classify the transaction into one of the following exact categories: [Food & Beverage, Transport, Groceries, Utilities, Shopping, Rent, Transfer, Salary, Unknown].

Rules:
1. Output ONLY a valid JSON object. Do not include markdown tags (like \`\`\`json), conversational text, or explanations.
2. Normalize merchant names by removing extra spaces, numbers, or UPI IDs (e.g., "Paid to AMIT KUMAR qibimof@okaxis" becomes "Amit Kumar").
3. Ensure the amount is a float.
4. Determine if money left the account (is_debit: true) or entered the account (is_debit: false).`;

export interface TransactionData {
  amount: number;
  merchant: string;
  category: "Food & Beverage" | "Transport" | "Groceries" | "Utilities" | "Shopping" | "Rent" | "Transfer" | "Salary" | "Unknown";
  is_debit: boolean;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseTransaction(input: string): Promise<TransactionData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      // Few-shot examples
      {
        role: "user",
        parts: [{ text: "Paid ₹15.00 to CHANDRAN TEA STALL via GPay. UPI Ref: 312456789012." }]
      },
      {
        role: "model",
        parts: [{ text: JSON.stringify({
          amount: 15.0,
          merchant: "Chandran Tea Stall",
          category: "Food & Beverage",
          is_debit: true
        }) }]
      },
      {
        role: "user",
        parts: [{ text: "Rs.150.00 debited from a/c **4567 on 26-04-26 to VRL LOGISTICS VRL1234@ybl. UTR: 123456." }]
      },
      {
        role: "model",
        parts: [{ text: JSON.stringify({
          amount: 150.0,
          merchant: "VRL Logistics",
          category: "Transport",
          is_debit: true
        }) }]
      },
      {
        role: "user",
        parts: [{ text: "Received Rs.500.00 from Rahul Sharma (rahul@okicici) in A/C 4567." }]
      },
      {
        role: "model",
        parts: [{ text: JSON.stringify({
          amount: 500.0,
          merchant: "Rahul Sharma",
          category: "Transfer",
          is_debit: false
        }) }]
      },
      // Actual input
      {
        role: "user",
        parts: [{ text: input }]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          merchant: { type: Type.STRING },
          category: { type: Type.STRING },
          is_debit: { type: Type.BOOLEAN }
        },
        required: ["amount", "merchant", "category", "is_debit"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text) as TransactionData;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not extract transaction data. Please check the input and try again.");
  }
}
