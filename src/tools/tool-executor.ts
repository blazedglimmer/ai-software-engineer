import type { ToolResult } from './types.js';
import { ToolRegistry } from './tool-registry.js';

export class ToolExecutor {
  constructor(private readonly registry: ToolRegistry) {}

  async execute(
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolResult> {
    const tool = this.registry.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
    }

    try {
      return await tool.execute(args);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown tool error',
      };
    }
  }
}
