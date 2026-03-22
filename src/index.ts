import { ingestInput } from '../../alive-body/src/sensors/ingestion';
import { routeSignal } from '../../alive-runtime/src/router/signal-router';

const signal = ingestInput('hello');
const result = routeSignal(signal);

console.log('ALIVE result:', result);
