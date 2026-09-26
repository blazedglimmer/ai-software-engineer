import { GoogleGenAI } from '@google/genai';
import { StateStore } from '../persistence/state-store.js';

import { toolDeclarations } from '../tools/registry.js';
import { toolRegistry } from '../tools/index.js';
import { ToolExecutor } from '../tools/tool-executor.js';

export class Agent {
  private readonly ai: GoogleGenAI;

  private readonly model: string;

  private readonly maxIterations: number;

  private readonly stateStore: StateStore;

  private readonly toolExecutor: ToolExecutor;

  constructor({
    apiKey,
    model,
    maxIterations = 5,
    stateStore,
  }: {
    apiKey: string;
    model: string;
    maxIterations?: number;
    stateStore: StateStore;
  }) {
    this.ai = new GoogleGenAI({
      apiKey,
    });

    this.model = model;

    this.maxIterations = maxIterations;

    this.stateStore = stateStore;

    this.toolExecutor = new ToolExecutor(toolRegistry);
  }

  async run(runId: string, userMessage: string): Promise<string | undefined> {
    let state = this.stateStore.load(runId);

    if (!state) {
      state = {
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

      this.stateStore.save(runId, state);
    }
    while (state.iteration < this.maxIterations) {
      state.iteration++;

      this.stateStore.save(runId, state);

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

        this.stateStore.save(runId, state);

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

        this.stateStore.save(runId, state);

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
