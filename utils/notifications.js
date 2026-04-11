const axios = require('axios');

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken) return;

  const isExpoToken = /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(pushToken);
  if (!isExpoToken) {
    console.log('Skipping push: invalid Expo token format');
    return;
  }
  
  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', [{
      to: pushToken,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }], {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    });

    console.log('Expo API Response:', JSON.stringify(response.data, null, 2));

    const tickets = response?.data?.data;
    if (Array.isArray(tickets)) {
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          const detail = ticket.details?.error || ticket.message || 'Unknown Expo error';
          console.log(`Push rejected by Expo: ${detail}`);
        }
      }
    } else if (tickets?.status === 'error') {
      const detail = tickets.details?.error || tickets.message || 'Unknown Expo error';
      console.log(`Push rejected by Expo: ${detail}`);
    }
  } catch (err) {
    const expoError = err?.response?.data?.errors?.[0]?.message;
    console.log('Push notification error:', expoError || err.message);
  }
}

module.exports = { sendPushNotification }; 
