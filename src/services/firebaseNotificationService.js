// src/services/firebaseNotificationService.js
import { messaging, vapidKey, getToken, onMessage } from '../config/firebase';
import api from './api';

class FirebaseNotificationService {
  
  /**
   * REQUEST PERMISSION VÀ LẤY TOKEN
   */
  async requestPermissionAndGetToken() {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('❌ Browser does not support notifications');
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('❌ Notification permission denied');
        return null;
      }

      console.log('✅ Notification permission granted');

      // Get FCM token
      if (messaging) {
        const token = await getToken(messaging, { vapidKey });
        console.log('📱 FCM Token:', token);
        localStorage.setItem('fcm_token', token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * SETUP FOREGROUND MESSAGE LISTENER
   */
  setupMessageListener(onMessageReceived) {
    if (!messaging) {
      console.warn('⚠️  Firebase messaging not available');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message received:', payload);
      
      const { notification, data } = payload;

      // Show browser notification
      this.showBrowserNotification(
        notification?.title || 'TN AUTO Admin',
        notification?.body || '',
        data
      );

      // Callback to update UI
      if (onMessageReceived) {
        onMessageReceived(payload);
      }
    });
  }

  /**
   * HIỂN THỊ BROWSER NOTIFICATION
   */
  showBrowserNotification(title, body, data = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Play notification sound
      this.playNotificationSound();

      const notification = new Notification(title, {
        body: body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: data.notificationId || Date.now().toString(),
        data: data,
        requireInteraction: false, // Auto close after some time
        silent: false, // Play sound
        vibrate: [200, 100, 200], // Vibration pattern for mobile
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle navigation based on data
        if (data.screen) {
          window.location.href = `/${data.screen}`;
        }
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  /**
   * PHÁT ÂM THANH THÔNG BÁO
   */
  playNotificationSound() {
    try {
      // Try to use system notification sound first
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5; // 50% volume
      
      // Play with error handling
      audio.play().catch(err => {
        console.log('Could not play notification sound:', err);
        // Fallback to beep sound
        this.playBeepSound();
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * PHÁT ÂM THANH BEEP (FALLBACK)
   */
  playBeepSound() {
    try {
      // Create AudioContext for beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine'; // Type of wave

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing beep sound:', error);
    }
  }

  /**
   * ĐĂNG KÝ TOKEN VỚI BACKEND
   */
  async registerTokenWithBackend(token) {
    try {
      const response = await api.post('/fcm-tokens/register', {
        token: token,
        user_type: 'admin', // Admin web
        device_info: this.getDeviceInfo(),
      });

      console.log('✅ Token registered with backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error registering token:', error);
      return null;
    }
  }

  /**
   * XÓA TOKEN (LOGOUT)
   */
  async deleteToken() {
    try {
      const token = localStorage.getItem('fcm_token');
      
      if (token) {
        // Delete from backend
        await api.delete('/fcm-tokens', {
          data: { token }
        });

        // Delete from localStorage
        localStorage.removeItem('fcm_token');
        
        console.log('✅ Token deleted');
      }
    } catch (error) {
      console.error('❌ Error deleting token:', error);
    }
  }

  /**
   * LẤY THÔNG TIN THIẾT BỊ
   */
  getDeviceInfo() {
    return JSON.stringify({
      platform: 'web',
      browser: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    });
  }

  /**
   * CHECK PERMISSION STATUS
   */
  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  }
}

export default new FirebaseNotificationService();

