"""Chạy một lần sau khi tạo database rỗng. Không xóa dữ liệu có sẵn."""
from app.core.database import Base,engine
from app.models import entities as models
Base.metadata.create_all(bind=engine)
print('Đã kiểm tra/tạo các bảng theo models.py. Với bảng cũ, create_all KHÔNG tự nâng cấp cột.')
