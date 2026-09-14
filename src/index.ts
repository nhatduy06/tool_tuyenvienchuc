import { collect } from './collector.js';

collect(process.argv.includes('--dry-run')).catch((error: unknown) => {
  console.error('Collector thất bại:', error);
  process.exitCode = 1;
});
