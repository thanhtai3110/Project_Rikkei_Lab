
# 💼 JobConnect – Hướng dẫn cài đặt và kiểm thử

Hướng dẫn dành cho giảng viên, thành viên nhóm và người kiểm thử muốn chạy dự án **JobConnect** từ mã nguồn trên GitHub.

---

## 1. Thông tin dự án

JobConnect là hệ thống kết nối ứng viên và nhà tuyển dụng, hỗ trợ tìm việc, đăng tin tuyển dụng, ứng tuyển và quản trị tài khoản.

### Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python FastAPI |
| Database | MySQL |
| Xác thực | JWT |
| Môi trường | Windows, VS Code, PowerShell |

### Địa chỉ truy cập

| Nội dung | Đường dẫn |
|---|---|
| Website | http://127.0.0.1:8000 |
| Swagger API | http://127.0.0.1:8000/docs |
| Kiểm tra máy chủ | http://127.0.0.1:8000/health |

> **Lưu ý:** Phiên bản này sử dụng FastAPI để chạy cả giao diện và API trên cổng 8000. Không cần XAMPP, PHP, Live Server hoặc file `.bat`. MySQL Server vẫn phải được bật.

---

## 2. Chuẩn bị

Trước khi chạy dự án, cần cài đặt:

- Python 3.
- MySQL Server.
- Visual Studio Code.
- Trình duyệt Chrome hoặc Microsoft Edge.

### Kiểm tra Python

Mở PowerShell và chạy:

```powershell
py --version
```

Nếu hiển thị phiên bản Python thì có thể tiếp tục.

### Cấu trúc thư mục

Hai thư mục `frontend` và `Backend` phải nằm cùng cấp.

```text
JobConnect/
│
├── README.md
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── portal.js
│   ├── api-bridge.js
│   ├── style.css
│   ├── theme.js
│   └── images/
│
└── Backend/
    ├── main.py
    ├── config.py
    ├── database.py
    ├── models.py
    ├── schemas.py
    ├── password_reset.py
    ├── init_db.py
    ├── setup_password_reset.py
    ├── seed_demo.py
    ├── demo_jobs.json
    ├── requirements.txt
    ├── .env.example
    └── .gitignore
```

---

## 3. Cài đặt Backend

### Bước 1: Mở dự án

Mở thư mục `JobConnect` bằng VS Code.

Chọn **Terminal → New Terminal**.

Chuyển vào thư mục Backend:

```powershell
cd Backend
```

> Nếu Terminal đã ở thư mục `Backend` thì bỏ qua bước này.

### Bước 2: Tạo môi trường Python

Chạy lệnh:

```powershell
py -m venv .venv
```

### Bước 3: Cài đặt thư viện

Chạy lệnh:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Đợi quá trình cài đặt hoàn tất.

> Chỉ cần tạo môi trường và cài thư viện lần đầu, hoặc khi có thay đổi thư viện của dự án.

---

## 4. Cấu hình MySQL

### Bước 1: Khởi động MySQL

Bật dịch vụ MySQL Server.

Mở **MySQL Workbench** hoặc **MySQL Command Line Client**.

### Bước 2: Tạo cơ sở dữ liệu

Chạy lệnh sau trong MySQL:

```sql
CREATE DATABASE IF NOT EXISTS job_portal;
```

> Lệnh SQL phải chạy trong MySQL, không nhập vào PowerShell.

### Bước 3: Tạo file `.env`

Quay lại Terminal đang ở thư mục `Backend`.

Chạy:

```powershell
Copy-Item .env.example .env
```

Nếu đã có file `.env` thì không cần tạo lại.

### Bước 4: Cấu hình kết nối MySQL

Mở file `Backend/.env`.

Sửa thông tin kết nối theo máy của người kiểm thử:

```dotenv
DATABASE_URL=mysql+pymysql://root:MAT_KHAU_MYSQL@127.0.0.1:3306/job_portal
JOB_SECRET_KEY=THAY_BANG_CHUOI_BI_MAT_NGAU_NHIEN_DAI
```

Thay `MAT_KHAU_MYSQL` bằng mật khẩu MySQL thực tế.

Nếu tài khoản `root` không có mật khẩu, dùng:

```dotenv
DATABASE_URL=mysql+pymysql://root@127.0.0.1:3306/job_portal
```

**Lưu ý:**

- Nếu mật khẩu có ký tự đặc biệt như `@`, `#`, `%`, cần mã hóa để dùng trong URL.
- Không nhập nội dung `.env` vào Terminal.
- Không tải file `.env` chứa mật khẩu lên GitHub.
- Giữ nguyên các cấu hình SMTP khác nếu đã thiết lập.

### Bước 5: Kiểm tra kết nối MySQL

Chạy trong Terminal tại thư mục `Backend`:

```powershell
.\.venv\Scripts\python.exe -c "from database import engine; c=engine.connect(); print('KET NOI MYSQL THANH CONG'); c.close()"
```

Nếu kết quả hiển thị:

```text
KET NOI MYSQL THANH CONG
```

Nghĩa là kết nối cơ sở dữ liệu đã thành công.

---

## 5. Tạo bảng và dữ liệu kiểm thử

> **Quan trọng:** Nên sử dụng database mới dành riêng cho việc kiểm thử.

### Bước 1: Tạo bảng dữ liệu

Chạy:

```powershell
.\.venv\Scripts\python.exe init_db.py
```

Lệnh tạo các bảng chưa tồn tại theo cấu trúc trong `models.py`.

### Bước 2: Tạo bảng khôi phục mật khẩu

Chạy:

```powershell
.\.venv\Scripts\python.exe setup_password_reset.py
```

Bước này tạo bảng phục vụ chức năng quên mật khẩu nếu chưa có.

### Bước 3: Nạp dữ liệu mẫu

Chạy:

```powershell
.\.venv\Scripts\python.exe seed_demo.py
```

Dữ liệu mẫu gồm tài khoản Admin, Recruiter và một số tin tuyển dụng.

> Chỉ chạy bước này khi kiểm thử trên database demo. Không chạy tùy tiện trên database có dữ liệu quan trọng.

---

## 6. Khởi động website

Trong Terminal đang ở thư mục `Backend`, chạy:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Sau khi máy chủ khởi động, mở trình duyệt.

### Truy cập website

http://127.0.0.1:8000

### Truy cập Swagger API

http://127.0.0.1:8000/docs

### Kiểm tra trạng thái Backend

http://127.0.0.1:8000/health

Nếu API hoạt động, đường dẫn `/health` trả về:

```json
{
  "ok": true
}
```

**Lưu ý:** Giữ Terminal chạy khi đang sử dụng website.

Muốn dừng máy chủ, nhấn:

```text
Ctrl + C
```

---

## 7. Tài khoản kiểm thử

Sau khi chạy `seed_demo.py` trên database mới:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@demo.vn | 123456 |
| Recruiter | recruiter@demo.vn | 123456 |
| Candidate | Tự đăng ký | Tự đặt |

> Mật khẩu `123456` chỉ áp dụng cho tài khoản demo được script tạo mới. Nếu tài khoản đã tồn tại từ trước, script có thể giữ nguyên mật khẩu cũ.

> Tài khoản đăng ký mới yêu cầu mật khẩu đúng **8 ký tự**.

---

## 8. Kiểm thử Candidate – Ứng viên

### 8.1. Đăng ký tài khoản

1. Truy cập website.
2. Nhấn **Đăng ký**.
3. Nhập họ tên và email.
4. Nhập mật khẩu đúng 8 ký tự.
5. Nhập lại mật khẩu xác nhận.
6. Nhấn đăng ký.

**Kết quả mong đợi:**

- Hiển thị thông báo đăng ký thành công.
- Tài khoản được lưu vào MySQL.
- Có thể đăng nhập bằng tài khoản vừa tạo.

### 8.2. Đăng nhập

1. Nhấn **Đăng nhập**.
2. Nhập email và mật khẩu.
3. Nhấn xác nhận.

**Kết quả mong đợi:**

- Đăng nhập thành công.
- Hiển thị thông tin người dùng.
- Hiển thị chức năng tương ứng với vai trò Candidate.

### 8.3. Tìm kiếm việc làm

1. Nhập tên công việc hoặc từ khóa.
2. Chọn địa điểm.
3. Nhấn **Tìm việc ngay**.
4. Xem danh sách kết quả.

**Kết quả mong đợi:**

- Hiển thị các công việc phù hợp.
- Có thể xem chi tiết tin tuyển dụng.

### 8.4. Lưu công việc

1. Chọn một tin tuyển dụng.
2. Nhấn nút lưu việc làm.
3. Mở mục **Việc đã lưu**.

**Kết quả mong đợi:**

- Công việc xuất hiện trong danh sách đã lưu.
- Có thể bỏ lưu nếu không còn quan tâm.

### 8.5. Ứng tuyển

1. Chọn một công việc.
2. Xem thông tin chi tiết.
3. Nhấn **Ứng tuyển**.
4. Điền thông tin yêu cầu.
5. Gửi đơn ứng tuyển.

**Kết quả mong đợi:**

- Hiển thị thông báo kết quả gửi đơn.
- Đơn xuất hiện trong lịch sử ứng tuyển.

### 8.6. Hồ sơ và CV

Kiểm tra:

- Thông tin cá nhân.
- Hồ sơ & CV.
- Đơn ứng tuyển.
- Thông tin trạng thái ứng tuyển.

> Một số chức năng xử lý file CV còn hoạt động ở trình duyệt. Cần phân biệt với dữ liệu đã lưu trong MySQL.

---

## 9. Kiểm thử Recruiter – Nhà tuyển dụng

### Đăng nhập tài khoản mẫu

```text
Email: recruiter@demo.vn
Mật khẩu: 123456
```

### Các chức năng cần kiểm thử

| STT | Chức năng | Kết quả mong đợi |
|---|---|---|
| 1 | Đăng nhập | Vào đúng khu vực Recruiter |
| 2 | Hồ sơ doanh nghiệp | Xem và cập nhật thông tin |
| 3 | Đăng tin tuyển dụng | Tạo tin mới |
| 4 | Chỉnh sửa tin | Cập nhật nội dung tin |
| 5 | Quản lý ứng viên | Xem đơn ứng tuyển |
| 6 | Cập nhật đơn | Thay đổi trạng thái phù hợp |

### Kiểm thử đăng tin tuyển dụng

1. Đăng nhập Recruiter.
2. Mở mục **Nhà tuyển dụng**.
3. Chọn **Quản lý tin tuyển dụng**.
4. Nhập thông tin công việc.
5. Nhấn lưu tin.

**Kết quả mong đợi:**

- Tin tuyển dụng được tạo thành công.
- Tin mới có trạng thái `pending`.
- Admin có thể xem tin đang chờ duyệt.

### Kiểm thử chỉnh sửa tin

1. Chọn tin tuyển dụng đã tạo.
2. Nhấn **Sửa**.
3. Thay đổi nội dung.
4. Lưu thông tin.

**Kết quả mong đợi:**

- Nội dung được cập nhật.
- Tin chỉ được chỉnh sửa bởi nhà tuyển dụng có quyền sở hữu.

---

## 10. Kiểm thử Admin – Quản trị viên

### Đăng nhập tài khoản mẫu

```text
Email: admin@demo.vn
Mật khẩu: 123456
```

### 10.1. Quản lý tin tuyển dụng

1. Đăng nhập bằng tài khoản Admin.
2. Mở mục **Quản trị**.
3. Xem danh sách tin tuyển dụng.
4. Kiểm tra các tin đang chờ duyệt.
5. Thử duyệt hoặc từ chối tin.

**Kết quả mong đợi:**

- Trạng thái tin được cập nhật.
- Tin đã duyệt được phép hiển thị cho ứng viên.
- Tin bị từ chối không xuất hiện trong danh sách tin đã duyệt.

### 10.2. Quản lý tài khoản

1. Mở mục **Quản lý tài khoản**.
2. Xem danh sách người dùng.
3. Tìm tài khoản bằng tên hoặc email.
4. Lọc theo vai trò.
5. Kiểm tra trạng thái tài khoản.

**Kết quả mong đợi:**

- Hiển thị danh sách tài khoản.
- Có thể tìm kiếm và lọc dữ liệu.

### 10.3. Khóa tài khoản

1. Chọn một tài khoản Candidate thử nghiệm.
2. Nhấn **Khóa**.
3. Xác nhận thao tác.
4. Đăng xuất.
5. Thử đăng nhập bằng tài khoản vừa khóa.

**Kết quả mong đợi:**

- Trạng thái chuyển thành `locked`.
- Tài khoản bị khóa không thể đăng nhập Backend.

### 10.4. Mở khóa tài khoản

1. Đăng nhập lại bằng tài khoản Admin.
2. Chọn tài khoản đang bị khóa.
3. Nhấn **Mở khóa**.
4. Xác nhận thao tác.

**Kết quả mong đợi:**

- Trạng thái trở về `active`.
- Tài khoản có thể đăng nhập lại.

### 10.5. Xóa tài khoản

> Chỉ kiểm thử với tài khoản được tạo riêng để xóa.

1. Tạo một tài khoản Candidate mới.
2. Đăng nhập Admin.
3. Tìm tài khoản vừa tạo.
4. Nhấn **Xóa**.
5. Xác nhận thao tác.

**Kết quả mong đợi:**

- Tài khoản được xóa khi đáp ứng điều kiện.
- Danh sách tài khoản được cập nhật.
- Tài khoản đã xóa không thể đăng nhập.

### 10.6. Kiểm tra phân quyền

1. Đăng nhập bằng Candidate.
2. Thử truy cập API chỉ dành cho Admin.
3. Thực hiện tương tự với Recruiter.

**Kết quả mong đợi:**

- Backend từ chối yêu cầu không đủ quyền.
- Chỉ Admin hợp lệ được phép quản trị tài khoản.

---

## 11. Kiểm thử quên mật khẩu

Chức năng này sử dụng mã xác minh gửi qua Gmail SMTP.

### 11.1. Cấu hình Gmail SMTP
1. Tạo mật khẩu ứng dụng Google (App Password)
Tạo mật khẩu ứng dụng Google
https://accounts.google.com/v3/signin/challenge/pwd?TL=AAxq8nueous9PpLGlqLSfhsRuERTP2DrB_ZE9-Xk06apUxgcyPJtjEAeA7zBKA2U&authuser=0&cid=3&continue=https%3A%2F%2Fmyaccount.google.com%2Fapppasswords%3Futm_source%3Dchatgpt.com&dsh=S856873224%3A1794913779778622&flowName=GlifWebSignIn&followup=https%3A%2F%2Fmyaccount.google.com%2Fapppasswords%3Futm_source%3Dchatgpt.com&rart=ANgoxccXYRu_ftwPTO0obxmDm4ZVNLNHDbe5ISWXx_okTs4QP7n73cbwqwzh7FppTtVkkkq4wymtmH57paw7lFChfHB7NCYJul7zwRqzL9gTjJHDWWouYYs&rpbg=1

Đây là link chính bạn cần để lấy mật khẩu SMTP.

2. Bật xác minh 2 bước (nếu chưa bật)

Bật xác minh 2 bước GoogleGoogle yêu cầu bật xác minh 2 bước trước khi tạo mật khẩu ứng dụng.

3. Thiết lập cho JobConnect

Sau khi tạo mật khẩu ứng dụng, Google sẽ cấp mật khẩu gồm 16 ký tự.

Mở file:

`Backend/.env`

Cấu hình:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_EMAIL@gmail.com --> email vừa tạo ra tài khoản 
SMTP_PASSWORD=YOUR_GOOGLE_APP_PASSWORD --> điền mật khẩu 16 ký tự
SMTP_FROM=YOUR_EMAIL@gmail.com
```

Thay các giá trị mẫu bằng thông tin Gmail được sử dụng để gửi mã.

> Sử dụng mật khẩu ứng dụng Google, không phải mật khẩu đăng nhập Gmail thông thường.

### 11.2. Các bước kiểm thử

1. Mở trang đăng nhập.
2. Chọn **Quên mật khẩu**.
3. Nhập email đã đăng ký.
4. Yêu cầu gửi mã xác minh.
5. Kiểm tra hộp thư Gmail.
6. Nhập mã xác minh nhận được.
7. Nhập mật khẩu mới đúng 8 ký tự.
8. Xác nhận thay đổi.
9. Đăng nhập lại bằng mật khẩu mới.

**Kết quả mong đợi:**

- Mã được gửi khi SMTP hoạt động.
- Mã sai hoặc hết hạn bị từ chối.
- Mật khẩu mới được cập nhật khi xác minh hợp lệ.
- Có thể đăng nhập bằng mật khẩu mới.

> Nếu chưa thiết lập SMTP, không thể kiểm thử đầy đủ việc gửi email thật.

---

## 12. Kiểm thử API bằng Swagger

Mở:

http://127.0.0.1:8000/docs

Trang Swagger hiển thị các API do Backend cung cấp.

### Các API thường sử dụng

| Phương thức | Đường dẫn | Chức năng |
|---|---|---|
| GET | `/health` | Kiểm tra Backend |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| GET | `/auth/me` | Xem thông tin tài khoản |
| GET | `/api/jobs` | Danh sách việc làm |
| GET | `/api/admin/users` | Danh sách tài khoản |
| PATCH | `/api/admin/users/{user_id}/status` | Khóa/mở khóa |
| DELETE | `/api/admin/users/{user_id}` | Xóa tài khoản |
| POST | `/auth/forgot-password` | Yêu cầu mã khôi phục |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |

### Ví dụ: Khóa tài khoản

**Phương thức:**

```text
PATCH
```

**Đường dẫn:**

```text
/api/admin/users/3/status
```

**JSON Body:**

```json
{
  "status": "locked"
}
```

### Ví dụ: Mở khóa tài khoản

**JSON Body:**

```json
{
  "status": "active"
}
```

> ID `3` chỉ là ví dụ. Hãy thay bằng ID thực tế của tài khoản test.

### Lưu ý xác thực

Các API cần đăng nhập phải sử dụng JWT Bearer token hợp lệ.

Nên kiểm thử bằng đúng vai trò được cấp quyền.

---

## 13. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|---|---|---|
| 401 | Chưa đăng nhập hoặc token hết hạn | Đăng nhập lại |
| 403 | Không có quyền hoặc tài khoản bị khóa | Kiểm tra vai trò |
| 404 | Sai URL hoặc không tìm thấy dữ liệu | Kiểm tra đường dẫn |
| 405 | Gọi sai phương thức HTTP | Kiểm tra GET, POST, PATCH, DELETE |
| 422 | Dữ liệu gửi không hợp lệ | Kiểm tra JSON |
| 500 | Backend hoặc MySQL gặp lỗi | Xem Terminal |
| Access denied | Sai mật khẩu MySQL | Sửa `.env` |
| Unknown database | Chưa tạo database | Tạo `job_portal` |
| Connection refused | Dịch vụ chưa chạy | Bật MySQL/FastAPI |
| No module named | Thiếu thư viện | Cài lại requirements |

### Lỗi 405 – Method Not Allowed

Nguyên nhân thường là sử dụng sai phương thức.

Ví dụ:

- Xem dữ liệu: `GET`.
- Tạo dữ liệu: `POST`.
- Cập nhật trạng thái: `PATCH`.
- Xóa tài khoản: `DELETE`.

Kiểm tra phương thức được khai báo trong Swagger.

### Lỗi không kết nối được MySQL

Kiểm tra:

1. MySQL Server đã bật chưa.
2. Tên database có đúng `job_portal` không.
3. Tài khoản và mật khẩu trong `.env` có chính xác không.
4. Cổng MySQL có đúng `3306` không.

### Lỗi thiếu bảng khôi phục mật khẩu

Chạy:

```powershell
.\.venv\Scripts\python.exe setup_password_reset.py
```

Sau đó thử lại chức năng quên mật khẩu.

### Lỗi cổng 8000 đang được sử dụng

Kiểm tra có chương trình FastAPI khác đang chạy không.

Có thể dừng Terminal đang chạy máy chủ cũ bằng:

```text
Ctrl + C
```

Sau đó khởi động lại website.

---

## 14. Cách chạy nhanh trong những lần sau

Nếu đã cài đặt môi trường, tạo database và nạp dữ liệu trước đó thì chỉ cần thực hiện những bước sau.

### Bước 1: Bật MySQL Server

Khởi động dịch vụ MySQL.

### Bước 2: Mở Terminal trong VS Code

Chuyển vào thư mục Backend:

```powershell
cd Backend
```

### Bước 3: Khởi động FastAPI

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

### Bước 4: Mở website

http://127.0.0.1:8000

> Không cần chạy `init_db.py`, `seed_demo.py` hoặc cài lại thư viện mỗi lần khởi động.

---

## 15. Lưu ý dành cho người kiểm thử

- Chỉ thực hiện khóa và xóa trên tài khoản test.
- Không sử dụng cơ sở dữ liệu chứa thông tin quan trọng.
- Không công khai mật khẩu MySQL hoặc Gmail.
- Không đưa file `.env` lên GitHub.
- Không mở trực tiếp `frontend/index.html` để test bản tích hợp Backend.
- Khi gặp lỗi, kiểm tra thông báo trình duyệt và Terminal.
- Các chức năng liên quan CV có thể còn sử dụng dữ liệu trình duyệt.
- Ghi lại lỗi phát hiện được để nhóm phát triển kiểm tra.

---

## 16. Kết luận

Sau khi hoàn thành hướng dẫn, người kiểm thử có thể:

- Chạy website JobConnect từ mã nguồn.
- Kết nối Backend với MySQL.
- Đăng ký và đăng nhập tài khoản.
- Kiểm thử Candidate.
- Kiểm thử Recruiter.
- Kiểm thử Admin.
- Kiểm thử các API bằng Swagger.
- Ghi nhận lỗi trong quá trình sử dụng.

---

**JobConnect © 2026 – Kết nối tài năng, mở lối tương lai.**
