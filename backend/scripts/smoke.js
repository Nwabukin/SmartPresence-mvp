/*
  Simple backend smoke tests:
  - Login to obtain JWT
  - GET /users
  - POST/PUT/DELETE /users (temporary test user)
  - POST/DELETE /rooms (temporary test room)
*/

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function main() {
  const ts = Date.now();

  // Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'changeme' }),
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
  const token = (loginJson.data && loginJson.data.token) || loginJson.token;
  if (!token) throw new Error('No token returned from login');
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // List users
  const usersRes = await fetch(`${baseUrl}/users`, { headers: { Authorization: `Bearer ${token}` } });
  const usersJson = await usersRes.json();
  if (!usersRes.ok) throw new Error(`GET /users failed: ${JSON.stringify(usersJson)}`);
  console.log('users_count', Array.isArray(usersJson) ? usersJson.length : usersJson);

  // Create test user
  const createUserBody = {
    email: `smoke.${ts}@example.com`,
    password: 'passw0rd',
    firstName: 'Smoke',
    lastName: 'User',
    role: 'student',
    profileStudent: { matricNo: `SMK${ts}`, department: 'QA', course: 'Testing', level: '100' },
  };
  const createUserRes = await fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createUserBody),
  });
  const createUserJson = await createUserRes.json();
  if (!createUserRes.ok) throw new Error(`Create user failed: ${JSON.stringify(createUserJson)}`);
  // console.log('Create user response:', JSON.stringify(createUserJson, null, 2));
  const userId = createUserJson.user?.user_id || createUserJson.user_id || (createUserJson.data && createUserJson.data.user_id);
  if (!userId) throw new Error('No user_id from create user');
  console.log('created_user_id', userId);

  // Update user
  const updateUserBody = {
    firstName: 'SmokeUpdated',
    lastName: 'UserUpdated',
    role: 'student', // Required field
    profileStudent: { department: 'QA2', course: 'Integration', level: '200' },
  };
  const updateUserRes = await fetch(`${baseUrl}/users/${userId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(updateUserBody),
  });
  const updateUserJson = await updateUserRes.json();
  if (!updateUserRes.ok) throw new Error(`Update user failed: ${JSON.stringify(updateUserJson)}`);
  console.log('updated_user_ok');

  // Delete user
  const deleteUserRes = await fetch(`${baseUrl}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!deleteUserRes.ok) throw new Error(`Delete user failed: ${deleteUserRes.status}`);
  console.log('deleted_user_ok');

  // Create test room
  const createRoomBody = { name: `Smoke Room ${ts}`, wifi_ssid: `Smoke_${ts}`, bluetooth_beacon_id: `BEACON_${ts}` };
  const createRoomRes = await fetch(`${baseUrl}/rooms`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createRoomBody),
  });
  const createRoomJson = await createRoomRes.json();
  if (!createRoomRes.ok) throw new Error(`Create room failed: ${JSON.stringify(createRoomJson)}`);
  const roomId = createRoomJson.room?.room_id || createRoomJson.room_id || (createRoomJson.data && createRoomJson.data.room_id);
  if (!roomId) throw new Error('No room_id from create room');
  console.log('created_room_id', roomId);

  // Delete room
  const deleteRoomRes = await fetch(`${baseUrl}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!deleteRoomRes.ok) throw new Error(`Delete room failed: ${deleteRoomRes.status}`);
  console.log('deleted_room_ok');

  console.log('SMOKE_TESTS_PASSED');
}

main().catch((err) => {
  console.error('SMOKE_TESTS_FAILED', err.message);
  process.exit(1);
});


