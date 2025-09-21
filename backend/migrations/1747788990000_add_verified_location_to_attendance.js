exports.shorthands = {
  text: 'TEXT',
};

exports.up = (pgm) => {
  pgm.addColumns('attendance_records', {
    verified_wifi_ssid: {
      type: 'text',
      notNull: false,
    },
    verified_bluetooth_beacon_id: {
      type: 'text',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('attendance_records', [
    'verified_wifi_ssid',
    'verified_bluetooth_beacon_id',
  ]);
};
