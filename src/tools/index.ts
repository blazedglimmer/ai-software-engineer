import { ToolRegistry } from './tool-registry.js';
import { weatherTool } from './weather-tool.js';
import { calculatorTool } from './calculator-tool.js';

export const toolRegistry = new ToolRegistry();

toolRegistry.register(weatherTool);
toolRegistry.register(calculatorTool);
