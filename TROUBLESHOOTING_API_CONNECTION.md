# Troubleshooting - API Connection Issues

## Vấn đề: Không fetch được data từ backend qua IP 103.200.20.253

### Triệu chứng:
- ✅ Localhost (`http://localhost:5000/api`) hoạt động bình thường
- ❌ IP (`http://103.200.20.253:5000/api`) không fetch được data
- Request được gửi đi nhưng không có response hoặc bị lỗi

---

## Nguyên nhân có thể và Cách giải quyết

### 1. CORS (Cross-Origin Resource Sharing) - ⚠️ NGUYÊN NHÂN PHỔ BIẾN NHẤT

**Triệu chứng:**
- Console hiển thị: `CORS policy: No 'Access-Control-Allow-Origin' header`
- Error code: `ERR_NETWORK` hoặc status `0`
- Request bị browser chặn

**Giải pháp:**

#### Backend cần cấu hình CORS:

**Node.js/Express:**
```javascript
const cors = require('cors');

// Cho phép tất cả origins (development)
app.use(cors({
  origin: '*', // Hoặc chỉ định origin cụ thể: 'http://localhost:5173'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Hoặc cấu hình chi tiết hơn
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://103.200.20.253:5173', // IP của frontend nếu có
    // Thêm các origins khác
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
```

**Python/Flask:**
```python
from flask_cors import CORS

# Cho phép tất cả origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Hoặc chỉ định origins cụ thể
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://103.200.20.253:5173"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

**Kiểm tra:**
1. Mở DevTools → Network tab
2. Xem request có bị chặn không
3. Kiểm tra Response Headers có `Access-Control-Allow-Origin` không

---

### 2. Backend chỉ listen trên localhost

**Triệu chứng:**
- Backend chỉ accessible từ localhost
- Không thể kết nối từ IP khác

**Giải pháp:**

**Node.js/Express:**
```javascript
// ❌ SAI - chỉ listen trên localhost
app.listen(5000, 'localhost', () => {
  console.log('Server running on localhost:5000');
});

// ✅ ĐÚNG - listen trên tất cả interfaces
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:5000');
});

// Hoặc đơn giản hơn
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

**Python/Flask:**
```python
# ❌ SAI
app.run(host='127.0.0.1', port=5000)

# ✅ ĐÚNG
app.run(host='0.0.0.0', port=5000)
```

**Kiểm tra:**
```bash
# Kiểm tra backend có listen trên 0.0.0.0 không
netstat -tuln | grep 5000
# Hoặc
ss -tuln | grep 5000

# Kết quả mong đợi:
# tcp  0  0  0.0.0.0:5000  0.0.0.0:*  LISTEN
```

---

### 3. Firewall chặn kết nối

**Triệu chứng:**
- Không thể ping hoặc telnet đến IP:port
- Connection timeout

**Giải pháp:**

**Linux (UFW):**
```bash
# Cho phép port 5000
sudo ufw allow 5000/tcp
sudo ufw reload
```

**Linux (iptables):**
```bash
# Cho phép port 5000
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save
```

**Windows Firewall:**
1. Mở Windows Firewall
2. Inbound Rules → New Rule
3. Port → TCP → 5000
4. Allow connection

**Cloud Provider (AWS, GCP, Azure):**
- Kiểm tra Security Groups / Firewall Rules
- Đảm bảo port 5000 được mở cho IP của frontend

---

### 4. Network connectivity

**Kiểm tra kết nối:**

```bash
# Ping server
ping 103.200.20.253

# Kiểm tra port có mở không
telnet 103.200.20.253 5000
# Hoặc
nc -zv 103.200.20.253 5000

# Kiểm tra từ browser console
fetch('http://103.200.20.253:5000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

### 5. Mixed Content (HTTP/HTTPS)

**Triệu chứng:**
- Frontend chạy trên HTTPS
- Backend chạy trên HTTP
- Browser chặn mixed content

**Giải pháp:**
- Sử dụng HTTPS cho cả frontend và backend
- Hoặc sử dụng HTTP cho cả hai (development only)

---

## Debug Steps

### Bước 1: Kiểm tra Console Logs

Mở DevTools → Console và xem error message:

```javascript
// Error sẽ hiển thị chi tiết:
[API Error] Network Error (CORS hoặc không kết nối được): http://103.200.20.253:5000/api/customers
[API Error] Nguyên nhân có thể:
  1. CORS: Backend chưa cho phép origin này
  2. Backend không chạy hoặc không accessible từ IP này
  3. Firewall chặn kết nối
  4. Backend chỉ listen trên localhost thay vì 0.0.0.0
```

### Bước 2: Kiểm tra Network Tab

1. Mở DevTools → Network
2. Reload page
3. Tìm request đến `103.200.20.253:5000`
4. Xem:
   - **Status**: 200 (OK) hay bị chặn?
   - **Response Headers**: Có `Access-Control-Allow-Origin` không?
   - **Error**: CORS error hay network error?

### Bước 3: Test trực tiếp từ Browser

Mở Console và chạy:

```javascript
// Test kết nối
fetch('http://103.200.20.253:5000/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Kết nối thành công:', response.status);
  return response.json();
})
.then(data => console.log('Data:', data))
.catch(error => {
  console.error('❌ Lỗi:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
});
```

### Bước 4: Kiểm tra Backend Logs

Xem backend có nhận được request không:

```bash
# Nếu backend có logs, kiểm tra:
# - Request có đến server không?
# - CORS headers có được gửi không?
# - Có error gì không?
```

---

## Quick Fix Checklist

- [ ] Backend đã cấu hình CORS cho phép origin của frontend
- [ ] Backend listen trên `0.0.0.0` thay vì `localhost`
- [ ] Firewall đã mở port 5000
- [ ] Có thể ping/telnet đến server:port
- [ ] Test fetch trực tiếp từ browser console
- [ ] Kiểm tra Network tab trong DevTools
- [ ] Xem backend logs có nhận được request không

---

## Test Script

Tạo file `test-api.html` để test:

```html
<!DOCTYPE html>
<html>
<head>
  <title>API Test</title>
</head>
<body>
  <h1>API Connection Test</h1>
  <button onclick="testAPI()">Test API</button>
  <pre id="result"></pre>

  <script>
    async function testAPI() {
      const apiUrl = 'http://103.200.20.253:5000/api/health';
      const resultEl = document.getElementById('result');
      
      resultEl.textContent = 'Testing...';
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        resultEl.textContent = `✅ Success!\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`;
      } catch (error) {
        resultEl.textContent = `❌ Error!\nCode: ${error.code}\nMessage: ${error.message}\n\nNguyên nhân có thể:\n1. CORS chưa được cấu hình\n2. Backend không accessible\n3. Firewall chặn`;
      }
    }
  </script>
</body>
</html>
```

---

## Common Error Messages

### "Network Error" hoặc "ERR_NETWORK"
- **Nguyên nhân**: CORS hoặc không kết nối được
- **Giải pháp**: Cấu hình CORS và kiểm tra network

### "CORS policy: No 'Access-Control-Allow-Origin'"
- **Nguyên nhân**: Backend chưa cho phép origin
- **Giải pháp**: Thêm CORS middleware

### "Connection refused" hoặc "ECONNREFUSED"
- **Nguyên nhân**: Backend không chạy hoặc không listen đúng
- **Giải pháp**: Kiểm tra backend đang chạy và listen trên 0.0.0.0

### "Timeout" hoặc "ECONNABORTED"
- **Nguyên nhân**: Request quá lâu hoặc network chậm
- **Giải pháp**: Tăng timeout hoặc kiểm tra network

---

## Recommended Backend Configuration

### Node.js/Express Example:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://103.200.20.253:5173',
    // Thêm các origins khác nếu cần
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Your routes
app.use('/api', routes);

// Listen on all interfaces
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible from: http://localhost:${PORT}`);
  console.log(`Accessible from: http://103.200.20.253:${PORT}`);
});
```

---

**Sau khi áp dụng các giải pháp trên, reload frontend và kiểm tra lại!**



