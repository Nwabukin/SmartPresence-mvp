import React, { useState, useEffect } from 'react';

const RoomForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  isEditMode = false,
}) => {
  const [name, setName] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [beaconId, setBeaconId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isEditMode && initialData) {
      setName(initialData.name || '');
      setWifiSsid(initialData.wifi_ssid || '');
      setBeaconId(initialData.bluetooth_beacon_id || '');
    }
  }, [isEditMode, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !wifiSsid.trim()) {
      setFormError('Room name and Wi-Fi SSID are required.');
      return;
    }
    setFormError('');
    onSubmit({
      name: name.trim(),
      wifi_ssid: wifiSsid.trim(),
      bluetooth_beacon_id: beaconId.trim() || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
      <div>
        <label
          htmlFor="roomName"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Room Name:
        </label>
        <input
          id="roomName"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          autoFocus
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label
          htmlFor="wifiSsid"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Wi-Fi SSID:
        </label>
        <input
          id="wifiSsid"
          type="text"
          value={wifiSsid}
          onChange={(e) => {
            setWifiSsid(e.target.value);
          }}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div>
        <label
          htmlFor="beaconId"
          style={{ display: 'block', marginBottom: '5px' }}
        >
          Bluetooth Beacon ID (Optional):
        </label>
        <input
          id="beaconId"
          type="text"
          value={beaconId}
          onChange={(e) => {
            setBeaconId(e.target.value);
          }}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      {formError && <p style={{ color: 'red', marginTop: 0 }}>{formError}</p>}
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 15px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          style={{
            padding: '8px 15px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isEditMode ? 'Update Room' : 'Create Room'}
        </button>
      </div>
    </form>
  );
};

export default RoomForm;
