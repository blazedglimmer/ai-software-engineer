import 'dotenv/config';

import { Agent } from './agent/agent.js';

async function main() {
  const agent = new Agent({
    apiKey: process.env['GEMINI_API_KEY']!,
    model: 'gemini-3.8-flash',
    maxIterations: 5,
  });

  const answer = await agent.run(
    'What is the weather in Pune, and then calculate 25 / (-48).'
  );

  console.log('\nFinal Answer:');
  console.log(answer);
}

main();
