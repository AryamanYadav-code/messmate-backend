const axios = require('axios');

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken) return;

  const isExpoToken = /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(pushToken);
  if (!isExpoToken) {
    console.log('Skipping push: invalid Expo token format');
    return;
  }
  
  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', {
      to: pushToken,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    const ticket = response?.data?.data;
    if (ticket?.status === 'error') {
      const detail = ticket?.details?.error || ticket?.message || 'Unknown Expo error';
      console.log(`Push rejected by Expo: ${detail}`);
    }
  } catch (err) {
    const expoError = err?.response?.data?.errors?.[0]?.message;
    console.log('Push notification error:', expoError || err.message);
  }
}

module.exports = { sendPushNotification }; 
