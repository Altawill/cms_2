// Simple test script to verify backend authentication
const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('Testing backend authentication...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'admin'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.success && loginData.token) {
      // Test protected endpoint
      console.log('\n3. Testing protected endpoint (users)...');
      const usersResponse = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const usersData = await usersResponse.json();
      console.log('Users response:', usersData.length ? `Found ${usersData.length} users` : usersData);
    } else {
      console.log('Login failed, cannot test protected endpoints');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();
