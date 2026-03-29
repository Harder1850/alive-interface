import { ingestInput } from '../../alive-body/src/sensors/ingestion';
import { routeSignal } from '../../alive-runtime/src/router/signal-router';
import { getExperienceStreamPath } from '../../alive-body/src/logging/execution-log';
declare function require(name: string): any;
declare const process: any;

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Input: ', (input: string) => {
  const signal = ingestInput(input);
  const result = routeSignal(signal);

  console.log('ALIVE result:', result);
  console.log('Experience stream file:', getExperienceStreamPath());

  rl.close();
});
