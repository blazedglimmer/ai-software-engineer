import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import type { Content } from '@google/genai';
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
  const userMessage = 'What is the weather in Mumbai?';

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userMessage,
    config: {
      tools: [
        {
          functionDeclarations: [weatherTool],
        },
      ],
    },
  });
  const functionCall = response.functionCalls?.[0];
  const modelContent = response.candidates?.[0]?.content;
  let weather!: ReturnType<typeof getWeather>;

  console.log(functionCall);
  if (!functionCall) {
    console.log('Gemini did not request a tool.');

    console.log(response.text);

    return;
  }

  if (!modelContent) {
    console.log('Gemini returned a function call without model content.');

    return;
  }

  if (functionCall.name !== 'get_weather') {
    console.log(`Gemini requested an unknown tool: ${functionCall.name}`);

    return;
  }

  const city = functionCall.args?.city as string;

  weather = getWeather(city);

  console.log(weather);

  const finalContents: Content[] = [
    {
      role: 'user',
      parts: [
        {
          text: userMessage,
        },
      ],
    },

    modelContent,

    {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: functionCall.name,
            response: {
              result: weather,
            },
          },
        },
      ],
    },
  ];

  const finalResponse = await ai.models.generateContent({
    model: 'gemini-3.8-flash',

    contents: finalContents,

    config: {
      tools: [
        {
          functionDeclarations: [weatherTool],
        },
      ],
    },
  });
  console.log('\nFinal Answer:');
  console.log(finalResponse.text);
}

main();
