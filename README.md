
# 💼 JobConnect – Hướng dẫn cài đặt và kiểm thử

Hướng dẫn dành cho giảng viên, thành viên nhóm và người kiểm thử muốn chạy dự án **JobConnect** từ mã nguồn trên GitHub.

---

## 1. Thông tin dự án

**JobConnect** là hệ thống kết nối ứng viên và nhà tuyển dụng, hỗ trợ tìm việc, đăng tin tuyển dụng, ứng tuyển và quản trị tài khoản.

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

> **Lưu ý:** FastAPI chạy cả giao diện và API trên cổng 8000. Không cần PHP, Live Server hoặc file `.bat`. MySQL Server phải được bật trước khi chạy dự án.

---

## 2. Chuẩn bị

Trước khi chạy dự án, cần cài đặt:

- Python 3
- MySQL Server
- Visual Studio Code
- Trình duyệt Chrome hoặc Microsoft Edge

### Kiểm tra Python

Mở PowerShell và chạy:

```powershell
py --version
```

Nếu hiển thị phiên bản Python thì tiếp tục.

### Cấu trúc thư mục dự án

```text
JobConnect/
│
├── README.md
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── portal.js
│   │   ├── api-bridge.js
│   │   └── theme.js
│   └── images/
│
└── Backend/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── dependencies.py
    │   ├── core/
    │   │   ├── __init__.py
    │   │   ├── config.py
    │   │   └── database.py
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── entities.py
    │   ├── schemas/
    │   │   ├── __init__.py
    │   │   └── contracts.py
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   ├── auth.py
    │   │   ├── candidate.py
    │   │   ├── recruiter.py
    │   │   ├── jobs.py
    │   │   ├── admin.py
    │   │   └── system.py
    │   └── services/
    │       ├── __init__.py
    │       └── password_reset.py
    │
    ├── scripts/
    │   ├── __init__.py
    │   ├── init_db.py
    │   ├── setup_password_reset.py
    │   └── seed_demo.py
    │
    ├── data/
    │   └── demo_jobs.json
    │
    ├── requirements.txt
    ├── .env.example
    └── .gitignore
```

**Quan trọng:** Tất cả lệnh PowerShell dưới đây được chạy tại thư mục `Backend`, không chạy trong `app/` hoặc `scripts/`.

---

## 3. Cài đặt Backend

### Bước 1: Mở dự án

Mở thư mục `JobConnect` bằng VS Code.

Chọn **Terminal → New Terminal**.

Nếu Terminal đang ở thư mục gốc dự án, chạy:

```powershell
cd Backend
```

Nếu Terminal đã ở thư mục `Backend` thì bỏ qua bước này.

### Bước 2: Tạo môi trường Python

```powershell
py -m venv .venv
```

### Bước 3: Cài đặt thư viện

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Chờ quá trình cài đặt hoàn tất.

> Chỉ cần tạo môi trường và cài thư viện lần đầu hoặc khi có thay đổi thư viện.

---

## 4. Cấu hình MySQL

### Bước 1: Khởi động MySQL

Bật dịch vụ **MySQL Server**.

Mở MySQL Workbench hoặc MySQL Command Line Client.

### Bước 2: Tạo cơ sở dữ liệu

Chạy lệnh SQL:

```sql
CREATE DATABASE IF NOT EXISTS job_portal;
```

> Lệnh SQL phải được chạy trong MySQL, không nhập trực tiếp vào PowerShell.

### Bước 3: Tạo file `.env`

Trong Terminal tại thư mục `Backend`, chạy:

```powershell
Copy-Item .env.example .env
```

**Chỉ thực hiện khi chưa có file `.env`.**

Nếu đã có `.env` đang hoạt động, hãy giữ nguyên để tránh mất cấu hình MySQL hoặc Gmail SMTP.

### Bước 4: Cấu hình kết nối MySQL

Mở file `Backend/.env`.

Ví dụ MySQL có mật khẩu:

```dotenv
DATABASE_URL=mysql+pymysql://root:MAT_KHAU_MYSQL@127.0.0.1:3306/job_portal
JOB_SECRET_KEY=THAY_BANG_CHUOI_BI_MAT_NGAU_NHIEN_DAI
```

Thay `MAT_KHAU_MYSQL` bằng mật khẩu MySQL thực tế.

Nếu tài khoản `root` không có mật khẩu:

```dotenv
DATABASE_URL=mysql+pymysql://root@127.0.0.1:3306/job_portal
```

**Lưu ý:**

- Nếu mật khẩu có ký tự đặc biệt như `@`, `#`, `%`, cần mã hóa phù hợp để sử dụng trong URL.
- Không nhập nội dung file `.env` vào Terminal.
- Không đưa file `.env` chứa mật khẩu lên GitHub.
- Giữ nguyên cấu hình SMTP nếu đã thiết lập.

### Bước 5: Kiểm tra kết nối MySQL

Chạy lệnh:

```powershell
.\.venv\Scripts\python.exe -c "from app.core.database import engine; c=engine.connect(); print('KET NOI MYSQL THANH CONG'); c.close()"
```

Nếu hiển thị:

```text
KET NOI MYSQL THANH CONG
```

Nghĩa là Backend đã kết nối được với MySQL.

---

## 5. Tạo bảng và dữ liệu kiểm thử

> **Quan trọng:** Nên sử dụng database riêng để kiểm thử. Nếu database đã có bảng và dữ liệu thì không cần nạp lại dữ liệu demo.

### Bước 1: Tạo bảng dữ liệu

```powershell
.\.venv\Scripts\python.exe -m scripts.init_db
```

Lệnh tạo các bảng chưa tồn tại theo cấu trúc models.

### Bước 2: Tạo bảng khôi phục mật khẩu

```powershell
.\.venv\Scripts\python.exe -m scripts.setup_password_reset
```

Lệnh tạo bảng phục vụ chức năng quên mật khẩu nếu chưa tồn tại.

### Bước 3: Nạp dữ liệu mẫu

```powershell
.\.venv\Scripts\python.exe -m scripts.seed_demo
```

Dữ liệu mẫu gồm tài khoản Admin, Recruiter và các tin tuyển dụng minh họa.

> Không chạy tùy tiện script nạp dữ liệu trên database chứa dữ liệu quan trọng.

---

## 6. Khởi động website

Trong Terminal đang ở thư mục `Backend`, chạy:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Sau khi máy chủ chạy, mở trình duyệt:

**Website:** http://127.0.0.1:8000

**Swagger API:** http://127.0.0.1:8000/docs

**Kiểm tra Backend:** http://127.0.0.1:8000/health

Nếu `/health` hoạt động, kết quả dự kiến:

```json
{
  "ok": true
}
```

**Lưu ý:** Giữ Terminal đang chạy khi sử dụng website.

Để dừng máy chủ, nhấn `Ctrl + C`.

---

## 7. Tài khoản kiểm thử

Sau khi chạy `scripts.seed_demo` trên database mới:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@demo.vn | 123456 |
| Recruiter | recruiter@demo.vn | 123456 |
| Candidate | Tự đăng ký | Tự đặt |

> Mật khẩu `123456` chỉ áp dụng cho tài khoản demo được tạo mới. Nếu tài khoản đã tồn tại, script có thể giữ nguyên mật khẩu cũ.

> Tài khoản đăng ký mới yêu cầu mật khẩu đúng **8 ký tự** theo phiên bản hiện tại.

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

- Hiển thị kết quả đăng ký.
- Tài khoản được lưu vào MySQL.
- Có thể đăng nhập bằng tài khoản vừa tạo.

### 8.2. Đăng nhập

1. Nhấn **Đăng nhập**.
2. Nhập email và mật khẩu.
3. Nhấn xác nhận.

**Kết quả mong đợi:**

- Đăng nhập thành công.
- Hiển thị tên người dùng.
- Hiển thị các chức năng tương ứng với Candidate.

### 8.3. Tìm kiếm việc làm

1. Nhập tên công việc hoặc từ khóa.
2. Chọn địa điểm.
3. Nhấn **Tìm việc ngay**.
4. Xem danh sách kết quả.

**Kết quả mong đợi:**

- Hiển thị công việc phù hợp.
- Có thể xem thông tin chi tiết.

### 8.4. Lưu công việc

1. Chọn một tin tuyển dụng.
2. Nhấn nút lưu việc làm.
3. Mở mục **Việc đã lưu**.

**Kết quả mong đợi:**

- Công việc xuất hiện trong danh sách đã lưu.
- Có thể bỏ lưu công việc.

### 8.5. Ứng tuyển

1. Chọn một tin tuyển dụng.
2. Nhấn **Ứng tuyển**.
3. Nếu chưa đăng nhập, hệ thống yêu cầu đăng nhập.
4. Đăng nhập bằng tài khoản Candidate.
5. Thực hiện ứng tuyển.
6. Kiểm tra lịch sử ứng tuyển.

**Kết quả mong đợi:**

- Người chưa đăng nhập phải đăng nhập trước khi ứng tuyển.
- Đơn ứng tuyển hợp lệ được lưu.
- Đơn xuất hiện trong lịch sử ứng tuyển.

### 8.6. Hồ sơ và CV

Kiểm tra:

- Thông tin cá nhân.
- Hồ sơ & CV.
- Danh sách đơn ứng tuyển.
- Trạng thái các đơn ứng tuyển.

> Một số chức năng liên quan đến file CV có thể còn xử lý trên trình duyệt, không phải toàn bộ dữ liệu đã được lưu trong MySQL.

---

## 9. Kiểm thử Recruiter – Nhà tuyển dụng

### Tài khoản mẫu

```text
Email: recruiter@demo.vn
Mật khẩu: 123456
```

### Các chức năng kiểm thử

| STT | Chức năng | Kết quả mong đợi |
|---|---|---|
| 1 | Đăng nhập | Vào đúng khu vực Recruiter |
| 2 | Hồ sơ doanh nghiệp | Xem và cập nhật thông tin |
| 3 | Đăng tin tuyển dụng | Tạo tin mới |
| 4 | Chỉnh sửa tin | Cập nhật nội dung |
| 5 | Quản lý ứng viên | Xem đơn ứng tuyển |
| 6 | Cập nhật đơn | Thay đổi trạng thái phù hợp |

### Kiểm thử đăng tin tuyển dụng

1. Đăng nhập Recruiter.
2. Mở mục **Nhà tuyển dụng**.
3. Chọn **Quản lý tin tuyển dụng**.
4. Nhập thông tin công việc.
5. Nhấn lưu tin.

**Kết quả mong đợi:**

- Tin tuyển dụng được tạo.
- Tin mới có trạng thái `pending`.
- Admin có thể xem tin đang chờ duyệt.

### Kiểm thử chỉnh sửa tin

1. Chọn tin tuyển dụng đã tạo.
2. Nhấn **Sửa**.
3. Thay đổi nội dung.
4. Lưu thông tin.

**Kết quả mong đợi:**

- Nội dung tin được cập nhật.
- Chỉ Recruiter có quyền sở hữu được chỉnh sửa tin tương ứng.

---

## 10. Kiểm thử Admin – Quản trị viên

### Tài khoản mẫu

```text
Email: admin@demo.vn
Mật khẩu: 123456
```

### 10.1. Quản lý tin tuyển dụng

1. Đăng nhập Admin.
2. Mở mục **Quản trị**.
3. Xem danh sách tin tuyển dụng.
4. Kiểm tra tin chờ duyệt.
5. Thử duyệt hoặc từ chối tin.

**Kết quả mong đợi:**

- Trạng thái tin được cập nhật.
- Tin đã duyệt được phép hiển thị cho ứng viên.
- Tin bị từ chối không xuất hiện trong danh sách đã duyệt.

### 10.2. Quản lý tài khoản

1. Mở **Quản lý tài khoản**.
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

- Trạng thái tài khoản chuyển thành `locked`.
- Tài khoản bị khóa không thể đăng nhập.

### 10.4. Mở khóa tài khoản

1. Đăng nhập Admin.
2. Chọn tài khoản đang bị khóa.
3. Nhấn **Mở khóa**.
4. Xác nhận thao tác.

**Kết quả mong đợi:**

- Trạng thái chuyển thành `active`.
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
- Danh sách được cập nhật.
- Tài khoản đã xóa không thể đăng nhập.

### 10.6. Kiểm tra phân quyền

1. Đăng nhập bằng Candidate.
2. Thử truy cập API chỉ dành cho Admin.
3. Thực hiện tương tự với Recruiter.

**Kết quả mong đợi:**

- Backend từ chối yêu cầu không đủ quyền.
- Chỉ Admin hợp lệ được thực hiện thao tác quản trị.

---

## 11. Kiểm thử quên mật khẩu

Chức năng quên mật khẩu sử dụng mã xác minh gửi qua Gmail SMTP.

### 11.1. Cấu hình Gmail SMTP

**Bước 1:** Bật xác minh 2 bước:

https://myaccount.google.com/signinoptions/two-step-verification

**Bước 2:** Tạo mật khẩu ứng dụng Google:

https://myaccount.google.com/apppasswords

**Bước 3:** Mở `Backend/.env` và thêm:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourmail@gmail.com
SMTP_PASSWORD=MAT_KHAU_UNG_DUNG_16_KY_TU
SMTP_FROM=yourmail@gmail.com
```

Thay email và mật khẩu ứng dụng bằng thông tin Gmail của bạn.

> Dùng mật khẩu ứng dụng Google, không dùng mật khẩu Gmail thông thường. Không công khai file `.env`.

### 11.2. Các bước kiểm thử

1. Mở trang đăng nhập.
2. Chọn **Quên mật khẩu**.
3. Nhập email đã đăng ký.
4. Yêu cầu gửi mã xác minh.
5. Kiểm tra Gmail.
6. Nhập mã xác minh nhận được.
7. Nhập mật khẩu mới đúng 8 ký tự.
8. Xác nhận thay đổi.
9. Đăng nhập lại bằng mật khẩu mới.

**Kết quả mong đợi:**

- Mã được gửi khi SMTP hoạt động.
- Mã sai hoặc hết hạn bị từ chối.
- Mật khẩu mới được cập nhật sau khi xác minh hợp lệ.
- Có thể đăng nhập bằng mật khẩu mới.

---

## 12. Kiểm thử API bằng Swagger

Truy cập:

http://127.0.0.1:8000/docs

### Các API thường sử dụng

| Phương thức | Đường dẫn | Chức năng |
|---|---|---|
| GET | `/health` | Kiểm tra Backend |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| GET | `/auth/me` | Thông tin tài khoản |
| GET | `/api/jobs` | Danh sách việc làm |
| GET | `/api/admin/users` | Danh sách tài khoản |
| PATCH | `/api/admin/users/{user_id}/status` | Khóa/mở khóa |
| DELETE | `/api/admin/users/{user_id}` | Xóa tài khoản |
| POST | `/auth/forgot-password` | Gửi mã khôi phục |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |

### Ví dụ khóa tài khoản

**Phương thức:** `PATCH`

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

### Ví dụ mở khóa tài khoản

```json
{
  "status": "active"
}
```

> ID `3` là ví dụ. Cần thay bằng ID tài khoản thử nghiệm thực tế.

Các API yêu cầu đăng nhập phải được gọi kèm JWT Bearer token hợp lệ.

---

## 13. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|---|---|---|
| 401 | Chưa đăng nhập hoặc token hết hạn | Đăng nhập lại |
| 403 | Không có quyền hoặc tài khoản bị khóa | Kiểm tra vai trò |
| 404 | Sai URL hoặc không tìm thấy dữ liệu | Kiểm tra đường dẫn |
| 405 | Sai phương thức HTTP | Kiểm tra GET, POST, PATCH, DELETE |
| 422 | Dữ liệu gửi không hợp lệ | Kiểm tra JSON |
| 500 | Backend hoặc MySQL gặp lỗi | Xem Terminal |
| Access denied | Sai mật khẩu MySQL | Kiểm tra `.env` |
| Unknown database | Database chưa tồn tại | Tạo `job_portal` |
| Connection refused | Dịch vụ chưa chạy | Bật MySQL hoặc FastAPI |
| No module named | Sai đường dẫn import hoặc thiếu thư viện | Kiểm tra cấu trúc và dependencies |

### Lỗi không kết nối được MySQL

Kiểm tra:

1. MySQL Server đã bật chưa.
2. Database có tên `job_portal` không.
3. Tài khoản và mật khẩu trong `.env` có đúng không.
4. MySQL có đang chạy trên cổng `3306` không.

### Lỗi thiếu bảng khôi phục mật khẩu

Chạy trong thư mục `Backend`:

```powershell
.\.venv\Scripts\python.exe -m scripts.setup_password_reset
```

### Lỗi `No module named database`

Bản cấu trúc mới sử dụng:

```python
from app.core.database import engine
```

Không sử dụng lệnh import cũ:

```python
from database import engine
```

### Lỗi cổng 8000 đang được sử dụng

Dừng máy chủ FastAPI cũ bằng `Ctrl + C`, sau đó khởi động lại.

---

## 14. Cách chạy nhanh trong những lần sau

Nếu đã cài môi trường Python và có database, không cần thực hiện lại các bước thiết lập ban đầu.

### Bước 1: Bật MySQL Server

Khởi động MySQL Server.

### Bước 2: Mở Terminal tại Backend

Nếu Terminal đang ở thư mục `JobConnect`, chạy:

```powershell
cd Backend
```

Nếu đã ở `Backend`, bỏ qua bước này.

### Bước 3: Chạy FastAPI

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

### Bước 4: Mở website

http://127.0.0.1:8000

> Không cần chạy `init_db`, `seed_demo` hoặc cài lại thư viện trong mỗi lần khởi động.

---

## 15. Lưu ý dành cho người kiểm thử

- Chỉ khóa hoặc xóa tài khoản thử nghiệm.
- Không sử dụng database chứa dữ liệu quan trọng để kiểm thử thao tác xóa.
- Không công khai mật khẩu MySQL hoặc Gmail.
- Không đưa `.env` lên GitHub.
- Không mở trực tiếp file `frontend/index.html` để kiểm thử bản tích hợp Backend.
- Khi có lỗi, kiểm tra cả Console của trình duyệt và Terminal.
- Một số chức năng CV có thể còn sử dụng dữ liệu trình duyệt.
- Ghi lại lỗi để nhóm phát triển kiểm tra.

---

## 16. Kết luận

Sau khi hoàn thành hướng dẫn, người kiểm thử có thể:

- Chạy website JobConnect từ mã nguồn.
- Kết nối Backend với MySQL.
- Đăng ký và đăng nhập tài khoản.
- Kiểm thử chức năng Candidate.
- Kiểm thử chức năng Recruiter.
- Kiểm thử chức năng Admin.
- Kiểm thử API bằng Swagger.
- Ghi nhận lỗi trong quá trình sử dụng.

---

**JobConnect © 2026 – Kết nối tài năng, mở lối tương lai.**
