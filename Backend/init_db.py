"""Chạy một lần sau khi tạo database rỗng. Không xóa dữ liệu có sẵn."""
from database import Base,engine
import models
Base.metadata.create_all(bind=engine)
print('Đã kiểm tra/tạo các bảng theo models.py. Với bảng cũ, create_all KHÔNG tự nâng cấp cột.')
