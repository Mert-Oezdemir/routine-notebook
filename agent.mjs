import { start } from '@mert/project-agent-bridge';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

await start({ project: 'routine-notebook', root: dirname(fileURLToPath(import.meta.url)) });
