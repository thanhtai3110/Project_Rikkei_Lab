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
| Gửi email | Gmail SMTP |
| Môi trường | Windows, VS Code, PowerShell |

### Địa chỉ truy cập

| Nội dung | Đường dẫn |
|---|---|
| Website | http://127.0.0.1:8000 |
| Swagger API | http://127.0.0.1:8000/docs |
| Kiểm tra máy chủ | http://127.0.0.1:8000/health |

> FastAPI chạy cả giao diện và API trên cổng 8000. Không cần PHP, XAMPP, Live Server hoặc file `.bat`. MySQL Server phải được bật trước khi chạy dự án.

---

## 2. Chuẩn bị

Trước khi chạy dự án, cần cài đặt:

- Python 3
- MySQL Server
- MySQL Workbench
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
Project_Rikkei_Lab/
│
├── README.md
├── .gitignore
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
    ├── .env
    └── .venv/
```

> File `.env` và thư mục `.venv` được tạo trên máy người kiểm thử, không cần tải từ GitHub.

**Quan trọng:** Tất cả lệnh PowerShell dưới đây được chạy tại thư mục `Backend`, không chạy trong `app/` hoặc `scripts/`.

---

## 3. Cài đặt Backend

### Bước 1: Mở dự án

Tải mã nguồn từ GitHub và giải nén nếu tải bằng file ZIP.

Mở thư mục dự án bằng Visual Studio Code.

Chọn **Terminal → New Terminal**.

Nếu Terminal đang ở thư mục gốc dự án, chạy:

```powershell
cd Backend
```

Nếu Terminal đã ở thư mục `Backend` thì bỏ qua bước này.

Kiểm tra thư mục hiện tại:

```powershell
Get-Location
```

### Bước 2: Tạo môi trường Python

```powershell
py -m venv .venv
```

Nếu máy không nhận lệnh `py`, thử:

```powershell
python -m venv .venv
```

### Bước 3: Cài đặt thư viện

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Chờ quá trình cài đặt hoàn tất.

> Không bắt buộc kích hoạt môi trường ảo bằng `Activate.ps1`. Các lệnh trong hướng dẫn sử dụng trực tiếp Python trong thư mục `.venv`, giúp tránh lỗi Execution Policy của PowerShell.

---

## 4. Cấu hình MySQL

### Bước 1: Khởi động MySQL

Bật dịch vụ **MySQL Server**.

Mở MySQL Workbench và đăng nhập bằng tài khoản MySQL trên máy.

Thông tin kết nối thường sử dụng:

| Thông tin | Giá trị |
|---|---|
| Host | localhost hoặc 127.0.0.1 |
| Port | 3306 |
| Username | root |
| Password | Mật khẩu MySQL đã cài đặt |

### Bước 2: Tạo cơ sở dữ liệu

Chạy lệnh SQL trong MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS job_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

> Lệnh SQL phải được chạy trong MySQL Workbench hoặc MySQL Command Line Client, không nhập trực tiếp vào PowerShell.

### Bước 3: Tạo file `.env`

Trong Terminal tại thư mục `Backend`, chạy:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item .env.example .env
}
```

Lệnh trên chỉ tạo file `.env` khi file chưa tồn tại, tránh ghi đè cấu hình đã thiết lập.

### Bước 4: Mở đúng file `.env`

Chạy lệnh:

```powershell
notepad .env
```

File cấu hình sẽ được mở bằng Notepad.

Nội dung mặc định:

```dotenv
DATABASE_URL=mysql+pymysql://root:MAT_KHAU_MYSQL@127.0.0.1:3306/job_portal
JOB_SECRET_KEY=THAY_BANG_CHUOI_BI_MAT_NGAU_NHIEN_DAI
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourmail@gmail.com
SMTP_PASSWORD=GOOGLE_APP_PASSWORD
SMTP_FROM=yourmail@gmail.com
```

Thay `MAT_KHAU_MYSQL` bằng mật khẩu MySQL thực tế trên máy.

Ví dụ nếu mật khẩu MySQL là `123456`:

```dotenv
DATABASE_URL=mysql+pymysql://root:123456@127.0.0.1:3306/job_portal
```

Nếu tài khoản MySQL không có mật khẩu:

```dotenv
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/job_portal
```

Có thể tạo khóa JWT ngẫu nhiên bằng lệnh:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(32))"
```

Sao chép chuỗi được tạo vào giá trị `JOB_SECRET_KEY` trong file `.env`.

Sau khi chỉnh sửa, nhấn `Ctrl + S` để lưu và đóng Notepad.

### Phân biệt file `.env` và `.env.example`

| File | Chức năng |
|---|---|
| `.env.example` | File cấu hình mẫu dành cho người tải dự án |
| `.env` | File cấu hình thực tế mà Backend sử dụng |

**Quan trọng:**

- Chỉ chỉnh sửa mật khẩu MySQL trong file `.env`.
- Không chỉnh sửa nhầm file `.env.example`.
- Hai file này không tự động đồng bộ nội dung.
- Không giữ nguyên chữ `MAT_KHAU_MYSQL`.
- Không sao chép lại file mẫu nếu đã cấu hình `.env`.
- Không đưa file `.env` chứa mật khẩu thật lên GitHub.
- Nếu mật khẩu chứa ký tự đặc biệt như `@`, `#`, `%`, cần mã hóa URL trước khi đưa vào `DATABASE_URL`.
- SMTP chưa cần cấu hình nếu không kiểm thử chức năng quên mật khẩu.

### Bước 5: Kiểm tra kết nối MySQL

Chạy lệnh:

```powershell
.\.venv\Scripts\python.exe -c "from app.core.database import engine; c=engine.connect(); print('KET NOI MYSQL THANH CONG'); c.close()"
```

Nếu hiển thị:

```text
KET NOI MYSQL THANH CONG
```

Nghĩa là Backend đã kết nối thành công với MySQL.

Nếu xuất hiện lỗi, thực hiện hướng dẫn xử lý tại mục 13 trước khi tiếp tục.

---

## 5. Tạo bảng và dữ liệu kiểm thử

> Nên sử dụng database riêng để kiểm thử. Không sử dụng database chứa dữ liệu quan trọng.

### Bước 1: Tạo bảng dữ liệu

```powershell
.\.venv\Scripts\python.exe -m scripts.init_db
```

Lệnh tạo các bảng chưa tồn tại theo cấu trúc models.

### Bước 2: Tạo bảng khôi phục mật khẩu

```powershell
.\.venv\Scripts\python.exe -m scripts.setup_password_reset
```

Lệnh kiểm tra và tạo bảng phục vụ chức năng quên mật khẩu nếu chưa tồn tại.

### Bước 3: Nạp dữ liệu mẫu

```powershell
.\.venv\Scripts\python.exe -m scripts.seed_demo
```

Dữ liệu mẫu gồm tài khoản Admin, Recruiter và các tin tuyển dụng minh họa.

**Lưu ý:**

- Script không tự động xóa dữ liệu hiện có.
- Tin tuyển dụng mẫu được nạp khi bảng `jobs` đang trống.
- Tài khoản demo đã tồn tại sẽ không được tự động đổi mật khẩu.
- `init_db` không tự động cập nhật cấu trúc cột của các bảng cũ.

---

## 6. Khởi động website

### Cách 1: Chạy bằng cổng 8000 (mặc định)

Trong Terminal tại thư mục `Backend`, chạy:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Kết quả dự kiến:

```text
INFO: Uvicorn running on http://127.0.0.1:8000
INFO: Application startup complete.
```

Sau đó mở trình duyệt:

**Website:** http://127.0.0.1:8000

**Swagger API:** http://127.0.0.1:8000/docs

**Kiểm tra Backend:** http://127.0.0.1:8000/health

### Cách 2: Chạy bằng cổng 8001 (dự phòng)

Nếu cổng 8000 đang được sử dụng hoặc xuất hiện lỗi:

```text
[WinError 10013]
```

Hoặc:

```text
[WinError 10048]
```

Chạy lệnh:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

Sau đó truy cập:

**Website:** http://127.0.0.1:8001

**Swagger API:** http://127.0.0.1:8001/docs

**Kiểm tra Backend:** http://127.0.0.1:8001/health

> Không cần chỉnh sửa mã nguồn Frontend khi truy cập website trực tiếp qua FastAPI trên cổng 8001. Không sử dụng Live Server trong trường hợp này.

### Kiểm tra máy chủ

Nếu `/health` hoạt động, kết quả dự kiến:

```json
{
  "ok": true
}
```

Lưu ý `/health` chỉ xác nhận máy chủ API đang hoạt động.

Để kiểm tra API đọc dữ liệu MySQL, truy cập:

```text
http://127.0.0.1:8000/api/jobs
```

Nếu sử dụng cổng 8001:

```text
http://127.0.0.1:8001/api/jobs
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

> Mật khẩu `123456` là mật khẩu tài khoản demo, không phải mật khẩu MySQL bắt buộc.

> Tài khoản đăng ký mới nên sử dụng mật khẩu 8 ký tự để tương thích với giao diện kiểm thử hiện tại.

---

## 8. Kiểm thử Candidate – Ứng viên

### 8.1. Đăng ký tài khoản

1. Truy cập website.
2. Nhấn **Đăng ký**.
3. Nhập họ tên và email.
4. Nhập mật khẩu 8 ký tự.
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

1. Đăng nhập bằng tài khoản Candidate.
2. Mở mục **Hồ sơ & CV**.
3. Tải lên một file CV định dạng PDF.
4. Chọn một tin tuyển dụng đang mở.
5. Nhấn **Ứng tuyển**.
6. Chọn CV đã tải lên.
7. Gửi đơn ứng tuyển.
8. Kiểm tra mục **Đơn ứng tuyển**.

**Kết quả mong đợi:**

- Người chưa đăng nhập phải đăng nhập trước khi ứng tuyển.
- Đơn ứng tuyển hợp lệ được lưu vào MySQL.
- CV PDF được gửi kèm đơn ứng tuyển.
- Đơn xuất hiện trong lịch sử ứng tuyển.
- Không thể ứng tuyển trùng một tin tuyển dụng.

> CV phải có định dạng PDF hợp lệ và dung lượng không vượt quá 5 MB.

### 8.6. Hồ sơ và CV

Kiểm tra:

- Thông tin cá nhân.
- Hồ sơ & CV.
- Danh sách đơn ứng tuyển.
- Trạng thái các đơn ứng tuyển.

> CV được quản lý trên trình duyệt trước khi ứng tuyển. Khi gửi đơn ứng tuyển thành công, bản CV đính kèm được lưu trên Backend vào MySQL.

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
| 6 | Xem CV | Mở CV PDF của ứng viên |
| 7 | Cập nhật đơn | Thay đổi trạng thái phù hợp |
| 8 | Đóng tin tuyển dụng | Ngừng nhận ứng tuyển |

### Kiểm thử đăng tin tuyển dụng

1. Đăng nhập Recruiter.
2. Mở mục **Nhà tuyển dụng**.
3. Chọn **Hồ sơ doanh nghiệp** và kiểm tra tên công ty.
4. Chọn **Quản lý tin tuyển dụng**.
5. Nhập thông tin công việc.
6. Nhấn lưu tin.

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
- Tin được chuyển về trạng thái chờ duyệt.
- Chỉ Recruiter có quyền sở hữu được chỉnh sửa tin.

### Kiểm thử quản lý ứng viên

1. Đăng nhập Recruiter.
2. Mở mục **Quản lý ứng viên**.
3. Chọn đơn ứng tuyển.
4. Nhấn **Xem CV** nếu có CV đính kèm.
5. Thay đổi trạng thái đơn ứng tuyển.

**Kết quả mong đợi:**

- Hiển thị thông tin ứng viên.
- Có thể xem CV PDF.
- Trạng thái ứng tuyển được cập nhật.

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
3. Xem danh sách tin tuyển dụng chờ duyệt.
4. Thử duyệt hoặc từ chối tin.

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

> Chỉ cần cấu hình SMTP khi muốn kiểm thử chức năng quên mật khẩu. Các chức năng đăng nhập, đăng ký và tuyển dụng không yêu cầu cấu hình Gmail.

### 11.1. Cấu hình Gmail SMTP

**Bước 1:** Bật xác minh 2 bước:

https://myaccount.google.com/signinoptions/two-step-verification

**Bước 2:** Tạo mật khẩu ứng dụng Google:

https://myaccount.google.com/apppasswords

Mật khẩu ứng dụng cần được tạo từ tài khoản Gmail dùng để gửi email.

**Bước 3:** Mở file `.env`:

```powershell
notepad .env
```

Tìm và chỉnh sửa các dòng SMTP:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourmail@gmail.com
SMTP_PASSWORD=MAT_KHAU_UNG_DUNG_16_KY_TU
SMTP_FROM=yourmail@gmail.com
```

Thay email và mật khẩu ứng dụng bằng thông tin Gmail thực tế.

| Cấu hình | Ý nghĩa |
|---|---|
| SMTP_HOST | Máy chủ gửi email Gmail |
| SMTP_PORT | Cổng gửi email |
| SMTP_USER | Tài khoản Gmail gửi email |
| SMTP_PASSWORD | Mật khẩu ứng dụng Google |
| SMTP_FROM | Địa chỉ người gửi |

Nên đặt `SMTP_FROM` giống `SMTP_USER`.

Sau khi lưu file `.env`, dừng Backend bằng `Ctrl + C` và khởi động lại.

> Không sử dụng mật khẩu Gmail thông thường. Không công khai mật khẩu ứng dụng hoặc file `.env`.

### 11.2. Các bước kiểm thử

1. Mở trang đăng nhập.
2. Chọn **Quên mật khẩu**.
3. Nhập email đã đăng ký.
4. Yêu cầu gửi mã xác minh.
5. Kiểm tra Gmail và thư mục Spam.
6. Nhập mã xác minh nhận được.
7. Nhập mật khẩu mới 8 ký tự trở lên.
8. Xác nhận thay đổi.
9. Đăng nhập lại bằng mật khẩu mới.

**Kết quả mong đợi:**

- Mã xác minh gồm 6 chữ số.
- Mã có hiệu lực trong 10 phút.
- Mã sai hoặc hết hạn bị từ chối.
- Mật khẩu mới được cập nhật sau khi xác minh hợp lệ.
- Có thể đăng nhập bằng mật khẩu mới.

---

## 12. Kiểm thử API bằng Swagger

Truy cập:

http://127.0.0.1:8000/docs

Nếu sử dụng cổng dự phòng:

http://127.0.0.1:8001/docs

### Các API thường sử dụng

| Phương thức | Đường dẫn | Chức năng |
|---|---|---|
| GET | `/health` | Kiểm tra Backend |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập |
| GET | `/auth/me` | Thông tin tài khoản |
| GET | `/api/jobs` | Danh sách việc làm |
| GET | `/api/saved` | Danh sách việc đã lưu |
| POST | `/api/applications` | Nộp đơn ứng tuyển |
| GET | `/api/applications/my` | Lịch sử ứng tuyển |
| GET | `/api/jobs/mine` | Tin của Recruiter |
| GET | `/api/admin/users` | Danh sách tài khoản |
| PATCH | `/api/admin/users/{user_id}/status` | Khóa/mở khóa |
| DELETE | `/api/admin/users/{user_id}` | Xóa tài khoản |
| POST | `/auth/forgot-password` | Gửi mã khôi phục |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |

### Ví dụ đăng nhập Admin

**Phương thức:** `POST`

**Đường dẫn:**

```text
/auth/login
```

**JSON Body:**

```json
{
  "email": "admin@demo.vn",
  "password": "123456"
}
```

Kết quả đăng nhập thành công sẽ trả về `access_token`.

Các API yêu cầu xác thực cần gửi Header:

```text
Authorization: Bearer ACCESS_TOKEN
```

Có thể sử dụng Postman hoặc công cụ gửi HTTP Request để kiểm thử các API yêu cầu token.

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

---

## 13. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|---|---|---|
| 401 | Chưa đăng nhập hoặc token hết hạn | Đăng nhập lại |
| 403 | Không có quyền hoặc tài khoản bị khóa | Kiểm tra vai trò |
| 404 | Sai URL hoặc không tìm thấy dữ liệu | Kiểm tra đường dẫn |
| 405 | Sai phương thức HTTP | Kiểm tra phương thức API |
| 422 | Dữ liệu gửi không hợp lệ | Kiểm tra dữ liệu đầu vào |
| 500 | Backend hoặc MySQL gặp lỗi | Xem Terminal |
| 503 | SMTP chưa cấu hình hoặc gửi email lỗi | Kiểm tra SMTP |
| MySQL 1045 | Thông tin đăng nhập không hợp lệ | Kiểm tra `.env` |
| MySQL 1049 | Database chưa tồn tại | Tạo `job_portal` |
| MySQL 2003 | Không kết nối được máy chủ | Bật MySQL |
| MAT_KHAU_MYSQL | Chưa thay mật khẩu mẫu | Sửa `.env` |
| WinError 10013 | Windows từ chối sử dụng cổng | Thử cổng 8001 |
| WinError 10048 | Cổng đang được sử dụng | Đổi cổng hoặc dừng tiến trình cũ |
| No module named | Thiếu thư viện hoặc sai đường dẫn | Cài thư viện và kiểm tra thư mục |

### 13.1. Lỗi MySQL 1045 – Access denied

Ví dụ:

```text
Access denied for user 'root'@'localhost'
(using password: YES)
```

Kiểm tra xem MySQL Workbench có đăng nhập được bằng mật khẩu hiện tại không.

Sau đó mở file `.env` thực tế:

```powershell
notepad .env
```

Kiểm tra dòng:

```dotenv
DATABASE_URL=mysql+pymysql://root:MAT_KHAU_MYSQL@127.0.0.1:3306/job_portal
```

Thay `MAT_KHAU_MYSQL` bằng mật khẩu MySQL trên máy.

Lưu lại và chạy:

```powershell
.\.venv\Scripts\python.exe -c "from app.core.database import engine; c=engine.connect(); print('KET NOI MYSQL THANH CONG'); c.close()"
```

Không cần thay đổi mã nguồn Python chỉ vì nhập sai mật khẩu.

### 13.2. Lỗi còn sử dụng mật khẩu mẫu

Nếu xuất hiện:

```text
RuntimeError: Hay thay MAT_KHAU_MYSQL bang mat khau MySQL cua ban trong file .env.
```

Nghĩa là file `.env` đang chứa mật khẩu mẫu.

Chạy:

```powershell
notepad .env
```

Nhập đúng mật khẩu MySQL và lưu lại.

Không chỉnh sửa nhầm file `.env.example`.

### 13.3. Lỗi đọc nhầm file cấu hình

Kiểm tra các file cấu hình:

```powershell
Get-ChildItem -Force .env*
```

Kiểm tra đường dẫn dự án hiện tại:

```powershell
Get-Location
```

Kiểm tra module Backend đang được sử dụng:

```powershell
.\.venv\Scripts\python.exe -c "import app.core.database as d; print(d.__file__); print(d.engine.url.render_as_string(hide_password=True))"
```

Nếu máy có nhiều bản sao dự án, cần đảm bảo file `.env` được sửa nằm trong cùng thư mục `Backend` đang chạy.

### 13.4. Lỗi không nhận lệnh mysql

Nếu xuất hiện:

```text
mysql is not recognized
```

Có thể MySQL chưa được thêm vào PATH.

Có thể sử dụng MySQL Workbench thay cho lệnh mysql.

Hoặc với MySQL Server 8.0 được cài đặt tại đường dẫn mặc định:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h localhost -P 3306 -u root -p
```

Nhập mật khẩu MySQL khi được yêu cầu.

Nếu hiển thị:

```text
Welcome to the MySQL monitor
```

Nghĩa là đăng nhập thành công.

Nếu máy cài MySQL tại vị trí khác, thay đường dẫn bằng vị trí thực tế của `mysql.exe`.

Cảnh báo `Unknown OS character set 'cp1258'` không phải lỗi đăng nhập nếu MySQL vẫn hiển thị màn hình kết nối thành công.

### 13.5. Lỗi WinError 10013 hoặc WinError 10048

Ví dụ:

```text
ERROR: [WinError 10013]
An attempt was made to access a socket
in a way forbidden by its access permissions.
```

Nguyên nhân có thể do Windows từ chối sử dụng cổng 8000, cổng bị dành riêng hoặc đang được chương trình khác sử dụng.

**Cách khắc phục nhanh:**

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

Truy cập:

http://127.0.0.1:8001

Nếu cổng 8001 hoạt động thì có thể tiếp tục kiểm thử mà không cần sửa Frontend.

**Kiểm tra cổng 8000:**

```powershell
netstat -ano | findstr :8000
```

Kiểm tra các cổng bị Windows dành riêng:

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

Nếu có Backend cũ đang chạy, dừng Backend đó bằng `Ctrl + C`.

Không cần thay đổi mật khẩu MySQL hoặc sửa `database.py` vì lỗi cổng mạng.

### 13.6. Lỗi thiếu bảng khôi phục mật khẩu

Chạy:

```powershell
.\.venv\Scripts\python.exe -m scripts.setup_password_reset
```

### 13.7. Lỗi thiếu bảng dữ liệu

Chạy:

```powershell
.\.venv\Scripts\python.exe -m scripts.init_db
```

Nếu database đã có cấu trúc bảng từ phiên bản cũ, cần kiểm tra cấu trúc trước khi sử dụng.

Không tự ý xóa database đang chứa dữ liệu quan trọng.

### 13.8. Lỗi No module named

Đảm bảo Terminal đang ở thư mục `Backend`.

Cài lại các thư viện nếu cần:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Bản cấu trúc hiện tại sử dụng:

```python
from app.core.database import engine
```

Không sử dụng lệnh import cũ:

```python
from database import engine
```

### 13.9. Lỗi PowerShell không cho kích hoạt môi trường ảo

Không cần chạy `Activate.ps1`.

Sử dụng trực tiếp:

```powershell
.\.venv\Scripts\python.exe
```

Các lệnh trong README đã sử dụng Python từ môi trường ảo nên không cần thay đổi Execution Policy.

### 13.10. Lỗi không gửi được email

Kiểm tra:

1. Gmail đã bật xác minh 2 bước chưa.
2. Đã tạo mật khẩu ứng dụng Google chưa.
3. `SMTP_USER` có đúng địa chỉ Gmail không.
4. `SMTP_PASSWORD` có đúng mật khẩu ứng dụng không.
5. Đã lưu file `.env` chưa.
6. Đã khởi động lại Backend chưa.
7. Kiểm tra thư mục Spam của email nhận.

Nếu chưa cấu hình SMTP, vẫn có thể kiểm thử các chức năng còn lại của website.

### 13.11. Lỗi không hiển thị dữ liệu việc làm

Kiểm tra kết nối MySQL:

```powershell
.\.venv\Scripts\python.exe -c "from app.core.database import engine; c=engine.connect(); print('KET NOI MYSQL THANH CONG'); c.close()"
```

Kiểm tra đã nạp dữ liệu mẫu chưa:

```powershell
.\.venv\Scripts\python.exe -m scripts.seed_demo
```

Kiểm tra API:

http://127.0.0.1:8000/api/jobs

Nếu sử dụng cổng 8001, thay `8000` bằng `8001`.

Không mở trực tiếp file `frontend/index.html` từ File Explorer.

### 13.12. Lỗi không chạy được môi trường .venv

Nếu sao chép dự án từ máy khác, môi trường `.venv` cũ có thể không còn tương thích.

Tạo lại môi trường ảo trên máy hiện tại và cài thư viện:

```powershell
py -m venv .venv
```

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Nếu thư mục `.venv` cũ bị hỏng, có thể đổi tên thư mục đó trước khi tạo lại.

---

## 14. Cách chạy nhanh trong những lần sau

Nếu đã cài môi trường Python, cấu hình `.env` và tạo database thì không cần thực hiện lại các bước thiết lập ban đầu.

### Bước 1: Bật MySQL Server

Khởi động MySQL Server.

### Bước 2: Mở Terminal tại Backend

Nếu Terminal đang ở thư mục gốc dự án:

```powershell
cd Backend
```

Nếu đã ở `Backend` thì bỏ qua bước này.

### Bước 3: Kiểm tra kết nối MySQL nếu cần

```powershell
.\.venv\Scripts\python.exe -c "from app.core.database import engine; c=engine.connect(); print('KET NOI MYSQL THANH CONG'); c.close()"
```

### Bước 4: Chạy FastAPI

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Nếu gặp lỗi cổng 8000:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

### Bước 5: Mở website

Cổng mặc định:

http://127.0.0.1:8000

Cổng dự phòng:

http://127.0.0.1:8001

> Không cần chạy lại `init_db`, `seed_demo`, sao chép `.env.example` hoặc cài lại thư viện trong mỗi lần khởi động.

---

## 15. Lưu ý dành cho người kiểm thử

- Thực hiện các bước cài đặt theo thứ tự từ trên xuống dưới.
- Đảm bảo MySQL Server đang hoạt động.
- Chỉ chỉnh sửa thông tin cấu hình trong file `.env`.
- Không chỉnh sửa nhầm `.env.example`.
- Không đưa `.env` hoặc `.venv` lên GitHub.
- Không sử dụng database chứa dữ liệu quan trọng.
- Chỉ khóa hoặc xóa tài khoản thử nghiệm.
- Không công khai mật khẩu MySQL hoặc Gmail.
- Không cần sử dụng Live Server để chạy bản tích hợp.
- Có thể sử dụng cổng 8001 nếu cổng 8000 gặp lỗi.
- Khi thay đổi `.env`, cần khởi động lại Backend.
- Khi có lỗi, kiểm tra Console của trình duyệt và Terminal.
- Ghi lại lỗi để nhóm phát triển kiểm tra.

---

## 16. Kết luận

Sau khi hoàn thành hướng dẫn, người kiểm thử có thể:

- Chạy website JobConnect từ mã nguồn.
- Kết nối Backend với MySQL.
- Tạo bảng và dữ liệu kiểm thử.
- Đăng ký và đăng nhập tài khoản.
- Kiểm thử chức năng Candidate.
- Kiểm thử chức năng Recruiter.
- Kiểm thử chức năng Admin.
- Kiểm thử ứng tuyển và xem CV PDF.
- Kiểm thử chức năng quên mật khẩu qua Gmail SMTP.
- Kiểm thử API bằng Swagger.
- Xử lý các lỗi cấu hình và kết nối thường gặp.

---

**JobConnect © 2026 – Kết nối tài năng, mở lối tương lai.**
