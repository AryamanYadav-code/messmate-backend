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
      channelId: 'orders',
    }], {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    });

    console.log('[Expo API Request Payload]:', JSON.stringify([{ to: pushToken, title, body, data, channelId: 'orders' }], null, 2));
    console.log('[Expo API Response]:', JSON.stringify(response.data, null, 2));

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
    console.log('Error sending push notification:', err.response?.data || err.message);
  }
}

async function broadcastPushNotification(userId, title, body, data = {}) {
  const db = require('../config/db');
  try {
    const result = await db.query(
      'SELECT push_token FROM user_push_tokens WHERE user_id = $1',
      [userId]
    );
    
    const tokens = result.rows.map(r => r.push_token);
    if (tokens.length === 0) return;

    console.log(`Broadcasting to ${tokens.length} tokens for user ${userId}`);
    
    // Expo allows up to 100 notifications in a single request
    const notifications = tokens.map(token => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'orders',
    }));

    const response = await axios.post('https://exp.host/--/api/v2/push/send', notifications, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    });

    console.log('[Expo Broadcast Response]:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.log('Error broadcasting push notification:', err.response?.data || err.message);
  }
}

module.exports = { sendPushNotification, broadcastPushNotification };
