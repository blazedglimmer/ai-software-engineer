import 'dotenv/config';

import { Agent } from './agent/agent.js';
import { StateStore } from './persistence/state-store.js';

async function main() {
  const stateStore = new StateStore();

  const agent = new Agent({
    apiKey: process.env['GEMINI_API_KEY']!,
    model: 'gemini-3.6-flash',
    maxIterations: 5,
    stateStore,
  });

  const answer = await agent.run(
    'run_001',
    'What is the weather in Pune, and then calculate 25 / (-48).'
  );
  console.log(stateStore.load('run_001'));

  console.log('\nFinal Answer:');
  console.log(answer);
}

main();
