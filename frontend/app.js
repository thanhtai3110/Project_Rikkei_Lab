'use strict';
const $ = s => document.querySelector(s);
const statuses = { submitted: 'Đã nộp', reviewing: 'Đang xem xét', interviewed: 'Đã phỏng vấn', accepted: 'Được chấp nhận', rejected: 'Bị từ chối', withdrawn: 'Đã rút' };
const jobs = [
    {
        id: 1,
        title: 'Frontend Developer (ReactJS)',
        company: 'TechNova Studio',
        location: 'Hà Nội',
        type: 'Toàn thời gian',
        min: 18,
        max: 30,
        skills: ['React', 'JavaScript', 'Tailwind'],
        date: '2026-11-03',
        open: true
    },
    {
        id: 2,
        title: 'UI/UX Designer',
        company: 'Pixel & Co.',
        location: 'TP. Hồ Chí Minh',
        type: 'Toàn thời gian',
        min: 15,
        max: 25,
        skills: ['Figma', 'UI/UX', 'Design System'],
        date: '2026-11-02',
        open: true
    },
    {
        id: 3,
        title: 'Digital Marketing Executive',
        company: 'Green Growth',
        location: 'Đà Nẵng',
        type: 'Toàn thời gian',
        min: 12,
        max: 20,
        skills: ['SEO', 'Content', 'Analytics'],
        date: '2026-11-01',
        open: true
    },
    {
        id: 4,
        title: 'Backend Developer (Node.js)',
        company: 'CloudBase',
        location: 'Hà Nội',
        type: 'Toàn thời gian',
        min: 25,
        max: 40,
        skills: ['Node.js', 'MySQL', 'REST API'],
        date: '2026-10-31',
        open: true
    },
    {
        id: 5,
        title: 'Frontend Intern',
        company: 'TechNova Studio',
        location: 'Hà Nội',
        type: 'Thực tập',
        min: 3,
        max: 6,
        skills: ['HTML', 'CSS', 'JavaScript'],
        date: '2026-10-30',
        open: true
    },
    {
        id: 6,
        title: 'Content Designer',
        company: 'Monday Creative',
        location: 'TP. Hồ Chí Minh',
        type: 'Bán thời gian',
        min: 7,
        max: 12,
        skills: ['Content', 'Canva', 'Social'],
        date: '2026-10-29',
        open: false
    }
];
// Các tin mẫu bổ sung để thử giao diện; không phải tin tuyển dụng thật.
jobs.push(...[
  {
    "id": 7,
    "title": "Chuyên viên Phân tích dữ liệu",
    "company": "DataBridge Lab",
    "location": "Hà Nội",
    "type": "Toàn thời gian",
    "min": 18,
    "max": 32,
    "skills": [
      "SQL",
      "Power BI",
      "Python"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 8,
    "title": "Nhân viên Kế toán tổng hợp",
    "company": "Minh An Finance",
    "location": "TP. Hồ Chí Minh",
    "type": "Toàn thời gian",
    "min": 12,
    "max": 20,
    "skills": [
      "Kế toán",
      "Excel",
      "MISA"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  },
  {
    "id": 9,
    "title": "Nhân viên Chăm sóc khách hàng",
    "company": "Sunrise Service",
    "location": "Cần Thơ",
    "type": "Toàn thời gian",
    "min": 8,
    "max": 13,
    "skills": [
      "Giao tiếp",
      "CSKH",
      "CRM"
    ],
    "date": "2026-11-01",
    "open": true,
    "status": "approved"
  },
  {
    "id": 10,
    "title": "Chuyên viên Tuyển dụng",
    "company": "PeopleFirst HR",
    "location": "Hải Phòng",
    "type": "Toàn thời gian",
    "min": 11,
    "max": 18,
    "skills": [
      "Nhân sự",
      "Tuyển dụng",
      "Phỏng vấn"
    ],
    "date": "2026-11-05",
    "open": true,
    "status": "approved"
  },
  {
    "id": 11,
    "title": "Lập trình viên Java",
    "company": "BluePeak Software",
    "location": "Đà Nẵng",
    "type": "Toàn thời gian",
    "min": 20,
    "max": 35,
    "skills": [
      "Java",
      "Spring Boot",
      "SQL"
    ],
    "date": "2026-11-04",
    "open": true,
    "status": "approved"
  },
  {
    "id": 12,
    "title": "Thực tập sinh Marketing",
    "company": "BrightWave Media",
    "location": "Huế",
    "type": "Thực tập",
    "min": 3,
    "max": 6,
    "skills": [
      "Marketing",
      "Content",
      "Canva"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 13,
    "title": "Thiết kế đồ họa",
    "company": "ColorNest Studio",
    "location": "Nha Trang",
    "type": "Toàn thời gian",
    "min": 10,
    "max": 17,
    "skills": [
      "Photoshop",
      "Illustrator",
      "Branding"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  },
  {
    "id": 14,
    "title": "Nhân viên Kinh doanh B2B",
    "company": "OceanBiz",
    "location": "Bình Dương",
    "type": "Toàn thời gian",
    "min": 12,
    "max": 25,
    "skills": [
      "Bán hàng",
      "B2B",
      "Đàm phán"
    ],
    "date": "2026-11-01",
    "open": true,
    "status": "approved"
  },
  {
    "id": 15,
    "title": "Chuyên viên Digital Marketing",
    "company": "Northstar Digital",
    "location": "Hà Nội",
    "type": "Toàn thời gian",
    "min": 15,
    "max": 24,
    "skills": [
      "SEO",
      "Ads",
      "Analytics"
    ],
    "date": "2026-11-05",
    "open": true,
    "status": "approved"
  },
  {
    "id": 16,
    "title": "Kỹ sư Kiểm thử phần mềm",
    "company": "QualityWorks",
    "location": "TP. Hồ Chí Minh",
    "type": "Toàn thời gian",
    "min": 14,
    "max": 23,
    "skills": [
      "Testing",
      "Postman",
      "Test Case"
    ],
    "date": "2026-11-04",
    "open": true,
    "status": "approved"
  },
  {
    "id": 17,
    "title": "Nhân viên Hành chính nhân sự",
    "company": "GreenOffice",
    "location": "Đồng Nai",
    "type": "Toàn thời gian",
    "min": 9,
    "max": 15,
    "skills": [
      "Hành chính",
      "Nhân sự",
      "Excel"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 18,
    "title": "Biên tập viên Nội dung",
    "company": "StoryHouse",
    "location": "Đà Lạt",
    "type": "Bán thời gian",
    "min": 6,
    "max": 12,
    "skills": [
      "Content",
      "SEO",
      "Biên tập"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  },
  {
    "id": 19,
    "title": "Chuyên viên Logistics",
    "company": "CargoLink",
    "location": "Hải Phòng",
    "type": "Toàn thời gian",
    "min": 13,
    "max": 21,
    "skills": [
      "Logistics",
      "Xuất nhập khẩu",
      "Excel"
    ],
    "date": "2026-11-01",
    "open": true,
    "status": "approved"
  },
  {
    "id": 20,
    "title": "Nhân viên Bán hàng",
    "company": "RetailOne",
    "location": "Bắc Ninh",
    "type": "Toàn thời gian",
    "min": 8,
    "max": 14,
    "skills": [
      "Bán hàng",
      "Tư vấn",
      "POS"
    ],
    "date": "2026-11-05",
    "open": true,
    "status": "approved"
  },
  {
    "id": 21,
    "title": "Kỹ sư DevOps",
    "company": "CloudOrbit",
    "location": "Thái Nguyên",
    "type": "Toàn thời gian",
    "min": 28,
    "max": 48,
    "skills": [
      "Linux",
      "Docker",
      "CI/CD"
    ],
    "date": "2026-11-04",
    "open": true,
    "status": "approved"
  },
  {
    "id": 22,
    "title": "Giáo viên Tiếng Anh",
    "company": "EduSpring",
    "location": "Đà Nẵng",
    "type": "Bán thời gian",
    "min": 8,
    "max": 16,
    "skills": [
      "Tiếng Anh",
      "Giảng dạy",
      "IELTS"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 23,
    "title": "Chuyên viên Tài chính",
    "company": "FinVista",
    "location": "Hà Nội",
    "type": "Toàn thời gian",
    "min": 18,
    "max": 30,
    "skills": [
      "Tài chính",
      "Phân tích",
      "Excel"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  },
  {
    "id": 24,
    "title": "Kỹ thuật viên IT Helpdesk",
    "company": "TechCare",
    "location": "Vũng Tàu",
    "type": "Toàn thời gian",
    "min": 9,
    "max": 15,
    "skills": [
      "IT Support",
      "Windows",
      "Networking"
    ],
    "date": "2026-11-01",
    "open": true,
    "status": "approved"
  },
  {
    "id": 25,
    "title": "Lập trình viên Mobile Flutter",
    "company": "AppNova",
    "location": "TP. Hồ Chí Minh",
    "type": "Toàn thời gian",
    "min": 19,
    "max": 34,
    "skills": [
      "Flutter",
      "Dart",
      "API"
    ],
    "date": "2026-11-05",
    "open": true,
    "status": "approved"
  },
  {
    "id": 26,
    "title": "Chuyên viên Thương mại điện tử",
    "company": "ShopGrowth",
    "location": "Cần Thơ",
    "type": "Toàn thời gian",
    "min": 12,
    "max": 22,
    "skills": [
      "E-commerce",
      "Shopee",
      "TikTok Shop"
    ],
    "date": "2026-11-04",
    "open": true,
    "status": "approved"
  },
  {
    "id": 27,
    "title": "Nhân viên Lễ tân",
    "company": "Skyline Hotel",
    "location": "Phú Quốc",
    "type": "Toàn thời gian",
    "min": 7,
    "max": 12,
    "skills": [
      "Lễ tân",
      "Giao tiếp",
      "Tiếng Anh"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 28,
    "title": "Chuyên viên Pháp chế",
    "company": "LegalPath",
    "location": "Hà Nội",
    "type": "Toàn thời gian",
    "min": 16,
    "max": 26,
    "skills": [
      "Luật",
      "Hợp đồng",
      "Pháp chế"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  },
  {
    "id": 29,
    "title": "Kỹ sư Cơ khí",
    "company": "MechaPro",
    "location": "Bình Dương",
    "type": "Toàn thời gian",
    "min": 14,
    "max": 24,
    "skills": [
      "AutoCAD",
      "Cơ khí",
      "Sản xuất"
    ],
    "date": "2026-11-01",
    "open": true,
    "status": "approved"
  },
  {
    "id": 30,
    "title": "Nhân viên Thiết kế Nội thất",
    "company": "HomeCraft",
    "location": "Đà Nẵng",
    "type": "Toàn thời gian",
    "min": 12,
    "max": 22,
    "skills": [
      "SketchUp",
      "3Ds Max",
      "Thiết kế"
    ],
    "date": "2026-11-05",
    "open": true,
    "status": "approved"
  },
  {
    "id": 31,
    "title": "Chuyên viên Phân tích nghiệp vụ",
    "company": "ProductWise",
    "location": "Hải Dương",
    "type": "Toàn thời gian",
    "min": 22,
    "max": 36,
    "skills": [
      "Business Analyst",
      "UML",
      "Agile"
    ],
    "date": "2026-11-04",
    "open": true,
    "status": "approved"
  },
  {
    "id": 32,
    "title": "Thực tập sinh Frontend",
    "company": "PixelStack",
    "location": "Hà Nội",
    "type": "Thực tập",
    "min": 4,
    "max": 7,
    "skills": [
      "HTML",
      "CSS",
      "JavaScript"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 33,
    "title": "Quản lý Cửa hàng",
    "company": "MarketSquare",
    "location": "Biên Hòa",
    "type": "Toàn thời gian",
    "min": 11,
    "max": 19,
    "skills": [
      "Quản lý",
      "Bán lẻ",
      "Vận hành"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  },
  {
    "id": 34,
    "title": "Kỹ sư Xây dựng",
    "company": "BuildCore",
    "location": "Quảng Ninh",
    "type": "Toàn thời gian",
    "min": 15,
    "max": 27,
    "skills": [
      "Xây dựng",
      "AutoCAD",
      "Giám sát"
    ],
    "date": "2026-11-01",
    "open": true,
    "status": "approved"
  },
  {
    "id": 35,
    "title": "Nhân viên Điều dưỡng",
    "company": "CarePlus Clinic",
    "location": "Nghệ An",
    "type": "Toàn thời gian",
    "min": 10,
    "max": 17,
    "skills": [
      "Điều dưỡng",
      "Chăm sóc",
      "Y tế"
    ],
    "date": "2026-11-05",
    "open": true,
    "status": "approved"
  },
  {
    "id": 36,
    "title": "Chuyên viên Quan hệ khách hàng",
    "company": "TrustBank Demo",
    "location": "Long An",
    "type": "Toàn thời gian",
    "min": 12,
    "max": 21,
    "skills": [
      "Ngân hàng",
      "CSKH",
      "Tư vấn"
    ],
    "date": "2026-11-04",
    "open": true,
    "status": "approved"
  },
  {
    "id": 37,
    "title": "Chuyên viên Thiết kế UX",
    "company": "UXCraft",
    "location": "TP. Hồ Chí Minh",
    "type": "Toàn thời gian",
    "min": 17,
    "max": 29,
    "skills": [
      "Figma",
      "UX Research",
      "Prototype"
    ],
    "date": "2026-11-03",
    "open": true,
    "status": "approved"
  },
  {
    "id": 38,
    "title": "Data Engineer",
    "company": "VectorCloud",
    "location": "Bình Định",
    "type": "Toàn thời gian",
    "min": 27,
    "max": 45,
    "skills": [
      "Python",
      "ETL",
      "SQL"
    ],
    "date": "2026-11-02",
    "open": true,
    "status": "approved"
  }
]);
// Phiên xác thực do Backend Python cấp, không dùng tài khoản giả trong localStorage.
const key = 'jobconnect-server-ui-v1';
let state = {user:null, accounts:[]};
let page = 'jobs', applyId = null, cvs = [], db;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function persist() { /* Backend MySQL là nguồn dữ liệu chính; không lưu mật khẩu trên trình duyệt. */ }
function account() {
    return state.accounts.find(a => a.email === state.user?.email)
}
function candidate(loginMessage) {
    if (!state.user || !account()) {
        if (state.user) {
            state.user = null;
            persist();
        }
        if (loginMessage) {
            authMode('login');
            authFeedback(loginMessage, false);
        }
        $('#authDialog').showModal();
        return false;
    }
    if (state.user.role !== 'Candidate') {
        toast('Tính năng dành cho ứng viên. Hãy đăng xuất và chọn vai trò Ứng viên.');
        return false
    }
    return true
}
let toastTimer;
// Thông báo xuất hiện ngay tại hộp thoại đang thao tác; nếu không có dialog thì hiển thị trên trang.
function toast(message, kind) {
    const success = kind === 'success' || (!kind && /^(Đã |Đăng (ký|nhập) thành công|Lưu |Cập nhật |Tạo |Gửi )/i.test(message));
    const activeDialog = [...document.querySelectorAll('dialog[open]')].at(-1);
    const globalToast = $('#toast');
    clearTimeout(toastTimer);
    globalToast.style.display = 'none';
    // Thông báo ở biểu mẫu đăng ký/đăng nhập không bị backdrop che khuất.
    if (activeDialog?.id === 'authDialog') {
        authFeedback(message, success);
        activeDialog.scrollTop = 0;
        return;
    }
    if (activeDialog) {
        let note = activeDialog.querySelector('.dialog-feedback');
        if (!note) {
            note = document.createElement('div');
            note.className = 'dialog-feedback';
            note.setAttribute('role', 'status');
            note.setAttribute('aria-live', 'polite');
            const anchor = activeDialog.querySelector('form h2, h2, form, .close');
            if (anchor?.tagName === 'H2') anchor.insertAdjacentElement('afterend', note);
            else if (anchor?.tagName === 'FORM') anchor.prepend(note);
            else activeDialog.prepend(note);
        }
        note.textContent = (success ? '✓  ' : '⚠  ') + message;
        note.className = 'dialog-feedback ' + (success ? 'is-success' : 'is-error');
        activeDialog.scrollTop = 0;
        return;
    }
    globalToast.textContent = (success ? '✓  ' : '⚠  ') + message;
    globalToast.className = success ? 'toast-success' : 'toast-error';
    globalToast.style.display = 'block';
    toastTimer = setTimeout(() => { globalToast.style.display = 'none'; }, 4000);
}
function authFeedback(message, success = true) {
    const el = $('#authFeedback');
    el.textContent = message ? (success ? '✓  ' : '⚠  ') + message : '';
    el.className = 'auth-feedback ' + (success ? 'is-success' : 'is-error');
    el.hidden = !message;
    if (message) $('#authDialog').scrollTop = 0;
}
function empty(s) {
    return `<div class="empty">${esc(s)}</div>`
}
function changePage(p) {
    if (p !== 'jobs' && !candidate()) return;
    if (typeof routeTo === 'function') {
        routeTo({jobs:'#/jobs',saved:'#/saved',applications:'#/candidate/applications',cv:'#/candidate/cv'}[p] || '#/jobs');
        return;
    }
    page = p;
    render();
    $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function render() {
    const a = account();
    const loggedIn = Boolean(state.user);
    $('#account').hidden = loggedIn;
    $('#registerButton').hidden = loggedIn;
    $('#userMenu').hidden = !loggedIn;
    if (loggedIn) {
        const displayName = String(a?.name || state.user.name || state.user.email.split('@')[0]).trim();
        $('#userName').textContent = displayName;
        $('#userName').title = displayName;
        $('#userAvatar').textContent = displayName.charAt(0).toLocaleUpperCase('vi');
        $('#userRole').textContent = {Candidate:'Ứng viên', Recruiter:'Nhà tuyển dụng', Admin:'Quản trị viên'}[state.user.role] || 'Tài khoản';
        $('#userProfile').setAttribute('aria-label', 'Mở trang tài khoản: ' + displayName);
    }
    $('#savedCount').textContent = a?.saved?.length || 0;
    document.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $('#hero').hidden = page !== 'jobs';
    $('#jobsView').hidden = !['jobs', 'saved'].includes(page);
    $('#applicationsView').hidden = page !== 'applications';
    $('#cvView').hidden = page !== 'cv';
    $('#pageTitle').textContent = { jobs: 'Việc làm mới nhất', saved: 'Việc làm đã lưu', applications: 'Theo dõi đơn ứng tuyển', cv: 'Hồ sơ & CV' }[page];
    $('#resultCount').textContent = '';
    if (['jobs', 'saved'].includes(page)) renderJobs();
    if (page === 'applications') renderApplications();
    if (page === 'cv') renderCV()
}
const companyLogos = {
  "TechNova Studio": "images/companies/f133adae63.svg",
  "Pixel & Co.": "images/companies/c0f2da66a6.svg",
  "Green Growth": "images/companies/72d8b149ad.svg",
  "CloudBase": "images/companies/cd3888f8ca.svg",
  "Monday Creative": "images/companies/12e1160ce5.svg",
  "AppNova": "images/companies/95915416dd.svg",
  "BluePeak Software": "images/companies/95d1d0a748.svg",
  "BrightWave Media": "images/companies/e8cacec689.svg",
  "BuildCore": "images/companies/9551225b5c.svg",
  "CarePlus Clinic": "images/companies/2ca25f9b26.svg",
  "CargoLink": "images/companies/bfb2db6c16.svg",
  "CloudOrbit": "images/companies/e640b17e1d.svg",
  "ColorNest Studio": "images/companies/d248c69d81.svg",
  "DataBridge Lab": "images/companies/f2483f4d02.svg",
  "EduSpring": "images/companies/9df2c58e53.svg",
  "FinVista": "images/companies/2ba0060d8a.svg",
  "GreenOffice": "images/companies/a6b608f2f6.svg",
  "HomeCraft": "images/companies/8139dfd38d.svg",
  "LegalPath": "images/companies/b989fddf92.svg",
  "MarketSquare": "images/companies/0f9cd8ab35.svg",
  "MechaPro": "images/companies/a4d5a3b0f7.svg",
  "Minh An Finance": "images/companies/402b516a96.svg",
  "Northstar Digital": "images/companies/62a82c80d8.svg",
  "OceanBiz": "images/companies/a6ea7d6463.svg",
  "PeopleFirst HR": "images/companies/2b109477ea.svg",
  "PixelStack": "images/companies/74b51f3efc.svg",
  "ProductWise": "images/companies/d4beca3562.svg",
  "QualityWorks": "images/companies/2055e33ff3.svg",
  "RetailOne": "images/companies/64eb88b271.svg",
  "ShopGrowth": "images/companies/738ddd3782.svg",
  "Skyline Hotel": "images/companies/8c39d975da.svg",
  "StoryHouse": "images/companies/dfc0723319.svg",
  "Sunrise Service": "images/companies/2605c9cf94.svg",
  "TechCare": "images/companies/45d5f6b2c9.svg",
  "TrustBank Demo": "images/companies/c1089981b6.svg",
  "UXCraft": "images/companies/2b0be952cb.svg",
  "VectorCloud": "images/companies/ac4025e2fd.svg"
};
const companyLogo = company => companyLogos[company] || "images/companies/default.svg";
function renderJobs() {
    const start = performance.now(), q = $('#keyword').value.trim().toLocaleLowerCase('vi');
    let list = jobs.filter(j => j.open && j.status !== 'pending' && j.status !== 'rejected' && (page !== 'saved' || account()?.saved.includes(j.id)) && [j.title, j.company, ...j.skills].join(' ').toLocaleLowerCase('vi').includes(q) && (!$('#location').value || j.location === $('#location').value) && (!$('#type').value || j.type === $('#type').value) && j.min >= Number($('#salary').value || 0));
    list.sort((a, b) => $('#sort').value === 'salary' ? b.max - a.max : b.date.localeCompare(a.date));
    $('#jobList').innerHTML = list.map(j => `<article class="card"><div class="logo" aria-hidden="true"><span class="company-initial">${esc(String(j.company || "?").trim().charAt(0).toLocaleUpperCase("vi"))}</span></div><div class="card-body"><h3>${esc(j.title)}</h3><div class="company">${esc(j.company)} · ${j.location}</div><div class="tags"><span class="tag salary">${j.min}–${j.max} triệu</span><span class="tag">${j.type}</span>${j.skills.map(s => `<span class="tag">${s}</span>`).join('')}</div><div class="card-bottom"><small>${j.open ? 'Đang tuyển' : 'Đã đóng'} · ${j.date}</small><button data-detail="${j.id}">Xem chi tiết →</button></div></div><button class="save" data-save="${j.id}" aria-label="${account()?.saved.includes(j.id) ? 'Bỏ lưu' : 'Lưu'} ${esc(j.title)}" aria-pressed="${!!account()?.saved.includes(j.id)}">${account()?.saved.includes(j.id) ? '♥' : '♡'}</button></article>`).join('') || empty('Chưa có việc làm phù hợp với bộ lọc.');
    $('#resultCount').textContent = `${list.length} công việc · Lọc cục bộ ${Math.ceil(performance.now() - start)} ms`
}
async function toggleSave(id) {
  if(!candidate())return;
  try{
    const saved=account()?.saved?.includes(id);
    await JobAPI.request('/api/saved/'+id,{method:saved?'DELETE':'POST'});
    await JobAPI.refresh(); render();
  }catch(err){toast(err.message);}
}
function details(id) {
    const j = jobs.find(j => j.id === id);
    if (!j) return;
    const applied = account()?.applications.some(a => a.jobId === id);
    $('#detailBody').innerHTML = `<span class="eyebrow">${esc(j.company)}</span><h2>${esc(j.title)}</h2><p>${j.location} · ${j.type} · ${j.min}–${j.max} triệu/tháng</p><h3>Mô tả công việc</h3><p>Tham gia xây dựng và phát triển sản phẩm, phối hợp với các thành viên trong nhóm để mang lại trải nghiệm tốt cho khách hàng.</p><h3>Yêu cầu</h3><p>Nắm vững ${j.skills.join(', ')}. Chủ động học hỏi, có tinh thần trách nhiệm và khả năng làm việc nhóm.</p><h3>Quyền lợi</h3><p>Môi trường cởi mở, cơ hội phát triển và thu nhập theo năng lực.</p><p class="muted">Tin tuyển dụng và nội dung mô tả là dữ liệu mẫu.</p><button class="primary" data-apply="${id}" ${!j.open || applied ? 'disabled' : ''}>${applied ? 'Bạn đã ứng tuyển' : j.open ? 'Ứng tuyển ngay' : 'Tin đã đóng'}</button>`;
    $('#detailDialog').showModal()
}
const applyLoginMessage = 'Bạn cần đăng nhập để ứng tuyển.';
async function startApply(id) {
    if (!candidate(applyLoginMessage)) return;
    const j = jobs.find(j => j.id === id);
    if (!j?.open) return toast('Tin tuyển dụng đã đóng.');
    if (account().applications.some(a => a.jobId === id)) return toast('Mỗi tin chỉ được ứng tuyển một lần, kể cả sau khi rút đơn.');
    await loadCV();
    if (!cvs.length) {
        $('#detailDialog').close();
        changePage('cv');
        return toast('Bạn cần tải lên CV PDF trước khi ứng tuyển.')
    }
    applyId = id;
    $('#detailDialog').close();
    $('#applyTitle').textContent = j.title + ' · ' + j.company;
    $('#cvSelect').innerHTML = cvs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    $('#letter').value = '';
    $('#applyDialog').showModal()
}
function renderApplications() {
    const list = (account()?.applications || []).filter(a => !$('#statusFilter').value || a.status === $('#statusFilter').value);
    $('#resultCount').textContent = `${list.length} đơn ứng tuyển`;
    $('#applicationList').innerHTML = list.map(a => {
        const j = jobs.find(j => j.id === a.jobId);
        return `<article class="card"><div class="card-body"><h3>${esc(j?.title || 'Tin đã đóng hoặc không còn công khai')}</h3><p class="company">${esc(j?.company || 'Doanh nghiệp')} · ${new Date(a.date).toLocaleDateString('vi-VN')}</p><span class="status ${a.status}">${statuses[a.status]} (${a.status})</span><p class="muted">CV: ${esc(a.cvName)}</p>${['submitted', 'reviewing', 'interviewed'].includes(a.status) ? `<button data-withdraw="${a.jobId}">Rút đơn ứng tuyển</button>` : ''}</div></article>`
    }).join('') || empty('Chưa có đơn ứng tuyển ở trạng thái này.')
}
async function withdraw(id) {
  if(!candidate())return;
  const a=account()?.applications?.find(a=>a.jobId===id);
  if(!a||!a.id)return toast('Không tìm được đơn ứng tuyển này.');
  if(!confirm('Bạn muốn rút đơn? Bạn sẽ không thể ứng tuyển lại tin này.'))return;
  try{
    await JobAPI.request('/api/applications/'+a.id+'/withdraw',{method:'PATCH'});
    await JobAPI.refresh();render();toast('Rút đơn thành công.','success');
  }catch(err){toast(err.message);}
}
const ready = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
        reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
        return;
    }
    let req;
    try {
        req = indexedDB.open('jobconnect-cvs', 1);
    } catch (error) {
        reject(error);
        return;
    }
    req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('cvs')) {
            req.result.createObjectStore('cvs', { keyPath: 'id' });
        }
    };
    req.onsuccess = () => {
        db = req.result;
        resolve()
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Cơ sở dữ liệu CV đang bị khóa'));
});
ready.catch(() => toast('Không thể mở kho CV trên trình duyệt.'));
async function cvStore(mode, action) {
    await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cvs', mode);
        const r = action(tx.objectStore('cvs'));
        tx.oncomplete = () => resolve(r.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error)
    })
}
async function loadCV() {
    const all = await cvStore('readonly', s => s.getAll());
    cvs = all.filter(c => c.owner === state.user?.email)
}
async function renderCV() {
    try {
        await loadCV();
        $('#cvList').innerHTML = cvs.map(c => `<div class="cv-row"><span>▤ ${esc(c.name)} <small>(${(c.size / 1024).toFixed(0)} KB)</small></span><button data-preview="${c.id}">Xem PDF</button><button data-delete="${c.id}">Xóa</button></div>`).join('') || empty('Bạn chưa tải lên CV nào.')
    } catch {
        toast('Không thể đọc CV trong trình duyệt.')
    }
}
$('#cvInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f || !candidate()) return;
    if (!/\.pdf$/i.test(f.name) || f.type !== 'application/pdf') return toast('Chỉ chấp nhận file PDF.');
    if (!f.size || f.size > 5 * 1024 * 1024) return toast('File phải lớn hơn 0 và không vượt quá 5 MB.');
    try {
        const signature = new TextDecoder().decode(await f.slice(0, 5).arrayBuffer());
        if (signature !== '%PDF-') return toast('Nội dung file không có chữ ký PDF hợp lệ.');
        const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : `cv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await cvStore('readwrite', s => s.put({
            id,
            owner: state.user.email,
            name: f.name,
            size: f.size,
            blob: f
        }));
        await renderCV();
        toast('Tải CV PDF thành công!', 'success')
    } catch {
        toast('Không thể lưu CV. Kiểm tra quyền hoặc dung lượng trình duyệt.')
    }
});
$('#applyForm').addEventListener('submit', async e => {
 e.preventDefault();if(!candidate(applyLoginMessage))return;
 await loadCV();const cv=cvs.find(c=>c.id===$('#cvSelect').value);
 if(!cv)return toast('Vui lòng chọn CV PDF.');
 try{
   await JobAPI.request('/api/applications',{method:'POST',body:{job_id:applyId}});
   await JobAPI.refresh();$('#applyDialog').close();changePage('applications');
   toast('Nộp đơn thành công! CV vẫn đang lưu cục bộ trong trình duyệt.','success');
 }catch(err){toast(err.message);}
});
// Xác thực qua Python API, không tạo tài khoản demo tại trình duyệt.
const authDialog = $('#authDialog');
const authForm = $('#authForm');
const authFields = ['name', 'email', 'password', 'confirmPassword'].map(id => $('#' + id));

function authFieldError(field, message) {
  const errorId = field.id + 'Error';
  let error = document.getElementById(errorId);
  if (!message && !error) return;
  if (!error) {
    error = document.createElement('span');
    error.id = errorId;
    error.className = 'auth-field-error';
    (field.closest('.password-wrap') || field).after(error);
  }
  error.textContent = message;
  error.hidden = !message;
  if (message) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);
  } else {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
}

function validateAuthField(field) {
  if (!field.required) return '';
  const value = field.id === 'name' || field.id === 'email' ? field.value.trim() : field.value;
  if (!value) return 'Vui lòng nhập vào ô này.';
  if (field.validity.typeMismatch) return 'Vui lòng nhập email hợp lệ.';
  if (field.id === 'name' && value.length < 2) return 'Họ tên phải có ít nhất 2 ký tự.';
  if (field.minLength === 8 && value.length !== 8) return 'Mật khẩu phải đúng 8 ký tự.';
  if (field.id === 'confirmPassword' && value !== $('#password').value) return 'Xác nhận mật khẩu không khớp.';
  return '';
}

authForm.addEventListener('input', e => {
  if (e.target.hasAttribute('aria-invalid')) authFieldError(e.target, validateAuthField(e.target));
  const confirmation = $('#confirmPassword');
  if (e.target.id === 'password' && confirmation.hasAttribute('aria-invalid')) {
    authFieldError(confirmation, validateAuthField(confirmation));
  }
});

function authMode(mode='login') {
  authFeedback('');
  authFields.forEach(field => authFieldError(field, ''));
  $('#authMode').value = mode;
  $('#authHeading').textContent = mode === 'register' ? 'Tạo tài khoản' : 'Chào mừng trở lại';
  $('#nameField').hidden = mode !== 'register';
  $('#confirmField').hidden = mode !== 'register';
  $('#name').required = mode === 'register';
  $('#confirmPassword').required = mode === 'register';
  $('#submitAuth').textContent = mode === 'register' ? 'Đăng ký' : 'Đăng nhập';
  $('#authSwitch').textContent = mode === 'register' ? 'Đăng nhập' : 'Đăng ký ngay';
  $('#authSwitch').parentElement.firstChild.textContent = mode === 'register' ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? ';
  $('#authSubtitle').textContent = mode === 'register' ? 'Tạo tài khoản để bắt đầu hành trình nghề nghiệp.' : 'Đăng nhập để quản lý hồ sơ và việc làm của bạn.';
  $('#authRoleNotice').hidden = mode !== 'register';
  $('#password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  // Chỉ giới hạn đúng 8 ký tự khi ĐĂNG KÝ; đăng nhập vẫn chấp nhận mật khẩu của tài khoản cũ.
  for (const id of ['password', 'confirmPassword']) {
    const field = document.getElementById(id);
    if (mode === 'register') {
      field.minLength = 8;
      field.maxLength = 8;
      field.placeholder = 'Đúng 8 ký tự';
    } else {
      field.removeAttribute('minlength');
      field.removeAttribute('maxlength');
      field.placeholder = id === 'password' ? 'Nhập mật khẩu' : 'Nhập lại mật khẩu';
    }
  }
  for (const id of ['password','confirmPassword']) {const input=document.getElementById(id),button=document.querySelector(`[data-toggle-password="${id}"]`);input.type='password';button.setAttribute('aria-label','Hiện mật khẩu');button.setAttribute('aria-pressed','false');button.classList.remove('is-visible');}
}
$('#authSwitch').onclick = () => authMode($('#authMode').value === 'login' ? 'register' : 'login');
authForm.addEventListener('submit', async e => {
  e.preventDefault();
  authFeedback('');
  let firstInvalid;
  for (const field of authFields) {
    const message = validateAuthField(field);
    authFieldError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  const email=$('#email').value.trim().toLowerCase(), password=$('#password').value;
  const mode=$('#authMode').value;
  try {
    if(mode==='register') {
      const full_name=$('#name').value.trim();
      await JobAPI.request('/auth/register',{method:'POST',body:{email,password,full_name,role:'candidate'},auth:false});
      $('#authForm').reset();authMode('login');$('#email').value=email;
      authFeedback('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.',true);
      return;
    }
    const data=await JobAPI.request('/auth/login',{method:'POST',body:{email,password},auth:false});
    sessionStorage.setItem('jobconnect_jwt',data.access_token);
    await JobAPI.refresh();
    authDialog.close();$('#authForm').reset();
    render();
    const to={Admin:'#/admin/jobs',Recruiter:'#/employer/company',Candidate:'#/candidate/profile'}[state.user?.role]||'#/jobs';
    if(typeof routeTo==='function')routeTo(to);else location.hash=to;
    toast('Đăng nhập thành công!', 'success');
  }catch(err){authFeedback(err.message||'Không kết nối được Backend Python.',false);}
});
$('#registerButton').onclick = () => { authMode('register'); $('#authForm').reset(); authDialog.showModal(); };
$('#account').onclick = () => { authMode('login'); authDialog.showModal(); };
$('#userProfile').onclick = () => {
    if (!state.user) return;
    const destination = {
        Candidate: '#/candidate/profile',
        Recruiter: '#/employer/company',
        Admin: '#/admin/jobs'
    }[state.user.role] || '#/jobs';
    if (typeof routeTo === 'function') routeTo(destination);
    else location.hash = destination;
};
$('#logoutButton').onclick = async () => {
  sessionStorage.removeItem('jobconnect_jwt');state.user=null;state.accounts=[];page='jobs';cvs=[];
  await JobAPI.refresh();render();
  if(typeof routeTo==='function')routeTo('#/jobs');else location.hash='#/jobs';
  toast('Đã đăng xuất thành công.','success');
};
document.addEventListener('click', e => {
  const button=e.target.closest('[data-toggle-password]');
  if (!button) return;
  const field=document.getElementById(button.dataset.togglePassword);
  field.type=field.type==='password'?'text':'password';
  button.setAttribute('aria-label',field.type==='password'?'Hiện mật khẩu':'Ẩn mật khẩu');
  button.classList.toggle('is-visible',field.type==='text');
  button.setAttribute('aria-pressed',String(field.type==='text'));
});
document.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    try {
        if (b.hasAttribute('data-close')) b.closest('dialog').close();
        // Điều hướng data-page do portal.js xử lý bằng URL hash.
        if (b.dataset.save) toggleSave(Number(b.dataset.save));
        // Mở chi tiết bằng trang #/jobs/:id do portal.js xử lý.
        if (b.dataset.apply) await startApply(Number(b.dataset.apply));
        if (b.dataset.withdraw) withdraw(Number(b.dataset.withdraw));
        if (b.dataset.key) {
            $('#keyword').value = b.dataset.key;
            page = 'jobs';
            render()
        }
        if (b.dataset.delete && candidate()) {
            if (!confirm('Xóa CV? Tên CV vẫn được giữ trong lịch sử ứng tuyển.')) return;
            await loadCV();
            if (!cvs.some(c => c.id === b.dataset.delete)) return;
            await cvStore('readwrite', s => s.delete(b.dataset.delete));
            await renderCV()
        }
        if (b.dataset.preview && candidate()) {
            await loadCV();
            const c = cvs.find(c => c.id === b.dataset.preview);
            if (c) {
                const u = URL.createObjectURL(c.blob);
                const a = document.createElement('a');
                a.href = u;
                a.target = '_blank';
                a.rel = 'noopener';
                a.click();
                setTimeout(() => URL.revokeObjectURL(u), 60000)
            }
        }
    } catch {
        toast('Thao tác chưa hoàn tất. Vui lòng thử lại.')
    }
});
$('#search').onsubmit = e => {
    e.preventDefault();
    page = 'jobs';
    render()
};
['location', 'type', 'salary', 'sort'].forEach(id => $('#' + id).addEventListener('change', renderJobs));
$('#reset').onclick = () => {
    ['keyword', 'location', 'type'].forEach(id => $('#' + id).value = '');
    $('#salary').value = 0;
    $('#sort').value = 'new';
    renderJobs()
};
$('#statusFilter').insertAdjacentHTML('beforeend', Object.entries(statuses).map(([k, v]) => `<option value="${k}">${v} (${k})</option>`).join(''));
$('#statusFilter').onchange = renderApplications;
render();
// Chỉ hiện phần khám phá trang chủ khi xem danh sách việc làm.
(function(){const discovery=document.getElementById("discovery");if(!discovery)return;const watch=new MutationObserver(()=>{discovery.hidden=document.getElementById("hero").hidden;});watch.observe(document.getElementById("hero"),{attributes:true,attributeFilter:["hidden"]});discovery.hidden=document.getElementById("hero").hidden;})();
// Các nút khám phá ngành trên trang chủ (frontend demo).
document.getElementById('showAllCategories')?.addEventListener('click', () => {
  document.getElementById('keyword').value = '';
  document.getElementById('location').value = '';
  page = 'jobs'; render(); document.getElementById('workspace').scrollIntoView({behavior:'smooth'});
});
document.getElementById('moreCategories')?.addEventListener('click', () => {
  document.getElementById('keyword').value = '';
  page = 'jobs'; render(); document.getElementById('workspace').scrollIntoView({behavior:'smooth'});
});
// Khôi phục mật khẩu bằng mã OTP gửi đến email; giao diện nằm trong dialog JobConnect.
(() => {
  const dialog=document.getElementById('authDialog');
  const loginForm=document.getElementById('authForm');
  const resetForm=document.getElementById('resetForm');
  const resetFeedback=document.getElementById('resetFeedback');
  const email=document.getElementById('resetEmail');
  const codeFields=document.getElementById('resetCodeFields');
  const submit=document.getElementById('resetSubmit');
  let phase='email';
  let busy=false;
  const notify=(message,ok=false)=>{resetFeedback.textContent=message;resetFeedback.hidden=!message;resetFeedback.className='auth-feedback '+(ok?'is-success':'is-error');};
  const showLogin=()=>{resetForm.hidden=true;loginForm.hidden=false;authMode('login');};
  document.getElementById('openForgotPassword').addEventListener('click',()=>{
    loginForm.hidden=true;resetForm.hidden=false;resetForm.reset();phase='email';
    codeFields.hidden=true;submit.textContent='Gửi mã xác minh';
    email.readOnly=false;email.value=document.getElementById('email').value.trim();
    document.getElementById('resetSubtitle').textContent='Nhập email đã đăng ký để nhận mã xác minh 6 chữ số.';
    notify('');email.focus();
  });
  document.getElementById('backToLogin').addEventListener('click',showLogin);
  dialog.addEventListener('close',()=>{if(!resetForm.hidden)showLogin();});
  async function requestCode(){
    await JobAPI.request('/auth/forgot-password',{method:'POST',auth:false,body:{email:email.value.trim().toLowerCase()}});
    phase='code';email.readOnly=true;codeFields.hidden=false;submit.textContent='Đặt lại mật khẩu';
    document.getElementById('resetSubtitle').textContent='Nhập mã gồm 6 số trong email (hết hạn sau 10 phút), sau đó tạo mật khẩu mới.';
    notify('Nếu email có tài khoản, mã đã được gửi. Hãy kiểm tra hộp thư và thư Spam.',true);
    document.getElementById('resetCode').focus();
  }
  resetForm.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    if(!email.value.trim()||!email.checkValidity())return notify('Vui lòng nhập email hợp lệ.');
    busy=true;submit.disabled=true;
    try{
      if(phase==='email'){await requestCode();return;}
      const otp=document.getElementById('resetCode').value.trim();
      const password=document.getElementById('resetPassword').value;
      const confirm=document.getElementById('resetConfirm').value;
      if(!/^\d{6}$/.test(otp))return notify('Mã xác minh phải đủ 6 chữ số.');
      if(password.length!==8)return notify('Mật khẩu mới phải đúng 8 ký tự.');
      if(confirm!==password)return notify('Hai mật khẩu chưa trùng khớp.');
      await JobAPI.request('/auth/reset-password',{method:'POST',auth:false,body:{email:email.value.trim().toLowerCase(),code:otp,new_password:password}});
      showLogin();document.getElementById('email').value=email.value;document.getElementById('password').value='';
      authFeedback('Đã đổi mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',true);
    }catch(error){notify(error.message||'Không thể khôi phục mật khẩu.');}
    finally{busy=false;submit.disabled=false;}
  });
  document.getElementById('resendResetCode').addEventListener('click',async()=>{
    if(busy)return;busy=true;submit.disabled=true;
    try{await requestCode();}catch(error){notify(error.message||'Không gửi được mã xác minh.');}
    finally{busy=false;submit.disabled=false;}
  });
})();
