import * as migration_20250908_055127 from './20250908_055127';
import * as migration_20250909_050442 from './20250909_050442';

export const migrations = [
  {
    up: migration_20250908_055127.up,
    down: migration_20250908_055127.down,
    name: '20250908_055127',
  },
  {
    up: migration_20250909_050442.up,
    down: migration_20250909_050442.down,
    name: '20250909_050442'
  },
];
