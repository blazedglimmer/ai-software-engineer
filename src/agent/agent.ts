import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';

import { toolDeclarations } from '../tools/registry.js';
import { toolRegistry } from '../tools/index.js';
import { ToolExecutor } from '../tools/tool-executor.js';

export class Agent {
  private readonly ai: GoogleGenAI;

  private readonly model: string;

  private readonly maxIterations: number;

  private readonly toolExecutor: ToolExecutor;

  constructor({
    apiKey,
    model,
    maxIterations = 5,
  }: {
    apiKey: string;
    model: string;
    maxIterations?: number;
  }) {
    this.ai = new GoogleGenAI({
      apiKey,
    });

    this.model = model;

    this.maxIterations = maxIterations;

    this.toolExecutor = new ToolExecutor(toolRegistry);
  }

  async run(userMessage: string): Promise<string | undefined> {
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

    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      console.log(`\n--- Agent iteration ${iteration} ---`);
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          tools: [
            {
              functionDeclarations: toolDeclarations,
            },
          ],
        },
      });
      // console.dir(response, {
      //   depth: null,
      // });

      const { functionCalls } = response;
      // console.log({ 'function call': functionCalls });
      console.dir(
        { 'Function calls': functionCalls },
        {
          depth: null,
        }
      );
      if (!functionCalls || functionCalls.length === 0) {
        return response.text || '';
      }

      const modelContent = response.candidates?.[0]?.content;
      if (!modelContent) {
        throw new Error(
          'Gemini returned function calls without model content.'
        );
      }
      contents.push(modelContent);

      const functionResponseParts = [];

      for (const functionCall of functionCalls) {
        const functionName = functionCall.name;
        if (!functionName) {
          console.log('Function call without a name.');
          continue;
        }

        const result = await this.toolExecutor.execute(
          functionName,
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

    throw new Error(`Agent stopped after ${this.maxIterations} iterations.`);
  }
}
