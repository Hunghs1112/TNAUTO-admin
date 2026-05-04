# ✅ Backend Search - Test Checklist

**Date:** 2026-05-04  
**Tester:** _____________  
**Environment:** □ Development  □ Staging  □ Production

---

## 🎯 MỤC ĐÍCH

Kiểm tra backend search hoạt động đúng trên tất cả các trang.

---

## 📋 TEST CASES

### 1. Customers (Khách Hàng)

**URL:** `/customers`

- [ ] **Test 1.1:** Search theo tên
  - Gõ tên khách hàng (ví dụ: "Nguyễn")
  - ✅ Hiển thị tất cả khách hàng có tên chứa "Nguyễn"
  - ✅ Badge hiển thị tổng số kết quả

- [ ] **Test 1.2:** Search theo SĐT
  - Gõ số điện thoại (ví dụ: "0901")
  - ✅ Hiển thị tất cả khách hàng có SĐT chứa "0901"

- [ ] **Test 1.3:** Search theo email
  - Gõ email (ví dụ: "gmail")
  - ✅ Hiển thị tất cả khách hàng có email chứa "gmail"

- [ ] **Test 1.4:** Search + Pagination
  - Search có > 20 kết quả
  - Click trang 2
  - ✅ Hiển thị items 21-40
  - ✅ Search term vẫn được giữ

- [ ] **Test 1.5:** Clear search
  - Xóa search term
  - ✅ Hiển thị tất cả khách hàng
  - ✅ Pagination reset về trang 1

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 2. Employees (Nhân Viên)

**URL:** `/employees`

- [ ] **Test 2.1:** Search theo tên
- [ ] **Test 2.2:** Search theo SĐT
- [ ] **Test 2.3:** Search + Pagination
- [ ] **Test 2.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 3. Vehicles (Xe)

**URL:** `/vehicles`

- [ ] **Test 3.1:** Search theo biển số
  - Gõ biển số (ví dụ: "29A")
  - ✅ Hiển thị tất cả xe có biển số chứa "29A"

- [ ] **Test 3.2:** Search theo model
  - Gõ model (ví dụ: "Honda")
  - ✅ Hiển thị tất cả xe có model chứa "Honda"

- [ ] **Test 3.3:** Search theo tên chủ xe
  - Gõ tên (ví dụ: "Nguyễn")
  - ✅ Hiển thị tất cả xe của chủ xe có tên chứa "Nguyễn"

- [ ] **Test 3.4:** Search + Pagination
- [ ] **Test 3.5:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 4. Dealers (Đại Lý)

**URL:** `/dealers`

- [ ] **Test 4.1:** Search theo tên
- [ ] **Test 4.2:** Search theo SĐT
- [ ] **Test 4.3:** Search theo email
- [ ] **Test 4.4:** Search + Pagination
- [ ] **Test 4.5:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 5. Garages (Gara)

**URL:** `/garages`

- [ ] **Test 5.1:** Search theo mã gara
  - Gõ mã (ví dụ: "HN")
  - ✅ Hiển thị tất cả gara có mã chứa "HN"

- [ ] **Test 5.2:** Search theo tên gara
- [ ] **Test 5.3:** Search theo địa chỉ
- [ ] **Test 5.4:** Search theo SĐT admin
- [ ] **Test 5.5:** Search + Pagination
- [ ] **Test 5.6:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 6. Garage Managers (Quản Lý Gara)

**URL:** `/garage-managers`

- [ ] **Test 6.1:** Search theo tên quản lý
- [ ] **Test 6.2:** Search theo SĐT quản lý
- [ ] **Test 6.3:** Search theo email quản lý
- [ ] **Test 6.4:** Search theo tên gara
- [ ] **Test 6.5:** Search theo mã gara
- [ ] **Test 6.6:** Search + Pagination
- [ ] **Test 6.7:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 7. Products (Sản Phẩm)

**URL:** `/products`

- [ ] **Test 7.1:** Search theo tên sản phẩm
- [ ] **Test 7.2:** Search theo mô tả
- [ ] **Test 7.3:** Search + Pagination
- [ ] **Test 7.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 8. Services (Dịch Vụ)

**URL:** `/services`

- [ ] **Test 8.1:** Search theo tên dịch vụ
- [ ] **Test 8.2:** Search theo mô tả
- [ ] **Test 8.3:** Search theo tên danh mục
- [ ] **Test 8.4:** Search + Pagination
- [ ] **Test 8.5:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 9. Service Categories (Danh Mục Dịch Vụ)

**URL:** `/service-categories`

- [ ] **Test 9.1:** Search theo tên danh mục
- [ ] **Test 9.2:** Search theo mô tả
- [ ] **Test 9.3:** Search + Pagination
- [ ] **Test 9.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 10. Categories (Danh Mục)

**URL:** `/categories`

- [ ] **Test 10.1:** Search theo tên danh mục
- [ ] **Test 10.2:** Search theo mô tả
- [ ] **Test 10.3:** Search + Pagination
- [ ] **Test 10.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 11. Offers (Ưu Đãi)

**URL:** `/offers`

- [ ] **Test 11.1:** Search theo tiêu đề
- [ ] **Test 11.2:** Search theo mô tả
- [ ] **Test 11.3:** Search + Pagination
- [ ] **Test 11.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 12. Warranties (Bảo Hành)

**URL:** `/warranties`

- [ ] **Test 12.1:** Search theo số bảo hành
- [ ] **Test 12.2:** Search theo tên khách hàng
- [ ] **Test 12.3:** Search + Pagination
- [ ] **Test 12.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

### 13. Dealer Warranties (Bảo Hành Đại Lý)

**URL:** `/dealer-warranties`

- [ ] **Test 13.1:** Search theo số bảo hành
- [ ] **Test 13.2:** Search theo tên khách hàng
- [ ] **Test 13.3:** Search + Pagination
- [ ] **Test 13.4:** Clear search

**Notes:**
```
_________________________________________________
_________________________________________________
```

---

## 🔍 EDGE CASES

### Case Sensitivity

- [ ] **Test E1:** Search "NGUYEN" (uppercase)
- [ ] **Test E2:** Search "nguyen" (lowercase)
- [ ] **Test E3:** Search "NgUyEn" (mixed)
- ✅ Tất cả trả về kết quả giống nhau

**Notes:**
```
_________________________________________________
```

---

### Empty Search

- [ ] **Test E4:** Không gõ gì, chỉ click vào search box
- ✅ Hiển thị tất cả items (không filter)

**Notes:**
```
_________________________________________________
```

---

### No Results

- [ ] **Test E5:** Search "xyz123notfound"
- ✅ Hiển thị empty state: "Không tìm thấy kết quả"
- ✅ Badge hiển thị "0 mục"

**Notes:**
```
_________________________________________________
```

---

### Special Characters

- [ ] **Test E6:** Search với dấu tiếng Việt (ví dụ: "Nguyễn")
- [ ] **Test E7:** Search với số (ví dụ: "123")
- [ ] **Test E8:** Search với ký tự đặc biệt (ví dụ: "@", "#")

**Notes:**
```
_________________________________________________
```

---

### Performance

- [ ] **Test E9:** Search trong database lớn (> 1000 items)
- ✅ Kết quả trả về trong < 2 giây
- ✅ Không có lag khi gõ

**Notes:**
```
_________________________________________________
```

---

## 🐛 BUG REPORT

### Bug 1
- **Page:** _____________
- **Steps to reproduce:**
```
1. _____________
2. _____________
3. _____________
```
- **Expected:** _____________
- **Actual:** _____________
- **Screenshot:** _____________

---

### Bug 2
- **Page:** _____________
- **Steps to reproduce:**
```
1. _____________
2. _____________
3. _____________
```
- **Expected:** _____________
- **Actual:** _____________
- **Screenshot:** _____________

---

## 📊 SUMMARY

### Test Results

- **Total Tests:** 100+
- **Passed:** _____ / _____
- **Failed:** _____ / _____
- **Skipped:** _____ / _____

### Overall Status

- [ ] ✅ All tests passed
- [ ] ⚠️ Some tests failed (see bug reports)
- [ ] ❌ Critical issues found

### Recommendation

- [ ] ✅ Ready for production
- [ ] ⚠️ Fix minor issues first
- [ ] ❌ Need major fixes

---

## 📝 NOTES

```
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Tester Signature:** _____________  
**Date:** _____________  
**Time:** _____________

---

**Reviewer:** _____________  
**Date:** _____________  
**Approved:** □ Yes  □ No

---

**Last Updated:** 2026-05-04  
**Version:** 1.0.0
