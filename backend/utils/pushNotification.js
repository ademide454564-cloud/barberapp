// Push Notification Utility using Expo Push Notifications
// Expo SDK kullanmadan direkt HTTP request ile gönderiyoruz

const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    console.log('Invalid push token:', expoPushToken);
    return { success: false, error: 'Invalid token' };
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification };
