/* eslint-disable @typescript-eslint/naming-convention */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Allow NULL values for bluetooth_beacon_id but keep UNIQUE constraint
  pgm.alterColumn('rooms', 'bluetooth_beacon_id', { notNull: false });
};

exports.down = (pgm) => {
  // Revert to NOT NULL (will fail if NULLs exist)
  pgm.alterColumn('rooms', 'bluetooth_beacon_id', { notNull: true });
};


