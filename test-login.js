const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _payload: "{\"email\":\"rahmatullahzisan@gmail.com\",\"password\":\"ZxcAsd1212@\"}"
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();