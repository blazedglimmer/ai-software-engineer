import type { Tool } from './types.js';
import { getWeather } from './weather.js';

export const weatherTool: Tool = {
  name: 'get_weather',

  description: 'Get the current weather for a specific city.',

  execute(args) {
    const city = args.city;

    if (typeof city !== 'string') {
      return {
        success: false,
        error: 'city must be a string',
      };
    }

    const result = getWeather(city);

    return {
      success: true,
      data: result,
    };
  },
};
