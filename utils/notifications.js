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
  console.log(`[Broadcast Notif] Starting for user ID: ${userId} ("${title}")`);
  const uid = parseInt(userId);
  
  if (isNaN(uid)) {
    console.log(`[Broadcast Notif] Aborted: Invalid OR missing userId "${userId}"`);
    return;
  }

  try {
    // 1. Fetch from multi-device table (preferred)
    const multiDeviceResult = await db.query(
      'SELECT push_token FROM user_push_tokens WHERE user_id = $1',
      [uid]
    );
    const multiTokens = multiDeviceResult.rows.map(r => r.push_token).filter(t => t);
    
    // 2. Fetch from legacy users table (fallback)
    const userResult = await db.query('SELECT push_token FROM users WHERE user_id = $1', [uid]);
    const legacyToken = userResult.rows[0]?.push_token;

    // 3. Combine and Deduplicate
    const allTokens = [...new Set([...multiTokens, legacyToken].filter(t => {
      if (!t) return false;
      const isExpoToken = /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(t);
      return isExpoToken;
    }))];

    console.log(`[Broadcast Notif] Found ${allTokens.length} unique valid tokens for user ${uid}`);
    
    if (allTokens.length === 0) {
      console.log(`[Broadcast Notif] No valid tokens found for user ${uid}. Aborting.`);
      return null;
    }

    // Expo allows up to 100 notifications in a single request
    const notifications = allTokens.map(token => ({
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

    const receipts = response.data.data;
    receipts.forEach((receipt, index) => {
      const targetToken = allTokens[index];
      if (receipt.status === 'error') {
        console.error(`[Push Error] Token: ${targetToken.substring(0, 30)}... | Error: ${receipt.message}`);
      } else {
        console.log(`[Push Success] Sent to: ${targetToken.substring(0, 30)}...`);
      }
    });

    return receipts;
  } catch (error) {
    console.error('[Broadcast Notif] CRITICAL ERROR:', error.message);
    if (error.details) {
      console.error('[Broadcast Notif] CRITICAL DETAILS:', JSON.stringify(error.details));
    }
    return null;
  }
}

module.exports = { sendPushNotification, broadcastPushNotification };
