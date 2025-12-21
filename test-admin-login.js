const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3001/api';

async function testAdminLogin() {
  try {
    console.log('\n=== Testing Admin Login ===\n');
    
    // Step 1: Login as admin
    console.log('Step 1: Login with karyaklik@gmail.com...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'karyaklik@gmail.com',
        password: 'admin123',
      }),
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed!');
      console.log('Response:', JSON.stringify(loginData, null, 2));
      return;
    }
    
    const token = loginData.data.token;
    const user = loginData.data.user;
    console.log('✅ Login successful!');
    console.log('User:', user.name, '-', user.email, '-', user.role);
    
    // Step 2: Decode token to check payload
    console.log('\nStep 2: Decode token...');
    const decoded = jwt.decode(token);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));
    
    // Step 3: Test admin API
    console.log('\nStep 3: Test admin frame-submissions API...');
    const adminResponse = await fetch(`${API_URL}/admin/frame-submissions?status=pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const adminData = await adminResponse.json();
    console.log('Admin API Status:', adminResponse.status);
    console.log('Admin API Response:', JSON.stringify(adminData, null, 2));
    
    if (adminResponse.ok) {
      console.log('✅ Admin API access successful!');
    } else {
      console.log('❌ Admin API access failed!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminLogin();
