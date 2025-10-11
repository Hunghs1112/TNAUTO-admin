# 🔥 FIREBASE PUSH NOTIFICATION SETUP

## 📋 Bước 1: Cài đặt Firebase

```bash
npm install firebase
```

## 🔧 Bước 2: Cấu hình Firebase

### 2.1 Lấy Firebase Config

1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Chọn project TN AUTO (hoặc tạo project mới)
3. Vào **Project Settings** (⚙️ icon) → **General**
4. Scroll xuống phần **Your apps**
5. Click **Add app** → Chọn **Web** (</> icon)
6. Nhập app nickname: **TN AUTO Admin**
7. ✅ Enable Firebase Hosting (optional)
8. Click **Register app**
9. Copy Firebase configuration code

### 2.2 Lấy VAPID Key

1. Vào **Project Settings** → **Cloud Messaging** tab
2. Scroll xuống **Web Push certificates**
3. Click **Generate key pair**
4. Copy key (dạng: `BPxxx...`)

### 2.3 Cập nhật Config

Mở file `src/config/firebase.js` và thay thế:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                           // ← Paste từ Firebase Console
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXX"
};

const vapidKey = "BPxxx...";                    // ← Paste VAPID key
```

**Và** mở file `public/firebase-messaging-sw.js` và thay thế:

```javascript
const firebaseConfig = {
  // ← Copy y hệt config từ src/config/firebase.js
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 📱 Bước 3: Thêm Route cho Push Notifications

Mở `src/App.jsx` và thêm route:

```javascript
import PushNotifications from './pages/PushNotifications';

// Trong Routes:
<Route path="/push-notifications" element={<PushNotifications />} />
```

## 🎯 Bước 4: Thêm vào Sidebar

Mở `src/components/Sidebar.jsx` và thêm menu item:

```javascript
import { Radio } from 'lucide-react';

// Trong menu items:
{
  name: 'Push Notifications',
  path: '/push-notifications',
  icon: Radio
}
```

## ✅ Bước 5: Testing

### 5.1 Chạy Development Server

```bash
npm run dev
```

### 5.2 Test Notification Permission

1. Mở app trong browser
2. Vào trang **Notifications**
3. Click nút **"Bật thông báo"**
4. Cho phép khi browser hỏi
5. Check console log để xem FCM token

### 5.3 Test Gửi Push Notification

1. Vào trang **Push Notifications**
2. Chọn loại push (User/Broadcast/Topic)
3. Nhập thông tin
4. Click **Gửi Push Notification**
5. Kiểm tra notification xuất hiện

## 🌐 Production Deployment

⚠️ **QUAN TRỌNG**: Push Notifications chỉ hoạt động trên:
- ✅ `localhost` (development)
- ✅ HTTPS domains (production)
- ❌ HTTP domains (không hoạt động)

### Deploy Options:

**Option 1: Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

**Option 2: Netlify**
```bash
npm run build
# Drag & drop dist folder to Netlify
```

**Option 3: Vercel**
```bash
npm install -g vercel
npm run build
vercel --prod
```

## 🔔 Backend API Required

Đảm bảo backend có các endpoints:

```
POST /api/fcm-tokens/register
DELETE /api/fcm-tokens

POST /api/push-notifications/send-to-user
POST /api/push-notifications/send-to-all
POST /api/push-notifications/send-to-topic
```

## 📊 Features Đã Implement

### Trang Notifications:
- ✅ Hiển thị danh sách notifications
- ✅ Firebase realtime listener
- ✅ Banner "Bật thông báo push"
- ✅ Auto refresh khi có notification mới
- ✅ Browser notification popup
- ✅ Đánh dấu đã đọc
- ✅ Xóa notification
- ✅ Gửi custom notification

### Trang Push Notifications:
- ✅ Gửi push cho 1 user
- ✅ Gửi broadcast cho tất cả
- ✅ Gửi theo topic
- ✅ Support image URL
- ✅ Support custom data (JSON)

## 🐛 Troubleshooting

### Lỗi: "Firebase messaging not available"
- Kiểm tra browser support (Chrome, Firefox, Edge)
- Kiểm tra HTTPS hoặc localhost
- Check console log

### Lỗi: "Permission denied"
- Reset notification permission trong browser settings
- Clear cache và cookies
- Thử browser khác

### Không nhận được notification
- Check FCM token đã register với backend chưa
- Check backend có gửi đúng format không
- Check service worker đã register chưa:
  ```javascript
  navigator.serviceWorker.getRegistrations().then(console.log)
  ```

### Service Worker không load
- Check file path: `/firebase-messaging-sw.js`
- Check CORS settings
- Hard refresh: Ctrl+Shift+R

## 📚 Tài liệu tham khảo

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**© 2025 TN AUTO Admin - Firebase Setup Guide**

