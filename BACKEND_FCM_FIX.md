# 🔧 BACKEND FCM FIX - Stringify Data Values

## ❌ Lỗi hiện tại:

```
messaging/invalid-payload - data must only contain string values
```

## 🎯 Nguyên nhân:

FCM (Firebase Cloud Messaging) yêu cầu **TẤT CẢ** giá trị trong `data` object phải là **STRING**.

### ❌ Sai:
```javascript
{
  notification: {
    title: "Thông báo",
    body: "Nội dung"
  },
  data: {
    type: "order",
    order_id: 123,        // ← NUMBER - Lỗi!
    user_id: 5,           // ← NUMBER - Lỗi!
    is_urgent: true       // ← BOOLEAN - Lỗi!
  }
}
```

### ✅ Đúng:
```javascript
{
  notification: {
    title: "Thông báo",
    body: "Nội dung"
  },
  data: {
    type: "order",
    order_id: "123",      // ← STRING - OK!
    user_id: "5",         // ← STRING - OK!
    is_urgent: "true"     // ← STRING - OK!
  }
}
```

---

## 🔧 FIX BACKEND

### File: `src/services/notificationService.js` (hoặc tương tự)

**Tìm function gửi FCM:**

```javascript
// ❌ TRƯỚC (SAI)
async function sendToUser(userId, userType, notification, data) {
  const tokens = await getTokensForUser(userId, userType);
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
      image: notification.imageUrl
    },
    data: data,  // ← data có thể chứa number/boolean
    tokens: tokens
  };

  return admin.messaging().sendEachForMulticast(message);
}
```

**Sửa thành:**

```javascript
// ✅ SAU (ĐÚNG)
async function sendToUser(userId, userType, notification, data) {
  const tokens = await getTokensForUser(userId, userType);
  
  // Convert all data values to strings
  const stringData = {};
  if (data && typeof data === 'object') {
    Object.keys(data).forEach(key => {
      stringData[key] = String(data[key]);
    });
  }
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
      image: notification.imageUrl
    },
    data: stringData,  // ← All values are strings
    tokens: tokens
  };

  return admin.messaging().sendEachForMulticast(message);
}
```

### Hoặc tạo helper function:

```javascript
// Helper function để stringify data
function stringifyFCMData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const result = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Convert to string based on type
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  });
  
  return result;
}

// Sử dụng:
const message = {
  notification: notification,
  data: stringifyFCMData(data),  // ← Use helper
  tokens: tokens
};
```

---

## 📝 UPDATE TẤT CẢ CÁC FUNCTION GỬI FCM

### 1. Send to User
```javascript
exports.sendToUser = async (req, res) => {
  const { user_id, user_type, notification, data } = req.body;
  
  // Stringify data
  const stringData = stringifyFCMData(data);
  
  const result = await sendFCMToUser(user_id, user_type, notification, stringData);
  
  res.json({ success: true, results: result });
};
```

### 2. Send to All Users
```javascript
exports.sendToAllUsers = async (req, res) => {
  const { user_type, notification, data } = req.body;
  
  // Stringify data
  const stringData = stringifyFCMData(data);
  
  const result = await sendFCMToAll(user_type, notification, stringData);
  
  res.json({ success: true, results: result });
};
```

### 3. Send to Topic
```javascript
exports.sendToTopic = async (req, res) => {
  const { topic, notification, data } = req.body;
  
  // Stringify data
  const stringData = stringifyFCMData(data);
  
  const message = {
    notification: notification,
    data: stringData,
    topic: topic
  };
  
  const result = await admin.messaging().send(message);
  
  res.json({ success: true, messageId: result });
};
```

### 4. Send Custom Notification (nếu có push)
```javascript
exports.sendCustomNotification = async (req, res) => {
  const { recipient_id, recipient_type, message, image_url, send_push } = req.body;
  
  // Save to database
  const notification = await saveNotificationToDB(...);
  
  // Send push if requested
  if (send_push) {
    const stringData = stringifyFCMData({
      type: 'custom_notification',
      notification_id: notification.id
    });
    
    await sendFCMToUser(recipient_id, recipient_type, {
      title: 'Thông báo mới',
      body: message,
      image: image_url
    }, stringData);
  }
  
  res.json({ success: true, notification_id: notification.id });
};
```

---

## 🧪 TEST

### Test với Postman:

```json
POST /api/push-notifications/send-to-user

{
  "user_id": 1,
  "user_type": "customer",
  "notification": {
    "title": "Test",
    "body": "Test message"
  },
  "data": {
    "order_id": 123,
    "amount": 50000,
    "is_paid": true
  }
}
```

**Backend phải convert thành:**
```javascript
{
  data: {
    "order_id": "123",
    "amount": "50000",
    "is_paid": "true"
  }
}
```

---

## 📱 MOBILE APP - Parse String Data

Mobile app nhận được string values, cần parse lại:

### React Native:
```javascript
messaging().onMessage(async remoteMessage => {
  const data = remoteMessage.data;
  
  // Parse back to original types
  const orderId = parseInt(data.order_id);
  const amount = parseFloat(data.amount);
  const isPaid = data.is_paid === 'true';
  
  console.log({ orderId, amount, isPaid });
});
```

### Flutter:
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  Map<String, dynamic> data = message.data;
  
  // Parse back to original types
  int orderId = int.parse(data['order_id']);
  double amount = double.parse(data['amount']);
  bool isPaid = data['is_paid'] == 'true';
  
  print('Order: $orderId, Amount: $amount, Paid: $isPaid');
});
```

---

## ✅ CHECKLIST

Backend cần update:

- [ ] Tạo helper function `stringifyFCMData()`
- [ ] Update `sendToUser()` controller
- [ ] Update `sendToAllUsers()` controller
- [ ] Update `sendToTopic()` controller
- [ ] Update `sendCustomNotification()` controller (nếu có)
- [ ] Test với Postman
- [ ] Test với Mobile App
- [ ] Deploy

---

## 📚 Tài liệu tham khảo

- [FCM Data Messages](https://firebase.google.com/docs/cloud-messaging/concept-options#data_messages)
- [FCM Message Format](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.message)

---

**© 2025 TN AUTO - Backend FCM Fix Guide**

