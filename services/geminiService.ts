import { GoogleGenAI } from "@google/genai";
import { CategoryData } from '../types';

// Initialize with environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeDashboardData = async (category: CategoryData) => {
  // Use Flash Lite for low-latency responses (feature flag: fast AI)
  const modelId = 'gemini-2.5-flash-lite-latest'; 

  const prompt = `
    You are an expert business analyst. Analyze the following dashboard data for the category: ${category.name}.
    
    Metrics:
    ${category.metrics.map(m => `- ${m.name}: ${m.description}`).join('\n')}
    
    Data Summary:
    ${JSON.stringify(category.data, null, 2)}
    
    Provide 3 bullet points of key insights. Keep it concise and actionable. 
    Focus on anomalies, trends, or opportunities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Unable to generate insights at this time. Please check your API key.";
  }
};

export const generateStrategicPlan = async (category: CategoryData) => {
  // Use Pro for complex reasoning (feature flag: think more)
  const modelId = 'gemini-3-pro-preview';

  const prompt = `
    Create a detailed strategic improvement plan based on the following ${category.name} data.
    Identify the weakest metric and propose a 3-step roadmap to improve it.
    
    Data:
    ${JSON.stringify(category.data)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Modest budget for demo purposes, max is 32k
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Strategy Failed:", error);
    return "Unable to generate strategy.";
  }
};
