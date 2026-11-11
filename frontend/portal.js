'use strict';
/* Giao diện bổ sung chạy DEMO ở trình duyệt. Backend sẽ thay lớp lưu dữ liệu. */
const portalView = document.getElementById('portalView');
const portalContent = document.getElementById('portalContent');
const mockJobsKey = 'jobconnect-custom-jobs-v3';
let portal = '', recruiterTab = 'company', adminTab = 'pending', adminPage = 1;
const safe = esc;
const current = () => account();
const role = () => state.user?.role || null;
const publicJob = j => j && j.open && (j.status || 'approved') === 'approved';
const ownedJobs = () => jobs.filter(j => j.owner === state.user?.email);
const findJob = id => jobs.find(j => j.id === Number(id));
const allAppsForRecruiter = () => {
  const ids = new Set(ownedJobs().map(j => j.id));
  return state.accounts.filter(a => a.role === 'Candidate').flatMap(a => (a.applications || []).filter(x => ids.has(x.jobId)).map(x => ({...x, applicant:a})));
};
function requireRole(expected) {
  if (!role()) { authMode('login'); document.getElementById('authDialog').showModal(); return false; }
  if (role() !== expected) {toast('Bạn không có quyền truy cập khu vực này.');return false;}
  return true;
}
function loadMockJobs() {
  try {
    const saved = JSON.parse(localStorage.getItem(mockJobsKey) || '[]');
    if (Array.isArray(saved)) for (const j of saved) {
      if (!j || typeof j.id !== 'number' || typeof j.owner !== 'string') continue;
      const i = jobs.findIndex(x => x.id === j.id);
      if (i >= 0) jobs[i] = {...jobs[i],...j}; else jobs.push(j);
    }
  } catch { /* invalid demo data ignored */ }
  // Chuẩn hóa địa điểm cũ trong localStorage khi nâng cấp Frontend.
  const legacyPlaces = {4:'Hà Nội',6:'TP. Hồ Chí Minh',21:'Thái Nguyên',31:'Hải Dương',37:'Bình Định'};
  for (const j of jobs) if (j.location === 'Remote') j.location = legacyPlaces[j.id] || 'Hà Nội';
  for (const j of jobs) {
    if (!j.owner && j.company === 'TechNova Studio') j.owner = 'recruiter@demo.vn';
    if (!j.status) j.status = j.open ? 'approved' : 'closed';
  }
}
function saveMockJobs() {
  try {localStorage.setItem(mockJobsKey,JSON.stringify(jobs.filter(j=>j.owner)));}
  catch {toast('Không thể lưu tin trong trình duyệt.');}
}
function saveAndRefresh(message) { saveMockJobs(); persist(); render(); portalRender(); if(message)toast(message); }
function routeTo(hash) {if (location.hash !== hash) location.hash = hash; else route();}
function setPortal(name, tab) {
  const expected = name === 'candidate-profile' ? 'Candidate' : name === 'recruiter' ? 'Recruiter' : 'Admin';
  if (!requireRole(expected)) return;
  if (name === 'recruiter' && tab) recruiterTab = tab;
  if (name === 'admin' && tab) adminTab = tab;
  portal = name; page = name;
  portalRender();
  document.getElementById('workspace').scrollIntoView({behavior:'smooth',block:'start'});
}
function navigate(pageName) {portal='';page=pageName;render();portalRender();document.getElementById('workspace').scrollIntoView({behavior:'smooth',block:'start'});}
function syncNav() {
  const r = role();
  document.querySelectorAll('[data-page="saved"],[data-page="applications"],[data-page="cv"],[data-portal="candidate-profile"]').forEach(b => b.hidden = r !== 'Candidate');
  document.querySelectorAll('[data-portal="recruiter"]').forEach(b => b.hidden = r !== 'Recruiter');
  document.querySelectorAll('[data-portal="admin"]').forEach(b => b.hidden = r !== 'Admin');
}
function portalRender() {
  syncNav();
  if (!portal || (portal === 'candidate-profile' && role() !== 'Candidate') || (portal === 'recruiter' && role() !== 'Recruiter') || (portal === 'admin' && role() !== 'Admin')) {
    if(portal)portal='';
    portalView.hidden = true;
    document.getElementById('hero').hidden = page !== 'jobs';
    document.getElementById('jobsView').hidden = !['jobs','saved'].includes(page);
    document.getElementById('applicationsView').hidden = page !== 'applications';
    document.getElementById('cvView').hidden = page !== 'cv';
    document.querySelectorAll('[data-portal]').forEach(b=>b.classList.remove('active'));
    return;
  }
  ['hero','jobsView','applicationsView','cvView'].forEach(id => document.getElementById(id).hidden=true);
  portalView.hidden=false;
  document.getElementById('resultCount').textContent='DỮ LIỆU DEMO';
  document.querySelectorAll('[data-page]').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('[data-portal]').forEach(b=>b.classList.toggle('active',b.dataset.portal===portal));
  if (portal === 'candidate-profile') renderCandidateProfile();
  else if (portal === 'recruiter') renderRecruiter();
  else renderAdmin();
}
function renderCandidateProfile() {
  document.getElementById('pageTitle').textContent = 'Hồ sơ ứng viên';
  const a=current(), p=a.profile||{};
  portalContent.innerHTML=`<div class="panel"><h3>Thông tin cá nhân</h3><p class="muted">Cập nhật hồ sơ. CV PDF quản lý ở tab Hồ sơ & CV.</p><form id="candidateProfileForm" class="portal-grid">
    <label>Họ và tên<input name="name" maxlength="80" required value="${safe(p.full_name||a.name||'')}"></label>
    <label>Số điện thoại<input name="phone" maxlength="20" value="${safe(p.phone||'')}"></label>
    <label>Kỹ năng<input name="skills" maxlength="400" placeholder="HTML, CSS, JavaScript" value="${safe(p.skills||'')}"></label>
    <label>Địa điểm<input name="location" maxlength="100" value="${safe(p.location||'')}"></label>
    <label>Đường dẫn CV (nếu có)<input name="cv_url" type="url" placeholder="https://..." value="${safe(p.cv_url||'')}"></label>
    <div class="form-actions"><button class="primary">Lưu hồ sơ</button><button type="button" data-go="cv">Quản lý CV PDF</button></div>
  </form></div>`;
}
function recruiterCompany() {
  const a=current();
  if (!a.company) a.company={name:'Công ty của '+a.name,address:'',description:'',logo:''};
  return a.company;
}
const recruiterNav = () => `<div class="portal-actions"><button data-rec-tab="company" class="${recruiterTab==='company'?'active':''}">Hồ sơ doanh nghiệp</button><button data-rec-tab="jobs" class="${recruiterTab==='jobs'?'active':''}">Quản lý tin tuyển dụng</button><button data-rec-tab="applications" class="${recruiterTab==='applications'?'active':''}">Quản lý ứng viên</button></div>`;
function renderRecruiter() {
  document.getElementById('pageTitle').textContent='Không gian nhà tuyển dụng';
  const c=recruiterCompany(),owned=ownedJobs(),apps=allAppsForRecruiter();
  const stats=`<div class="portal-cards"><div>Tổng tin đã đăng<strong>${owned.length}</strong></div><div>Tin đang chờ duyệt<strong>${owned.filter(x=>x.status==='pending').length}</strong></div><div>Hồ sơ nhận được<strong>${apps.length}</strong></div></div>`;
  let content='';
  if(recruiterTab==='company') content=`<div class="panel"><h3>Hồ sơ doanh nghiệp</h3><form id="companyForm" class="portal-grid"><label>Tên công ty<input name="name" required maxlength="120" value="${safe(c.name)}"></label><label>Địa chỉ<input name="address" maxlength="250" value="${safe(c.address)}"></label><label>Đường dẫn logo<input name="logo" type="url" placeholder="https://..." value="${safe(c.logo)}"></label><label>Mô tả doanh nghiệp<textarea name="description" maxlength="1500">${safe(c.description)}</textarea></label><div class="form-actions"><button class="primary">Lưu thông tin</button></div></form></div>`;
  if(recruiterTab==='jobs') content=`<div class="panel"><h3>Đăng tin / chỉnh sửa tuyển dụng</h3><p class="muted">Tin mới hoặc nội dung quan trọng được sửa sẽ chuyển về trạng thái pending, chờ Admin duyệt.</p><form id="jobForm" class="portal-grid"><input type="hidden" name="jobId" id="editingJobId"><label>Vị trí tuyển dụng<input name="title" required maxlength="140"></label><label>Địa điểm<select name="location"><option>Hà Nội</option><option>TP. Hồ Chí Minh</option><option>Đà Nẵng</option><option>Hải Phòng</option><option>Thái Nguyên</option><option>Hải Dương</option><option>Bình Định</option></select></label><label>Hình thức<select name="type"><option>Toàn thời gian</option><option>Bán thời gian</option><option>Thực tập</option></select></label><label>Kỹ năng, phân cách bằng dấu phẩy<input name="skills" maxlength="300" required></label><label>Lương thấp nhất (triệu)<input name="min" type="number" min="0" max="200" value="10" required></label><label>Lương cao nhất (triệu)<input name="max" type="number" min="0" max="200" value="20" required></label><label>Mô tả công việc<textarea name="description" maxlength="3000" required></textarea></label><div class="form-actions"><button class="primary">Lưu tin</button><button type="button" data-cancel-job>Nhập tin mới</button></div></form></div><div class="panel"><h3>Danh sách tin của công ty</h3><div class="table-scroll"><table class="portal-table"><thead><tr><th>Vị trí</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${owned.map(j=>`<tr><td>${safe(j.title)}</td><td><span class="status status-${safe(j.status)}">${safe(j.status)}</span></td><td><button data-edit-job="${j.id}">Sửa</button><button data-close-job="${j.id}" ${!j.open?'disabled':''}>Đóng tin</button></td></tr>`).join('')||'<tr><td colspan="3">Chưa có tin tuyển dụng.</td></tr>'}</tbody></table></div></div>`;
  if(recruiterTab==='applications') content=`<div class="panel"><h3>Danh sách ứng viên</h3><div class="portal-grid"><label>Họ tên / kỹ năng<input id="applicantSearch" placeholder="Tìm theo tên, kỹ năng"></label><label>Trạng thái<select id="applicantStatus"><option value="">Tất cả</option>${Object.entries(statuses).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label><label>Thời gian nộp từ ngày<input id="applicantDate" type="date"></label></div><div id="recruiterApplicants"></div></div>`;
  portalContent.innerHTML=stats+recruiterNav()+content;
  if(recruiterTab==='applications') { ['applicantSearch','applicantStatus','applicantDate'].forEach(id =>document.getElementById(id).addEventListener(id==='applicantSearch'?'input':'change',renderApplicantTable));renderApplicantTable();}
}
function renderApplicantTable() {
  const term=(document.getElementById('applicantSearch')?.value||'').toLocaleLowerCase('vi'), filter=document.getElementById('applicantStatus')?.value||'',date=document.getElementById('applicantDate')?.value||'';
  const list=allAppsForRecruiter().filter(a=>(!filter||a.status===filter)&&(!date||a.date.slice(0,10)>=date)&&[a.applicant.name,a.applicant.profile?.skills||''].join(' ').toLocaleLowerCase('vi').includes(term));
  document.getElementById('recruiterApplicants').innerHTML=`<div class="table-scroll"><table class="portal-table"><thead><tr><th>Ứng viên</th><th>Tin tuyển dụng</th><th>Ngày nộp</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>${list.map(a=>`<tr><td>${safe(a.applicant.name)}<div class="inline-note">${safe(a.applicant.profile?.skills||'Chưa khai báo kỹ năng')}</div></td><td>${safe(findJob(a.jobId)?.title||'Không có tin')}</td><td>${new Date(a.date).toLocaleDateString('vi-VN')}</td><td>${safe(statuses[a.status]||a.status)}</td><td><select aria-label="Cập nhật trạng thái" data-app-status="${a.jobId}" data-app-email="${safe(a.applicant.email)}" ${['withdrawn','accepted','rejected'].includes(a.status)?'disabled':''}>${Object.entries(statuses).filter(([v])=>v!=='withdrawn').map(([v,t])=>`<option value="${v}" ${a.status===v?'selected':''}>${t}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="5">Không có hồ sơ phù hợp.</td></tr>'}</tbody></table></div>`;
}
const adminNav = () => `<div class="portal-actions"><button data-admin-tab="pending" class="${adminTab==='pending'?'active':''}">Kiểm duyệt tin</button><button data-admin-tab="users" class="${adminTab==='users'?'active':''}">Quản lý tài khoản</button></div>`;
function renderAdmin() {
  document.getElementById('pageTitle').textContent='Dashboard quản trị Admin';
  const pending=jobs.filter(j=>j.status==='pending'), apps=state.accounts.reduce((n,a)=>n+(a.applications||[]).length,0), candidates=state.accounts.filter(a=>a.role==='Candidate').length,recruiters=state.accounts.filter(a=>a.role==='Recruiter').length;
  const stats=`<div class="portal-cards portal-cards-four"><div>Ứng viên<strong>${candidates}</strong></div><div>Nhà tuyển dụng<strong>${recruiters}</strong></div><div>Tin tuyển dụng<strong>${jobs.length}</strong></div><div>Đơn ứng tuyển<strong>${apps}</strong></div></div>`;
  let content='';
  if(adminTab==='pending') content=`<div class="panel"><h3>Tin tuyển dụng chờ kiểm duyệt</h3><p class="muted">Tin pending và rejected không hiển thị trên danh sách việc làm công khai.</p><div class="table-scroll"><table class="portal-table"><thead><tr><th>Tin tuyển dụng</th><th>Doanh nghiệp</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>${pending.map(j=>`<tr><td>${safe(j.title)}</td><td>${safe(j.company)}</td><td><span class="status">pending</span></td><td><button data-preview-admin="${j.id}">Xem tin</button><button data-review-job="${j.id}" data-decision="approved">Duyệt</button><button class="danger" data-review-job="${j.id}" data-decision="rejected">Từ chối</button></td></tr>`).join('')||'<tr><td colspan="4">Không có tin nào chờ duyệt.</td></tr>'}</tbody></table></div></div>`;
  if(adminTab==='users') {
    const perPage=5,maxPage=Math.max(1,Math.ceil(state.accounts.length/perPage));adminPage=Math.min(adminPage,maxPage);
    content=`<div class="panel"><h3>Danh sách tài khoản</h3><p class="muted">Danh sách chỉ xem trong bản Frontend demo. Khóa/xóa tài khoản cần API Backend.</p><div class="table-scroll"><table class="portal-table"><thead><tr><th>Họ và tên</th><th>Email</th><th>Vai trò</th></tr></thead><tbody>${state.accounts.slice((adminPage-1)*perPage,adminPage*perPage).map(a=>`<tr><td>${safe(a.name)}</td><td>${safe(a.email)}</td><td>${safe(a.role)}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><button data-admin-page="prev" ${adminPage<=1?'disabled':''}>Trang trước</button><span>Trang ${adminPage}/${maxPage}</span><button data-admin-page="next" ${adminPage>=maxPage?'disabled':''}>Trang sau</button></div></div>`;
  }
  portalContent.innerHTML=stats+adminNav()+content;
}
function renderPublicJobs() {
  const start=performance.now(),q=document.getElementById('keyword').value.trim().toLocaleLowerCase('vi');
  const a=current();
  let list=jobs.filter(j=>publicJob(j)&&(page!=='saved'||a?.saved?.includes(j.id))&&[j.title,j.company,...(j.skills||[])].join(' ').toLocaleLowerCase('vi').includes(q)&&(!document.getElementById('location').value||j.location===document.getElementById('location').value)&&(!document.getElementById('type').value||j.type===document.getElementById('type').value)&&Number(j.min)>=Number(document.getElementById('salary').value||0));
  list.sort((a,b)=>document.getElementById('sort').value==='salary'?b.max-a.max:b.date.localeCompare(a.date));
  document.getElementById('jobList').innerHTML=list.map(j=>`<article class="card"><div class="logo" aria-hidden="true"><span class="company-initial">${safe(String(j.company || "?").trim().charAt(0).toLocaleUpperCase("vi"))}</span></div><div class="card-body"><h3>${safe(j.title)}</h3><div class="company">${safe(j.company)} · ${safe(j.location)}</div><div class="tags"><span class="tag salary">${j.min}–${j.max} triệu</span><span class="tag">${safe(j.type)}</span>${(j.skills||[]).map(s=>`<span class="tag">${safe(s)}</span>`).join('')}</div><div class="card-bottom"><small>Đang tuyển · ${safe(j.date)}</small><button data-detail="${j.id}">Xem chi tiết →</button></div></div><button class="save" data-save="${j.id}" aria-label="${a?.saved?.includes(j.id)?'Bỏ lưu':'Lưu'} ${safe(j.title)}" aria-pressed="${!!a?.saved?.includes(j.id)}">${a?.saved?.includes(j.id)?'♥':'♡'}</button></article>`).join('')||'<div class="empty">Không có việc làm phù hợp với bộ lọc.</div>';
  document.getElementById('resultCount').textContent=`${list.length} công việc · Lọc demo ${Math.ceil(performance.now()-start)} ms`;
}
// Giữ hàm render cơ bản của app.js, thay riêng danh sách bằng logic chỉ hiển thị approved.
renderJobs = renderPublicJobs;
function detailBody(j) {const applied=current()?.applications?.some(a=>a.jobId===j.id);return `<span class="eyebrow">${safe(j.company)}</span><h2>${safe(j.title)}</h2><p>${safe(j.location)} · ${safe(j.type)} · ${j.min}–${j.max} triệu/tháng</p><h3>Mô tả công việc</h3><p>${safe(j.description||'Tham gia phát triển sản phẩm và làm việc cùng đội ngũ chuyên môn.')}</p><h3>Kỹ năng yêu cầu</h3><p>${(j.skills||[]).map(s=>safe(s)).join(', ')}</p><h3>Trạng thái</h3><p>${safe(j.status)}</p>${publicJob(j)?`<button class="primary" data-apply="${j.id}" ${applied?'disabled':''}>${applied?'Đã ứng tuyển':'Ứng tuyển ngay'}</button>`:''}`;}
function openDetail(id) {const j=findJob(id);if(!publicJob(j)){toast('Tin này chưa được công khai.');routeTo('#/jobs');return;}portal='';page='detail';render();portalRender();document.getElementById('hero').hidden=true;document.getElementById('jobsView').hidden=true;document.getElementById('applicationsView').hidden=true;document.getElementById('cvView').hidden=true;portalView.hidden=false;document.getElementById('pageTitle').textContent='Chi tiết việc làm';portalContent.innerHTML=`<div class="panel detail-panel"><button data-go="jobs">← Quay lại việc làm</button><div class="detail-body">${detailBody(j)}</div></div>`;document.getElementById('resultCount').textContent='';}
function route() {
  const h=decodeURIComponent(location.hash||'#/jobs');
  if(/^#\/jobs\/\d+$/.test(h)) return openDetail(Number(h.split('/').pop()));
  if(h==='#/employer/jobs')return setPortal('recruiter','jobs');
  if(h==='#/employer/applications')return setPortal('recruiter','applications');
  if(h==='#/employer/company')return setPortal('recruiter','company');
  if(h==='#/admin/users')return setPortal('admin','users');
  if(h==='#/admin/jobs')return setPortal('admin','pending');
  if(h==='#/candidate/profile')return setPortal('candidate-profile');
  const map={'#/jobs':'jobs','#/saved':'saved','#/candidate/applications':'applications','#/candidate/cv':'cv'};
  if (map[h]) {if(map[h]!=='jobs'&&!requireRole('Candidate'))return;navigate(map[h]);return;}
  if(h==='#jobs')return routeTo('#/jobs');
  routeTo('#/jobs');
}
window.addEventListener('hashchange',route);
// Lắng nghe nút bấm bổ sung. Những nút cũ trong app.js vẫn chạy bình thường.
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.portal){const name=b.dataset.portal;routeTo(name==='candidate-profile'?'#/candidate/profile':name==='recruiter'?'#/employer/company':'#/admin/jobs');}
 if(b.dataset.page){const map={jobs:'#/jobs',saved:'#/saved',applications:'#/candidate/applications',cv:'#/candidate/cv'};if(map[b.dataset.page])routeTo(map[b.dataset.page]);}
 if(b.dataset.go){const map={jobs:'#/jobs',cv:'#/candidate/cv'};routeTo(map[b.dataset.go]||'#/jobs');}
 if(b.dataset.detail)routeTo('#/jobs/'+Number(b.dataset.detail));
 if(b.dataset.recTab)routeTo({company:'#/employer/company',jobs:'#/employer/jobs',applications:'#/employer/applications'}[b.dataset.recTab]);
 if(b.dataset.adminTab)routeTo(b.dataset.adminTab==='users'?'#/admin/users':'#/admin/jobs');
 if(b.dataset.adminPage){adminPage+=b.dataset.adminPage==='next'?1:-1;renderAdmin();}
 if(b.hasAttribute('data-cancel-job')){const f=document.getElementById('jobForm');f.reset();f.elements.jobId.value='';}
 if(b.dataset.editJob){const j=ownedJobs().find(x=>x.id===Number(b.dataset.editJob));if(!j)return;const f=document.getElementById('jobForm');for(const name of ['title','location','type','min','max','description'])f.elements[name].value=j[name]??'';f.elements.skills.value=(j.skills||[]).join(', ');f.elements.jobId.value=j.id;f.scrollIntoView({behavior:'smooth',block:'center'});}
 if(b.dataset.closeJob){if(!requireRole('Recruiter'))return;const j=ownedJobs().find(x=>x.id===Number(b.dataset.closeJob));if(!j||!j.open)return;if(!confirm('Đóng tin tuyển dụng này?'))return;j.open=false;j.status='closed';saveAndRefresh('Đóng tin tuyển dụng thành công!');}
 if(b.dataset.reviewJob){if(!requireRole('Admin'))return;const j=findJob(b.dataset.reviewJob);if(!j||j.status!=='pending')return;j.status=b.dataset.decision;j.open=j.status==='approved';saveAndRefresh(j.open?'Duyệt tin tuyển dụng thành công!':'Từ chối tin tuyển dụng thành công!');}
 if(b.dataset.previewAdmin){const j=findJob(b.dataset.previewAdmin);if(!j)return;document.getElementById('detailBody').innerHTML=detailBody(j);document.getElementById('detailDialog').showModal();}
});
document.addEventListener('submit',e=>{
 const f=e.target;
 if(f.id==='candidateProfileForm'){e.preventDefault();if(!requireRole('Candidate'))return;const d=Object.fromEntries(new FormData(f)),a=current();a.name=d.name.trim();a.profile={full_name:a.name,phone:d.phone.trim(),skills:d.skills.trim(),location:d.location.trim(),cv_url:d.cv_url.trim()};state.user.name=a.name;persist();render();portalRender();toast('Cập nhật hồ sơ ứng viên thành công!', 'success');}
 if(f.id==='companyForm'){e.preventDefault();if(!requireRole('Recruiter'))return;const d=Object.fromEntries(new FormData(f)),a=current();a.company={name:d.name.trim(),address:d.address.trim(),description:d.description.trim(),logo:d.logo.trim()};ownedJobs().forEach(j=>j.company=a.company.name);saveAndRefresh('Cập nhật thông tin doanh nghiệp thành công!');}
 if(f.id==='jobForm'){e.preventDefault();if(!requireRole('Recruiter'))return;const d=Object.fromEntries(new FormData(f)),min=Number(d.min),max=Number(d.max);if(min<0||max<min)return toast('Mức lương không hợp lệ.');const old=ownedJobs().find(j=>j.id===Number(d.jobId));const fields={title:d.title.trim(),company:recruiterCompany().name,location:d.location,type:d.type,skills:d.skills.split(',').map(s=>s.trim()).filter(Boolean),min,max,description:d.description.trim(),date:new Date().toISOString().slice(0,10),open:false,status:'pending',owner:state.user.email};if(!fields.title||!fields.description||!fields.skills.length)return toast('Nhập đủ thông tin tin tuyển dụng.');if(old)Object.assign(old,fields);else jobs.push({id:Math.max(0,...jobs.map(j=>j.id))+1,...fields});saveAndRefresh(old ? 'Cập nhật tin tuyển dụng thành công! Tin đang chờ duyệt.' : 'Tạo tin tuyển dụng thành công! Tin đang chờ Admin duyệt.');}
});
document.addEventListener('change',e=>{
 const el=e.target;if(!el.matches('[data-app-status]'))return;if(!requireRole('Recruiter'))return;const owner=state.accounts.find(a=>a.email===el.dataset.appEmail),row=owner?.applications?.find(a=>a.jobId===Number(el.dataset.appStatus));if(!row||['withdrawn','accepted','rejected'].includes(row.status))return;row.status=el.value;persist();renderApplicantTable();toast('Cập nhật trạng thái ứng tuyển thành công!', 'success');
});
// Lệnh điều hướng và hiển thị được tích hợp với app.js cũ.
loadMockJobs();
syncNav();
route();
