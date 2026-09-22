import type { Tool } from './types.js';
import { calculate } from './calculator.js';

export const calculatorTool: Tool = {
  name: 'calculate',

  description: 'Perform a mathematical calculation.',

  execute(args) {
    const expression = args.expression;

    if (typeof expression !== 'string') {
      return {
        success: false,
        error: 'expression must be a string',
      };
    }

    const result = calculate(expression);

    return {
      success: true,
      data: result,
    };
  },
};
