export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type Tool = {
  name: string;
  description: string;

  execute: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
};
