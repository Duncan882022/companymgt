# Hướng Dẫn Cài Đặt và Chạy Hệ Thống

## Company Ownership Management System

### Yêu Cầu Hệ Thống
- Node.js (phiên bản 14.0.0 trở lên)
- npm hoặc yarn

### Cài Đặt

1. **Cài đặt Node.js**
   - Tải và cài đặt Node.js từ: https://nodejs.org/
   - Kiểm tra cài đặt: `node --version` và `npm --version`

2. **Cài đặt các dependencies**
   ```bash
   cd "/Users/duncannguyen/Desktop/Company Onwnership"
   npm install
   ```

3. **Chạy ứng dụng**
   ```bash
   npm start
   ```
   
   Ứng dụng sẽ tự động mở trong trình duyệt tại địa chỉ: http://localhost:3000

### Cấu Trúc Dự Án

```
Company Onwnership/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── components/
│   │   └── CompanyDetail.js    # Component chi tiết công ty với 3 tabs
│   ├── App.js                  # Component chính
│   ├── App.css                 # Styling cho App
│   ├── index.js                # Entry point
│   └── index.css               # Global styles
├── vicownership.json           # Dữ liệu cấu trúc công ty
├── shareholders.json           # Dữ liệu cổ đông
├── package.json                # Project configuration
└── README.MD                   # Mô tả yêu cầu (tiếng Việt)
```

### Tính Năng

#### 1. Danh Sách Công Ty
- Hiển thị tất cả các công ty từ `vicownership.json`
- Có thể click vào tên công ty để xem chi tiết

#### 2. Chi Tiết Công Ty - Tab 1: Công Ty Con Trực Tiếp
- Hiển thị danh sách các công ty con trực tiếp
- Cột: Tên Công Ty, Loại Sở Hữu (Trực Tiếp), Tỷ Lệ Sở Hữu (%)

#### 3. Chi Tiết Công Ty - Tab 2: Cổ Đông
- Hiển thị danh sách cổ đông từ `shareholders.json`
- Cột: Cổ Đông, Tỷ Lệ Sở Hữu, Từ Ngày, Đến Ngày, Trạng Thái
- Trạng Thái: "Active" (nếu ngày hiện tại <= To), "Inactive" (nếu ngày hiện tại > To)
- **Tự động phân bổ lại tỷ lệ sở hữu**: Nếu có cổ đông inactive, hệ thống tự động phân bổ lại % theo tỷ lệ của các cổ đông còn active

#### 4. Chi Tiết Công Ty - Tab 3: Công Ty Con Gián Tiếp
- Tính toán và hiển thị công ty con gián tiếp dựa trên công thức:
  ```
  A = Tỷ lệ sở hữu Cty 1 ở Cty 2 × Tỷ lệ sở hữu Cty 2 ở Cty 3 × ... × Tỷ lệ sở hữu Cty (N-1) ở Cty N
  ```
- **Ngưỡng X% có thể cấu hình** (mặc định: 10%)
- Nếu A ≥ X% ⇒ Công ty N là công ty con gián tiếp của Công ty 1
- Hiển thị chuỗi sở hữu để dễ theo dõi

### Công Thức Tính Sở Hữu Gián Tiếp

**Ví dụ:**
- Công ty 1 sở hữu 50% Công ty 2
- Công ty 2 sở hữu 50% Công ty 3
- ⇒ Công ty 1 sở hữu gián tiếp Công ty 3: 0.5 × 0.5 = 25%
- Nếu ngưỡng X = 10% ⇒ 25% ≥ 10% ⇒ Công ty 3 là công ty con gián tiếp của Công ty 1

### Cấu Hình Ngưỡng

Ở phần header, bạn có thể điều chỉnh "Ngưỡng Sở Hữu Gián Tiếp (X%)" để thay đổi mốc tính toán công ty con gián tiếp.

### Build Production

```bash
npm run build
```

Build sẽ tạo folder `build/` chứa các file tối ưu để deploy.

### Troubleshooting

**Lỗi: "npm: command not found"**
- Cài đặt Node.js và npm

**Lỗi: "Cannot find module"**
- Chạy lại: `npm install`

**Port 3000 đã được sử dụng**
- Thay đổi port trong file `.env`: `PORT=3001`

### Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Node.js version >= 14
2. Tất cả dependencies đã được cài đặt
3. File `vicownership.json` và `shareholders.json` tồn tại ở root folder






