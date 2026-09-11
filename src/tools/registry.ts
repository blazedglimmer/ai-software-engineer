import { Type } from '@google/genai';
import { getWeather } from './weather.js';
import { calculate } from './calculator.js';
export const toolDeclarations = [
  {
    name: 'get_weather',

    description: 'Get the current weather for a specific city.',

    parameters: {
      type: Type.OBJECT,

      properties: {
        city: {
          type: Type.STRING,
          description: 'The city to get the weather for.',
        },
      },

      required: ['city'],
    },
  },

  {
    name: 'calculate',

    description:
      'Perform a mathematical calculation from a mathematical expression.',

    parameters: {
      type: Type.OBJECT,

      properties: {
        expression: {
          type: Type.STRING,

          description: 'A mathematical expression such as 25 * 48 or 100 / 4.',
        },
      },

      required: ['expression'],
    },
  },
];

export const toolRegistry = {
  get_weather: (args: { city: string }) => {
    return getWeather(args.city);
  },

  calculate: (args: { expression: string }) => {
    return calculate(args.expression);
  },
};
