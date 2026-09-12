import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';
import { toolDeclarations, toolRegistry } from './tools/registry.js';

const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY']!,
});

async function main() {
  const userMessage = 'What is 25 × 48?';
  const contents: Content[] = [
    {
      role: 'user',
      parts: [
        {
          text: userMessage,
        },
      ],
    },
  ];

  while (true) {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        tools: [
          {
            functionDeclarations: toolDeclarations,
          },
        ],
      },
    });

    const { functionCalls } = response;
    console.log({ functionCalls });
    if (!functionCalls || functionCalls.length === 0) {
      console.log('\nFinal Answer:', response);
      console.log(response.text);
      return;
    }

    const modelContent = response.candidates?.[0]?.content;
    if (!modelContent) {
      throw new Error('Gemini returned function calls without model content.');
    }
    contents.push(modelContent);

    const functionResponseParts = [];

    for (const functionCall of functionCalls) {
      const functionName = functionCall.name;
      if (!functionName) {
        console.log('Function call without a name.');
        continue;
      }

      const tool = toolRegistry[functionName as keyof typeof toolRegistry];

      if (!tool) {
        console.log(`Unknown tool requested: ${functionName}`);
        continue;
      }
      console.log(`\nCalling tool: ${functionName}`);
      console.log('Arguments:', functionCall.args);

      const result = (tool as (args: Record<string, unknown>) => unknown)(
        functionCall.args ?? {}
      );

      console.log({ result, modelContent });

      functionResponseParts.push({
        functionResponse: {
          name: functionName,
          response: {
            result,
          },
        },
      });
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts,
    });
  }
}

main();
