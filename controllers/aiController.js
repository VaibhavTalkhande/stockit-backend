import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export const getBusinessSuggestions = async (req, res) => {
  try {
    const storeId = req.user.store;
    // Fetch data
    const sales = await Sale.find({store:storeId});
    const products = await Product.find({store:storeId});
    const customers = await Customer.find({store:storeId});
    const salesSummary = sales.map(s => ({
      totalAmount: s.totalAmount,
      date: s.date,
      products: s.products.map(p => ({ name: p.name, quantity: p.quantity, price: p.price }))
    }));
    const productSummary = products.map(p => ({ name: p.name, stock: p.stock, price: p.price }));
    const customerSummary = customers.map(c => ({ name: c.name, email: c.email, purchases: c.purchases.length }));

    const prompt = `
You are a business consultant AI. Given the following store data, provide actionable suggestions for improving sales, business, and growth.

Sales: ${JSON.stringify(salesSummary)}
Products: ${JSON.stringify(productSummary)}
Customers: ${JSON.stringify(customerSummary)}

Return your suggestions as a JSON array. Each suggestion must have:
- "title": a short title for the suggestion,
- "category": one of "sales", "inventory", "customerEngagement", or "general",
- "description": a detailed explanation of the suggestion.

Example:
[
  {
    "title": "Launch Loyalty Program",
    "category": "customerEngagement",
    "description": "Introduce a loyalty program to reward repeat customers and increase retention."
  },
  {
    "title": "Bundle Slow-Moving Products",
    "category": "inventory",
    "description": "Create product bundles with slow-moving inventory to boost sales and clear stock."
  }
]

Now, generate 5-10 actionable suggestions in this format.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType:"application/json",
          systemInstruction: "You are a business analyst and advisor for strategy",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                category: { type: "string", enum: ["sales", "inventory", "customerEngagement", "general"] },
                description: { type: "string" }
              },
              required: ["title", "category", "description"]
            }
          }
        },
      });
      console.log(response.text);
      const suggestions= response.text;
      console.log(JSON.parse(suggestions))
    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ message: 'Error generating suggestions', error: error.message });
  }
};