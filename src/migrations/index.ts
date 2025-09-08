import * as migration_20250908_053821 from './20250908_053821';

export const migrations = [
  {
    up: migration_20250908_053821.up,
    down: migration_20250908_053821.down,
    name: '20250908_053821'
  },
];
