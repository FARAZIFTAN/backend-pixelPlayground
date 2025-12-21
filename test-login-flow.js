const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';

async function testLoginFlow() {
  try {
    console.log('\n=== Testing Login Flow ===\n');
    
    // Step 1: Login
    console.log('Step 1: Login with test@example.com...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123',
      }),
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed!');
      return;
    }
    
    const token = loginData.data.token;
    const user = loginData.data.user;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('User:', user.name, '-', user.email, '-', user.role);
    
    // Step 2: Verify token
    console.log('\nStep 2: Verify token...');
    const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Verify Status:', verifyResponse.status);
    console.log('Verify Response:', JSON.stringify(verifyData, null, 2));
    
    if (verifyResponse.ok) {
      console.log('✅ Token verification successful!');
      console.log('User from verify:', verifyData.data.user.name);
    } else {
      console.log('❌ Token verification failed!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLoginFlow();
