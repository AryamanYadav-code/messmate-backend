const axios = require('axios');

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken) return;
  
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', {
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
  } catch (err) {
    console.log('Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification }; 
