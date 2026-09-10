import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY']!,
});

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'Explain what an AI agent is in two simple sentences.',
  });

  console.log(response.text);
}

main();
