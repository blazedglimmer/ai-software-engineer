import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import type { Content } from '@google/genai';
import { toolDeclarations, toolRegistry } from './tools/registry.js';

const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY']!,
});

async function main() {
  const userMessage = 'What is 25 + 48?';

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: userMessage,
    config: {
      tools: [
        {
          functionDeclarations: toolDeclarations,
        },
      ],
    },
  });
  const functionCall = response.functionCalls?.[0];

  const modelContent = response.candidates?.[0]?.content;

  console.log({ functionCall });
  if (!functionCall) {
    console.log('Gemini did not request a tool.');

    console.log(response.text);

    return;
  }

  const functionName = functionCall.name;

  if (!functionName) {
    console.log('Gemini returned a function call without a tool name.');

    return;
  }

  if (!modelContent) {
    console.log('Gemini returned a function call without model content.');

    return;
  }

  const tool = toolRegistry[functionName as keyof typeof toolRegistry];
  if (!tool) {
    console.log(`Unknown tool requested: ${functionName}`);

    return;
  }

  const result = (tool as (args: Record<string, unknown>) => unknown)(
    functionCall.args ?? {}
  );

  console.log({ result, modelContent });

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
            name: functionName,
            response: {
              result,
            },
          },
        },
      ],
    },
  ];

  const finalResponse = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: finalContents,
  });
  console.log('\nFinal Answer:');
  console.log(finalResponse.text);
}

main();
