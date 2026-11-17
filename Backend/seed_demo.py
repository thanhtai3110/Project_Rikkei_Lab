"""Tạo tài khoản demo cố định; chỉ dùng khi phát triển trên localhost."""
from database import SessionLocal
from models import User,Job
from pathlib import Path
import json
from sqlalchemy import select
import bcrypt

def seed():
    with SessionLocal() as db:
        for email,name,role in [('admin@demo.vn','Admin Demo','admin'),('recruiter@demo.vn','Nhà tuyển dụng Demo','recruiter')]:
            user=db.execute(select(User).where(User.email==email)).scalar_one_or_none()
            if not user:
                user=User(email=email,full_name=name,role=role,password=bcrypt.hashpw(b'123456',bcrypt.gensalt()).decode(),status='active')
                if role=='recruiter':user.company_name='TechNova Studio'
                db.add(user)
        db.commit()
    with SessionLocal() as db:
        if not db.execute(select(Job.job_id).limit(1)).first():
            recruiter=db.execute(select(User).where(User.email=='recruiter@demo.vn')).scalar_one()
            sample=json.loads(Path(__file__).with_name('demo_jobs.json').read_text(encoding='utf-8'))
            for item in sample:
                db.add(Job(recruiter_id=recruiter.user_id,title=item['title'],company=item['company'],location=item['location'],job_type=item['type'],skills=item['skills'],min_salary=item['min'],max_salary=item['max'],description='Tin tuyển dụng minh họa phục vụ kiểm tra JobConnect.',open=bool(item.get('open')),status='approved' if item.get('open') else 'closed'))
            db.commit()
            print('Đã nạp',len(sample),'tin tuyển dụng demo (chỉ khi bảng jobs rỗng).')
    print('Đã bảo đảm tồn tại admin@demo.vn và recruiter@demo.vn (mật khẩu 123456 cho tài khoản mới).')

if __name__=='__main__':seed()
