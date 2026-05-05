# VHU Challenge 2025

**VHU Challenge** là cuộc thi **an ninh mạng thường niên** do **Trường Đại học Văn Hiến (VHU)** tổ chức — sân chơi dành cho sinh viên đam mê **Information Security**, **CTF (Capture The Flag)** và **Ethical Hacking**.

> *Hack. Learn. Conquer.*
> Thử thách giới hạn của bạn. Phá hệ thống — không phá luật.

## Tổng quan

**VHU Challenge** được thiết kế nhằm giúp sinh viên tiếp cận các lỗ hổng bảo mật thực tế thông qua những thử thách thuộc các mảng **Web**, **Crypto**, **Forensic**, và **Network**.
Mỗi thử thách mô phỏng tình huống **tấn công – phòng thủ thực tế**, cho phép người chơi **phân tích, khai thác và học hỏi** từ chính quá trình thực hành.

### Điểm nổi bật

* Nhiều thể loại thử thách (Web, Crypto, Forensics, OSINT, Misc)
* Bảng xếp hạng **real-time**, cập nhật thứ hạng động
* Hệ thống **đăng ký người dùng / đội nhóm**
* Xây dựng bằng **Node.js, Express, MongoDB và Handlebars (HBS)**
* Giao diện **Cyberpunk – Neon Glow**, đậm chất hacker
* Dễ dàng triển khai với **Docker Compose** hoặc **Local Environment**

## Công nghệ sử dụng

| Layer                | Công nghệ                                      |
| -------------------- | ---------------------------------------------- |
| **Frontend**         | HTML5, Bootstrap 4, Handlebars (HBS), Chart.js |
| **Backend**          | Node.js (Express.js)                           |
| **Database**         | MongoDB (Mongoose ORM)                         |
| **Triển khai**       | Docker, Nginx Reverse Proxy, Certbot SSL       |
| **Giao diện**        | Neon Glow CSS, Google Fonts, Hack Font         |
| **Quản lý mã nguồn** | Git + GitHub                                   |

## ⚙️ Cài đặt & Khởi chạy

### Bước 1: Clone repository

```bash
git clone https://github.com/dinhvaren/VHU-Challenge.git
cd VHU-Challenge
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Tạo file `.env`

Tạo file `.env` ở thư mục gốc của dự án và thêm các biến sau:

```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017/vhuctf
JWT_SECRET=yourSecretKey
SESSION_SECRET=yourSessionKey
```

### Bước 4: Chạy ứng dụng

```bash
npm start
```

Sau đó truy cập tại: [http://localhost:3000](http://localhost:3000)

## Giao diện & Chức năng

* **Trang chủ:** Hiệu ứng glitch động cùng banner “VHU Challenge”
* **Đăng ký / Đăng nhập:** Giao diện neon cyberpunk, checkbox phát sáng
* **Hackerboard:** Bảng xếp hạng động, hiển thị thống kê bằng Chart.js
* **Challenges:** Bộ thử thách mô phỏng khai thác lỗ hổng thực tế, có flag submission

## Triết lý thiết kế

> “Càng im lặng, bạn càng nghe được nhiều hơn.”
> — *Ancient Hacker Proverb*

**VHU Challenge** không chỉ là một cuộc thi, mà là **môi trường học tập thực chiến**, nơi sinh viên trở thành **người tấn công, người phòng thủ và người tư duy bảo mật**.

## Người thực hiện

| Họ tên                                 | Vai trò             | Liên hệ                                |
| -------------------------------------- | ------------------- | -------------------------------------- |
| **Lương Nguyễn Ngọc Đình (d1nhvar3n)** | Founder / Developer | [GitHub](https://github.com/dinhvaren) |


## Giấy phép sử dụng

Dự án này được tạo ra **vì mục đích học tập và nghiên cứu đạo đức**.
Toàn bộ nội dung challenge thuộc sở hữu của **VHU InfoSec Lab**.
**Nghiêm cấm** triển khai trên môi trường sản xuất hoặc mục đích trái phép.

### Kết nối

* Portfolio: [https://d1nhvar3n.id.vn](https://d1nhvar3n.id.vn)
* GitHub: [https://github.com/dinhvaren](https://github.com/dinhvaren)
* Email: [dinhvaren@vhu.edu.vn](mailto:dinhvaren@vhu.edu.vn)

> *“Hãy luyện tập như đang chiến đấu — hack như đang học.”*
