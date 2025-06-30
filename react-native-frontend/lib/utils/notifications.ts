import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationManager {
  private notificationToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('calls', {
          name: 'Call Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00ff87',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Message Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00ff87',
        });
      }

      // Get notification token
      this.notificationToken = await this.getNotificationToken();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  private async getNotificationToken(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Failed to get notification token:', error);
      return null;
    }
  }

  async showIncomingCall(callData: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Incoming Call',
          body: `${callData.contact?.name || callData.from} is calling...`,
          sound: 'ringtone.mp3',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'call',
          data: {
            type: 'incoming_call',
            callSid: callData.callSid,
            from: callData.from,
            contact: callData.contact,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to show incoming call notification:', error);
    }
  }

  async showMissedCall(callData: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Missed Call',
          body: `Missed call from ${callData.contact?.name || callData.from}`,
          categoryIdentifier: 'missed_call',
          data: {
            type: 'missed_call',
            callSid: callData.callSid,
            from: callData.from,
            contact: callData.contact,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show missed call notification:', error);
    }
  }

  async clearCallNotifications(): Promise<void> {
    try {
      const notifications = await Notifications.getPresentedNotificationsAsync();
      const callNotificationIds = notifications
        .filter(notification => 
          notification.request.content.data?.type === 'incoming_call'
        )
        .map(notification => notification.request.identifier);

      if (callNotificationIds.length > 0) {
        await Notifications.dismissNotificationAsync(callNotificationIds[0]);
      }
    } catch (error) {
      console.error('Failed to clear call notifications:', error);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger,
      });
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  getNotificationToken(): string | null {
    return this.notificationToken;
  }

  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationManager = new NotificationManager();
