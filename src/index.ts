import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { getWeather } from './tools/weather.js';

const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY']!,
});

async function main() {
  const weatherTool = {
    name: 'get_weather',
    description: 'Get the current weather for a specific city.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description: 'The city to get the weather for.',
        },
      },
      required: ['city'],
    },
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'What is the weather in Mumbai?',
    config: {
      tools: [
        {
          functionDeclarations: [weatherTool],
        },
      ],
    },
  });
  const functionCall = response.functionCalls?.[0];

  console.log(functionCall);
  if (functionCall?.name === 'get_weather') {
    const city = functionCall.args?.city as string;

    const weather = getWeather(city);

    console.log(weather);
  }
}

main();
