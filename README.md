 F-NétGen — Mặc chất riêng – Giữ chất Việt

Mở tệp **index.html** bằng Chrome/Edge/Firefox để thử toàn bộ quy trình ở **chế độ demo**.

- Trang chào và nút Bắt đầu phối đồ.
- Bước 1: chọn dịp (tốt nghiệp, đi chơi, công sở, lễ hội, chụp ảnh, khác).
- Bước 2: áo dài / áo viên lĩnh (kèm thông tin), chọn quần/áo/váy/đầm, tải ảnh lên, điều chỉnh thanh 20–50%.
- Bước 3: chọn tối đa 2 phong cách.
- Bước 4: xem **3 mẫu demo**, thông số minh họa, chọn 1 mẫu và đi tiếp.
- Bước 5: chỉnh màu, phom dáng, độ dài và ghi chú, sau đó chốt outfit.
- Trang kết quả và tải thẻ thiết kế PNG.

**Quan trọng:** Khi chưa kết nối API, các ảnh outfit lấy từ ảnh mẫu trong PDF. Điểm hợp gu chỉ là minh họa được tính từ các lựa chọn, không phải phép đo hoặc độ chính xác AI. Phần phủ màu ở bước 5 chỉ là xem trước; không thay đổi đường may của ảnh nếu chưa chạy AI.

## Bật AI tạo ảnh và nhận diện trang phục

## Cấu trúc thư mục

```text
f-netgen/
├── index.html      # Giao diện trang web
├── styles.css      # Thiết kế responsive desktop / điện thoại
├── app.js          # Ứng dụng và các bước phối đồ
├── server.js       # API máy chủ Node (không bắt buộc trong demo)
├── README.md       # Hướng dẫn này
└── assets/         # Hình minh họa và logo
```

## Tùy chỉnh nhanh

- Màu nền, màu đỏ, màu viền vàng: các biến CSS `:root` ở đầu `styles.css`.
- Tên các dịp, lựa chọn và thông tin áo: các mảng `OCCASIONS`, `TRADITIONS`, `MODERN`, `STYLES` trong `app.js`.
- Prompt tạo 3 ảnh: hàm `generatePrompt` trong `server.js`.
- Muốn thêm hệ thống lưu outfit, tài khoản người dùng, kích cỡ người mẫu hoặc đặt mua: cần phát triển chức năng riêng.

