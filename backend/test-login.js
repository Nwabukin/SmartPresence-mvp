// Using built-in fetch (Node 18+)

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('Login successful!');
    } else {
      console.log('Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
