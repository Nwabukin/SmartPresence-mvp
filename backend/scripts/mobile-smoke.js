/*
  Mobile API smoke:
  - Admin login
  - Create student user (with matric)
  - Mobile login via matricNo/password
  - GET /mobile/me, /mobile/me/classes, /mobile/me/sessions, /mobile/me/attendance
  - Cleanup: delete student
*/

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function main() {
  const ts = Date.now();
  let adminToken = null;
  let studentUserId = null;
  const matricNo = `MOB${ts}`;
  const password = 'passw0rd';

  try {
    // Admin login
    console.log('1. Admin login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'changeme',
      }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok)
      throw new Error(`Admin login failed: ${JSON.stringify(loginJson)}`);
    adminToken = loginJson.token || (loginJson.data && loginJson.data.token);
    const authHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };
    console.log('✓ Admin login ok');

    // Create student
    console.log('2. Create student user...');
    const createRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        email: `mobile.${ts}@example.com`,
        password,
        firstName: 'Mobile',
        lastName: 'Student',
        role: 'student',
        profileStudent: {
          matricNo,
          department: 'QA',
          course: 'Testing',
          level: '100',
        },
      }),
    });
    const createJson = await createRes.json();
    if (!createRes.ok)
      throw new Error(`Create student failed: ${JSON.stringify(createJson)}`);
    studentUserId = createJson.user?.user_id || createJson.user_id;
    if (!studentUserId) throw new Error('No user_id for student');
    console.log(
      `✓ Student created (id: ${studentUserId}, matric: ${matricNo})`
    );

    // Mobile login via matric
    console.log('3. Mobile login (matric)...');
    const mLoginRes = await fetch(`${baseUrl}/mobile/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricNo, password }),
    });
    const mLoginJson = await mLoginRes.json();
    if (!mLoginRes.ok)
      throw new Error(`Mobile login failed: ${JSON.stringify(mLoginJson)}`);
    const mToken = mLoginJson.token;
    const mHeaders = { Authorization: `Bearer ${mToken}` };
    console.log('✓ Mobile login ok');

    // /mobile/me
    console.log('4. GET /mobile/me...');
    const meRes = await fetch(`${baseUrl}/mobile/me`, { headers: mHeaders });
    const meJson = await meRes.json();
    if (!meRes.ok)
      throw new Error(`GET /mobile/me failed: ${JSON.stringify(meJson)}`);
    console.log('✓ /mobile/me ok');

    // /mobile/me/classes
    console.log('5. GET /mobile/me/classes...');
    const classesRes = await fetch(`${baseUrl}/mobile/me/classes`, {
      headers: mHeaders,
    });
    const classesJson = await classesRes.json();
    if (!classesRes.ok)
      throw new Error(
        `GET /mobile/me/classes failed: ${JSON.stringify(classesJson)}`
      );
    console.log(
      `✓ /mobile/me/classes ok (count: ${Array.isArray(classesJson) ? classesJson.length : 0})`
    );

    // /mobile/me/sessions
    console.log('6. GET /mobile/me/sessions...');
    const sessionsRes = await fetch(`${baseUrl}/mobile/me/sessions`, {
      headers: mHeaders,
    });
    const sessionsJson = await sessionsRes.json();
    if (!sessionsRes.ok)
      throw new Error(
        `GET /mobile/me/sessions failed: ${JSON.stringify(sessionsJson)}`
      );
    console.log(
      `✓ /mobile/me/sessions ok (count: ${Array.isArray(sessionsJson) ? sessionsJson.length : 0})`
    );

    // /mobile/me/attendance
    console.log('7. GET /mobile/me/attendance...');
    const attRes = await fetch(`${baseUrl}/mobile/me/attendance`, {
      headers: mHeaders,
    });
    const attJson = await attRes.json();
    if (!attRes.ok)
      throw new Error(
        `GET /mobile/me/attendance failed: ${JSON.stringify(attJson)}`
      );
    console.log(
      `✓ /mobile/me/attendance ok (count: ${Array.isArray(attJson) ? attJson.length : 0})`
    );

    // Test notifications endpoints
    console.log('8. GET /mobile/me/notifications...');
    const notificationsRes = await fetch(`${baseUrl}/mobile/me/notifications`, {
      headers: mHeaders,
    });
    const notificationsJson = await notificationsRes.json();
    if (!notificationsRes.ok)
      throw new Error(
        `GET /mobile/me/notifications failed: ${JSON.stringify(notificationsJson)}`
      );
    console.log(
      `✓ /mobile/me/notifications ok (count: ${notificationsJson.notifications?.length || 0})`
    );

    // Test unread count
    console.log('9. GET /mobile/me/notifications/unread-count...');
    const unreadRes = await fetch(
      `${baseUrl}/mobile/me/notifications/unread-count`,
      { headers: mHeaders }
    );
    const unreadJson = await unreadRes.json();
    if (!unreadRes.ok)
      throw new Error(
        `GET /mobile/me/notifications/unread-count failed: ${JSON.stringify(unreadJson)}`
      );
    console.log(
      `✓ /mobile/me/notifications/unread-count ok (unread: ${unreadJson.unread_count})`
    );

    // Test marking notifications as read (if any notifications exist)
    if (
      notificationsJson.notifications &&
      notificationsJson.notifications.length > 0
    ) {
      const firstNotification = notificationsJson.notifications[0];
      console.log('9.5. Test marking notification as read...');
      const markReadRes = await fetch(
        `${baseUrl}/mobile/notifications/${firstNotification.notification_id}/read`,
        {
          method: 'PUT',
          headers: mHeaders,
        }
      );
      const markReadJson = await markReadRes.json();
      if (markReadRes.ok) {
        console.log('✓ Notification marked as read successfully');
      } else {
        console.log(
          `⚠️  Mark notification as read failed: ${JSON.stringify(markReadJson)}`
        );
      }
    }

    // Test attendance marking with device_id (if sessions exist)
    if (Array.isArray(sessionsJson) && sessionsJson.length > 0) {
      const testSession = sessionsJson[0];
      const deviceId = `test-device-${ts}`;

      console.log('10. Test attendance marking with device_id...');
      const markRes = await fetch(`${baseUrl}/mobile/attendance/mark`, {
        method: 'POST',
        headers: { ...mHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: testSession.class_id,
          session_id: testSession.session_id,
          wifi_ssid: 'test-wifi',
          bluetooth_beacon_id: '',
          device_id: deviceId,
        }),
      });
      const markJson = await markRes.json();
      if (!markRes.ok) {
        console.log(
          `⚠️  Attendance mark failed (expected if no valid session): ${JSON.stringify(markJson)}`
        );
      } else {
        console.log('✓ Attendance marked successfully');

        // Test duplicate device_id (should fail)
        console.log('11. Test duplicate device_id (should fail)...');
        const duplicateRes = await fetch(`${baseUrl}/mobile/attendance/mark`, {
          method: 'POST',
          headers: { ...mHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            class_id: testSession.class_id,
            session_id: testSession.session_id,
            wifi_ssid: 'test-wifi',
            bluetooth_beacon_id: '',
            device_id: deviceId, // Same device_id
          }),
        });
        const duplicateJson = await duplicateRes.json();
        if (duplicateRes.status === 409) {
          console.log('✓ Duplicate device_id correctly rejected (409)');
        } else {
          console.log(
            `⚠️  Expected 409 for duplicate device_id, got ${duplicateRes.status}: ${JSON.stringify(duplicateJson)}`
          );
        }

        // Check if attendance confirmation notification was created
        console.log('12. Check for attendance confirmation notification...');
        const notificationsAfterRes = await fetch(
          `${baseUrl}/mobile/me/notifications`,
          { headers: mHeaders }
        );
        const notificationsAfterJson = await notificationsAfterRes.json();
        if (notificationsAfterRes.ok) {
          const attendanceNotifications =
            notificationsAfterJson.notifications?.filter(
              (n) => n.type === 'attendance_confirmed'
            ) || [];
          if (attendanceNotifications.length > 0) {
            console.log(
              `✓ Attendance confirmation notification created (count: ${attendanceNotifications.length})`
            );
          } else {
            console.log('⚠️  No attendance confirmation notification found');
          }
        }
      }
    } else {
      console.log(
        '10. Skipping attendance marking test (no sessions available)'
      );
    }

    console.log('\n🎉 MOBILE SMOKE PASSED');
  } catch (err) {
    console.error('\n❌ MOBILE SMOKE FAILED:', err.message);
    process.exit(1);
  } finally {
    if (studentUserId && adminToken) {
      try {
        await fetch(`${baseUrl}/users/${studentUserId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        console.log('Cleaned up student');
      } catch (_) {}
    }
  }
}

main();
