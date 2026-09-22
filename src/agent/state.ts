import type { Content } from '@google/genai';

export type ToolExecution = {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type AgentState = {
  userMessage: string;

  contents: Content[];

  iteration: number;

  toolExecutions: ToolExecution[];

  status: 'running' | 'completed' | 'failed';

  finalAnswer?: string;

  error?: string;
};
