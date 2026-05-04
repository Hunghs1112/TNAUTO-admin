# Tối ưu hóa Search Bar - Chuẩn hóa toàn bộ trang

## Tóm tắt
Đã chuẩn hóa search bar cho tất cả các trang trong hệ thống với format thống nhất, bao gồm cả trang "Đơn dịch vụ" (ServiceOrders) trước đây không có search bar.

## Các trang đã được cập nhật

### 1. **Đơn dịch vụ** (ServiceOrders) - ✅ MỚI THÊM
- **File**: `src/components/features/ServiceOrderManagement.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo ID, biển số xe, tên khách hàng, nhân viên..."

### 2. **Khách hàng** (Customers)
- **File**: `src/pages/Customers.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tên, SĐT, email..."

### 3. **Nhân viên** (Employees)
- **File**: `src/pages/Employees.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tên, SĐT, email, vai trò..."

### 4. **Dịch vụ** (Services)
- **File**: `src/pages/Services.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tên dịch vụ, mô tả..."

### 5. **Sản phẩm** (Products)
- **File**: `src/pages/Products.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tên sản phẩm, mô tả..."

### 6. **Ưu đãi** (Offers)
- **File**: `src/pages/Offers.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tiêu đề, mô tả ưu đãi..."

### 7. **Danh mục sản phẩm** (Categories)
- **File**: `src/pages/Categories.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tên danh mục..."

### 8. **Danh mục dịch vụ** (ServiceCategories)
- **File**: `src/pages/ServiceCategories.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo tên danh mục dịch vụ..."

### 9. **Bảo hành** (Warranties)
- **File**: `src/pages/Warranties.jsx`
- **Thay đổi**: Thêm `showSearch={true}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo mã bảo hành, khách hàng, đại lý..."

### 10. **Bảo hành đại lý** (DealerWarranties)
- **File**: `src/pages/DealerWarranties.jsx`
- **Thay đổi**: Thêm `showSearch={true}`, `showPagination={true}`, `limit={20}` và `searchPlaceholder`
- **Placeholder**: "Tìm theo đại lý, sản phẩm, nhân viên..."

### Các trang đã có search bar (không thay đổi):
- ✅ **Xe** (Vehicles) - "Tìm biển số, mẫu xe, tên khách hàng..."
- ✅ **Gara** (Garages) - "Tìm theo mã gara / tên / SĐT / email..."
- ✅ **Đại lý** (Dealers) - "Tìm theo tên / SĐT / email..."

## Cấu trúc chuẩn

Tất cả các trang hiện đang sử dụng cấu trúc thống nhất:

```jsx
<GenericCrudPage
  api={...}
  columns={...}
  fieldsForModal={...}
  title={...}
  showPagination={true}
  limit={12 hoặc 20}
  showSearch={true}  // ✅ Đã thêm
  searchPlaceholder="..."  // ✅ Đã thêm với nội dung phù hợp
  // ... các props khác
/>
```

## Tính năng Search Bar

### Frontend
- **Component**: `SearchInput` (`src/components/table/SearchInput.jsx`)
- **Debounce**: 150ms để tối ưu hiệu suất
- **Clear button**: Nút xóa tìm kiếm khi có text
- **Enter key**: Hỗ trợ tìm kiếm ngay khi nhấn Enter
- **Search indicator**: Hiển thị số lượng kết quả tìm được

### Backend
Không cần thay đổi backend vì:
- Search được xử lý bởi `GenericTable` component
- Hỗ trợ cả **client-side search** (mặc định) và **server-side search** (khi `serverSideSearch={true}`)
- Với `showPagination={true}`, search tự động chuyển sang server-side mode

## Lợi ích

1. **Trải nghiệm người dùng nhất quán**: Tất cả các trang đều có search bar với cùng giao diện và hành vi
2. **Dễ sử dụng**: Placeholder rõ ràng giúp người dùng biết có thể tìm kiếm theo trường nào
3. **Hiệu suất tốt**: Debounce và tối ưu hóa render
4. **Không cần thay đổi backend**: Tất cả logic search đã được xử lý sẵn trong frontend

## Kiểm tra

Để kiểm tra các thay đổi:
1. Chạy ứng dụng: `npm run dev`
2. Truy cập từng trang đã liệt kê ở trên
3. Kiểm tra search bar xuất hiện và hoạt động đúng
4. Thử tìm kiếm với các từ khóa khác nhau

## Ghi chú

- Tất cả các thay đổi chỉ ở **frontend**, không cần cập nhật backend
- Search bar tự động tích hợp với pagination khi `showPagination={true}`
- Có thể dễ dàng tùy chỉnh placeholder cho từng trang nếu cần
