import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';

import { toolDeclarations } from '../tools/registry.js';
import { toolRegistry } from '../tools/index.js';
import { ToolExecutor } from '../tools/tool-executor.js';

import type { AgentState } from './state.js';

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
    const state: AgentState = {
      userMessage,

      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],

      iteration: 0,

      toolExecutions: [],

      status: 'running',
    };

    while (state.iteration < this.maxIterations) {
      state.iteration++;

      console.log(`\n--- Agent iteration ${state.iteration} ---`);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: state.contents,
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

      // console.dir(
      //   { 'Function calls': functionCalls },
      //   {
      //     depth: null,
      //   }
      // );
      if (!functionCalls || functionCalls.length === 0) {
        state.status = 'completed';

        state.finalAnswer = response.text || '';

        return state.finalAnswer;
      }

      const modelContent = response.candidates?.[0]?.content;
      if (!modelContent) {
        throw new Error(
          'Gemini returned function calls without model content.'
        );
      }
      state.contents.push(modelContent);

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

        state.toolExecutions.push({
          toolName: functionName,
          args: functionCall.args ?? {},
          result,
        });

        functionResponseParts.push({
          functionResponse: {
            name: functionName,
            response: {
              result,
            },
          },
        });
      }

      state.contents.push({
        role: 'user',
        parts: functionResponseParts,
      });
      // console.log('\nAgent State:', JSON.stringify(state, null, 2));
    }

    state.status = 'failed';

    state.error = `Agent stopped after ${this.maxIterations} iterations.`;

    throw new Error(state.error);
  }
}
