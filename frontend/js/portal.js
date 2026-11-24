'use strict';
/* Giao diện bổ sung chạy DEMO ở trình duyệt. Backend sẽ thay lớp lưu dữ liệu. */
const portalView = document.getElementById('portalView');
const portalContent = document.getElementById('portalContent');
const mockJobsKey = 'jobconnect-custom-jobs-v3';
let portal = '', recruiterTab = 'company', adminTab = 'pending', adminPage = 1;
let adminSearch = '', adminRoleFilter = '', adminStatusFilter = '';

const safe = esc;
const current = () => account();
const role = () => state.user?.role || null;
const publicJob = j => j && j.open && (j.status || 'approved') === 'approved';
const ownedJobs = () => jobs.filter(j => j.owner === state.user?.email);
const findJob = id => jobs.find(j => j.id === Number(id));
const allAppsForRecruiter = () => (window.JobAPI?.recruiterApps||[]).map(a=>({
 id:a.id, jobId:a.job_id,date:a.applied_at,status:JobAPI.normalizeStatus(a.status),cvFilename:a.cv_filename,
 applicant:{name:a.candidate.name,email:a.candidate.email,profile:{skills:(a.candidate.skills||[]).join(', ')}}
}));
function requireRole(expected) {
  if (!role()) { authMode('login'); document.getElementById('authDialog').showModal(); return false; }
  if (role() !== expected) {toast('Bạn không có quyền truy cập khu vực này.');return false;}
  return true;
}
function loadMockJobs() { /* Server MySQL là nguồn dữ liệu; không nhập lại jobs từ localStorage. */ }
function saveMockJobs() { /* Không ghi đè MySQL bằng demo localStorage. */ }
function saveAndRefresh(message) { render(); portalRender(); if(message)toast(message,'success'); }
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
  document.getElementById('resultCount').textContent='DỮ LIỆU MYSQL';
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
  document.getElementById('recruiterApplicants').innerHTML=`<div class="table-scroll"><table class="portal-table"><thead><tr><th>Ứng viên</th><th>Tin tuyển dụng</th><th>Ngày nộp</th><th>CV</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>${list.map(a=>`<tr><td>${safe(a.applicant.name)}<div class="inline-note">${safe(a.applicant.profile?.skills||'Chưa khai báo kỹ năng')}</div></td><td>${safe(findJob(a.jobId)?.title||'Không có tin')}</td><td>${new Date(a.date).toLocaleDateString('vi-VN')}</td><td>${a.cvFilename
    ? `<button type="button" data-app-cv="${a.id}">Xem CV</button><div class="inline-note">${safe(a.cvFilename)}</div>`
    : 'Chưa có CV đính kèm'}</td><td>${safe(statuses[a.status]||a.status)}</td><td><select aria-label="Cập nhật trạng thái" data-app-status="${a.jobId}" data-app-email="${safe(a.applicant.email)}" ${['withdrawn','accepted','rejected'].includes(a.status)?'disabled':''}>${a.status==='submitted'?'<option value="" selected disabled>Chọn trạng thái</option>':''}${Object.entries(statuses).filter(([v])=>['reviewing','interviewed','accepted','rejected'].includes(v)).map(([v,t])=>`<option value="${v}" ${a.status===v?'selected':''}>${t}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="6">Không có hồ sơ phù hợp.</td></tr>'}</tbody></table></div>`;
}
const adminNav = () => `<div class="portal-actions"><button data-admin-tab="pending" class="${adminTab==='pending'?'active':''}">Kiểm duyệt tin</button><button data-admin-tab="users" class="${adminTab==='users'?'active':''}">Quản lý tài khoản</button></div>`;
function filteredAdminUsers(){
  const users=window.JobAPI?.adminUsers||[];
  const q=adminSearch.trim().toLocaleLowerCase('vi');
  return users.filter(u =>
    (!q || [u.full_name,u.email,String(u.user_id)].join(' ').toLocaleLowerCase('vi').includes(q)) &&
    (!adminRoleFilter || u.role===adminRoleFilter) &&
    (!adminStatusFilter || u.status===adminStatusFilter)
  );
}
function renderAdminUserTable(){
  const target=document.getElementById('adminUserTable');
  if(!target)return;
  const list=filteredAdminUsers(),perPage=8,maxPage=Math.max(1,Math.ceil(list.length/perPage));
  adminPage=Math.min(Math.max(adminPage,1),maxPage);
  const pageItems=list.slice((adminPage-1)*perPage,adminPage*perPage);
  const roleName={candidate:'Ứng viên',recruiter:'Nhà tuyển dụng',admin:'Admin'};
  const statusName={active:'Hoạt động',inactive:'Vô hiệu hóa',locked:'Đã khóa',disabled:'Vô hiệu hóa'};
  target.innerHTML=`<div class="admin-users-summary">Hiển thị <strong>${list.length}</strong> / ${(window.JobAPI?.adminUsers||[]).length} tài khoản từ MySQL</div>
    <div class="table-scroll"><table class="portal-table"><thead><tr><th>ID</th><th>Họ và tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>${pageItems.map(u=>`<tr><td>#${Number(u.user_id)}</td><td><strong>${safe(u.full_name)}</strong></td><td>${safe(u.email)}</td><td>${safe(roleName[u.role]||u.role)}</td><td><span class="status ${u.status==='active'?'status-approved':'status-rejected'}">${safe(statusName[u.status]||u.status)}</span></td><td><div class="admin-user-actions">${u.role==='admin'?'<span class="muted">Được bảo vệ</span>':`<button type="button" data-admin-user-toggle="${Number(u.user_id)}" data-admin-user-name="${safe(u.full_name)}" data-admin-user-status="${safe(u.status)}">${u.status==='active'?'Khóa':'Mở khóa'}</button><button type="button" class="danger" data-admin-user-delete="${Number(u.user_id)}" data-admin-user-name="${safe(u.full_name)}">Xóa</button>`}</div></td></tr>`).join('')||'<tr><td colspan="6">Không có tài khoản phù hợp.</td></tr>'}</tbody></table></div>
    <div class="pagination"><button type="button" data-admin-page="prev" ${adminPage<=1?'disabled':''}>Trang trước</button><span>Trang ${adminPage}/${maxPage}</span><button type="button" data-admin-page="next" ${adminPage>=maxPage?'disabled':''}>Trang sau</button></div>`;
}
function renderAdmin() {
  document.getElementById('pageTitle').textContent='Dashboard quản trị Admin';
  const users=window.JobAPI?.adminUsers||[];
  const pending=jobs.filter(j=>j.status==='pending');
  const candidates=users.filter(u=>u.role==='candidate').length;
  const recruiters=users.filter(u=>u.role==='recruiter').length;
  const stats=`<div class="portal-cards portal-cards-four"><div>Ứng viên<strong>${candidates}</strong></div><div>Nhà tuyển dụng<strong>${recruiters}</strong></div><div>Tổng tài khoản<strong>${users.length}</strong></div><div>Tin chờ duyệt<strong>${pending.length}</strong></div></div>`;
  let content='';
  if(adminTab==='pending') content=`<div class="panel"><h3>Tin tuyển dụng chờ kiểm duyệt</h3><div class="table-scroll"><table class="portal-table"><thead><tr><th>Tin tuyển dụng</th><th>Doanh nghiệp</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>${pending.map(j=>`<tr><td>${safe(j.title)}</td><td>${safe(j.company)}</td><td><span class="status">pending</span></td><td><button data-preview-admin="${j.id}">Xem tin</button><button data-review-job="${j.id}" data-decision="approved">Duyệt</button><button class="danger" data-review-job="${j.id}" data-decision="rejected">Từ chối</button></td></tr>`).join('')||'<tr><td colspan="4">Không có tin nào chờ duyệt.</td></tr>'}</tbody></table></div></div>`;
  if(adminTab==='users') content=`<div class="panel"><div class="admin-users-heading"><div><h3>Quản lý tài khoản người dùng</h3></div><button type="button" id="adminUsersReload">Làm mới dữ liệu</button></div>
    <div class="admin-users-filters"><label>Tìm người dùng<input id="adminUserSearch" placeholder="Tên, email hoặc ID..." autocomplete="off" value="${safe(adminSearch)}"></label>
    <label>Vai trò<select id="adminUserRole"><option value="">Tất cả vai trò</option><option value="candidate" ${adminRoleFilter==='candidate'?'selected':''}>Ứng viên</option><option value="recruiter" ${adminRoleFilter==='recruiter'?'selected':''}>Nhà tuyển dụng</option><option value="admin" ${adminRoleFilter==='admin'?'selected':''}>Admin</option></select></label>
    <label>Trạng thái<select id="adminUserStatus"><option value="">Tất cả trạng thái</option><option value="active" ${adminStatusFilter==='active'?'selected':''}>Hoạt động</option><option value="inactive" ${adminStatusFilter==='inactive'?'selected':''}>Vô hiệu hóa</option><option value="locked" ${adminStatusFilter==='locked'?'selected':''}>Đã khóa</option></select></label></div>
    <div id="adminUserTable"></div></div>`;
  portalContent.innerHTML=stats+adminNav()+content;
  if(adminTab==='users')renderAdminUserTable();
}

function renderPublicJobs() {
  const start=performance.now(),q=document.getElementById('keyword').value.trim().toLocaleLowerCase('vi');
  const a=current();
  let list=jobs.filter(j=>publicJob(j)&&(page!=='saved'||a?.saved?.includes(j.id))&&[j.title,j.company,...(j.skills||[])].join(' ').toLocaleLowerCase('vi').includes(q)&&(!document.getElementById('location').value||j.location===document.getElementById('location').value)&&(!document.getElementById('type').value||j.type===document.getElementById('type').value)&&Number(j.min)>=Number(document.getElementById('salary').value||0));
  list.sort((a,b)=>document.getElementById('sort').value==='salary'?b.max-a.max:b.date.localeCompare(a.date));
  document.getElementById('jobList').innerHTML=list.map(j=>`<article class="card">${renderCompanyLogo(j)}<div class="card-body"><h3>${safe(j.title)}</h3><div class="company">${safe(j.company)} · ${safe(j.location)}</div><div class="tags"><span class="tag salary">${j.min}–${j.max} triệu</span><span class="tag">${safe(j.type)}</span>${(j.skills||[]).map(s=>`<span class="tag">${safe(s)}</span>`).join('')}</div><div class="card-bottom"><small>Đang tuyển · ${safe(j.date)}</small><button data-detail="${j.id}">Xem chi tiết →</button></div></div><button class="save" data-save="${j.id}" aria-label="${a?.saved?.includes(j.id)?'Bỏ lưu':'Lưu'} ${safe(j.title)}" aria-pressed="${!!a?.saved?.includes(j.id)}">${a?.saved?.includes(j.id)?'♥':'♡'}</button></article>`).join('')||'<div class="empty">Không có việc làm phù hợp với bộ lọc.</div>';
  document.getElementById('resultCount').textContent=`${list.length} công việc`;
}
// Giữ hàm render cơ bản của app.js, thay riêng danh sách bằng logic chỉ hiển thị approved.
renderJobs = renderPublicJobs;
function detailBody(j) {const applied=current()?.applications?.some(a=>a.jobId===j.id);return `<span class="eyebrow">${safe(j.company)}</span><h2>${safe(j.title)}</h2><p>${safe(j.location)} · ${safe(j.type)} · ${j.min}–${j.max} triệu/tháng</p><h3>Mô tả công việc</h3><p>${safe(j.description||'Tham gia phát triển sản phẩm và làm việc cùng đội ngũ chuyên môn.')}</p><h3>Kỹ năng yêu cầu</h3><p>${(j.skills||[]).map(s=>safe(s)).join(', ')}</p><h3>Trạng thái</h3><p>${safe(j.status)}</p>${publicJob(j)?`<button class="primary" data-apply="${j.id}" ${applied?'disabled':''}>${applied?'Đã ứng tuyển':'Ứng tuyển ngay'}</button>`:''}`;}
function openDetail(id) {const j=findJob(id);if(!publicJob(j)){toast('Tin này chưa được công khai.');routeTo('#/jobs');return;}portal='';page='detail';render();portalRender();document.getElementById('hero').hidden=true;document.getElementById('jobsView').hidden=true;document.getElementById('applicationsView').hidden=true;document.getElementById('cvView').hidden=true;portalView.hidden=false;document.getElementById('pageTitle').textContent='Chi tiết việc làm';portalContent.innerHTML=`<div class="panel detail-panel"><button data-go="jobs">← Quay lại việc làm</button><div class="detail-body">${detailBody(j)}</div></div>`;document.getElementById('resultCount').textContent='';}
let initialRouteReady = false;
function route() {
  if (!initialRouteReady) return;
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

// Hộp xác nhận thiết kế theo giao diện JobConnect, thay cho confirm() mặc định.
function jobConfirm({title, message, action='Xác nhận', danger=false}) {
  const dialog = document.getElementById('jobConfirmDialog');
  if (!dialog) return Promise.resolve(false);
  const heading = document.getElementById('jobConfirmTitle');
  const body = document.getElementById('jobConfirmMessage');
  const yes = document.getElementById('jobConfirmAccept');
  const cancel = document.getElementById('jobConfirmCancel');
  heading.textContent = title;
  body.textContent = message;
  yes.textContent = action;
  yes.classList.toggle('is-danger', danger);
  document.getElementById('jobConfirmIcon').textContent = danger ? '!' : '✓';
  dialog.classList.toggle('confirm-danger', danger);
  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      yes.removeEventListener('click', accept);
      cancel.removeEventListener('click', dismiss);
      dialog.removeEventListener('cancel', esc);
      dialog.removeEventListener('close', closed);
      if (dialog.open) dialog.close();
      resolve(result);
    };
    const accept = () => finish(true);
    const dismiss = () => finish(false);
    const esc = e => {e.preventDefault();finish(false);};
    const closed = () => finish(false);
    yes.addEventListener('click', accept);
    cancel.addEventListener('click', dismiss);
    dialog.addEventListener('cancel', esc);
    dialog.addEventListener('close', closed);
    dialog.showModal();
    cancel.focus();
  });
}

// Lắng nghe nút bấm bổ sung. Những nút cũ trong app.js vẫn chạy bình thường.
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.appCv){
  if(!requireRole('Recruiter'))return;
  const preview=window.open('', '_blank');
  if(!preview)return toast('Vui lòng cho phép mở tab mới để xem CV.');
  preview.opener=null;
  preview.document.body.textContent='Đang tải CV PDF…';
  const token=JobAPI.getToken();
  try{
   const pdf=await JobAPI.request('/api/recruiter/applications/'+b.dataset.appCv+'/cv',{responseType:'blob'});
   if(preview.closed)return;
   if(token!==JobAPI.getToken()){
    preview.close();
    return;
   }
   const url=URL.createObjectURL(pdf);
   preview.location.replace(url);
   setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(err){
   preview.close();
   toast(err.message);
  }
  return;
 }
 if(b.dataset.portal){const name=b.dataset.portal;routeTo(name==='candidate-profile'?'#/candidate/profile':name==='recruiter'?'#/employer/company':'#/admin/jobs');}
 if(b.dataset.page){const map={jobs:'#/jobs',saved:'#/saved',applications:'#/candidate/applications',cv:'#/candidate/cv'};if(map[b.dataset.page])routeTo(map[b.dataset.page]);}
 if(b.dataset.go){const map={jobs:'#/jobs',cv:'#/candidate/cv'};routeTo(map[b.dataset.go]||'#/jobs');}
 if(b.dataset.detail)routeTo('#/jobs/'+Number(b.dataset.detail));
 if(b.dataset.recTab)routeTo({company:'#/employer/company',jobs:'#/employer/jobs',applications:'#/employer/applications'}[b.dataset.recTab]);
 if(b.dataset.adminTab)routeTo(b.dataset.adminTab==='users'?'#/admin/users':'#/admin/jobs');
 if(b.dataset.adminPage){adminPage+=b.dataset.adminPage==='next'?1:-1;renderAdminUserTable();}
 if(b.dataset.adminUserToggle){
  if(!requireRole('Admin'))return;
  const id=Number(b.dataset.adminUserToggle),name=b.dataset.adminUserName||('#'+id);
  const next=b.dataset.adminUserStatus==='active'?'locked':'active';
  if(!await jobConfirm({
   title: next==='locked'?'Khóa tài khoản':'Mở khóa tài khoản',
   message: next==='locked' ? `Bạn có chắc muốn khóa tài khoản "${name}"? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.` : `Bạn có muốn mở khóa tài khoản "${name}" để người dùng có thể đăng nhập trở lại?`,
   action: next==='locked'?'Khóa tài khoản':'Mở khóa', danger:next==='locked'
  }))return;
  b.disabled=true;
  try{
   await JobAPI.request('/api/admin/users/'+id+'/status',{method:'PATCH',body:{status:next}});
   await JobAPI.refresh();renderAdminUserTable();
   toast(next==='locked'?'Khóa tài khoản thành công!':'Mở khóa tài khoản thành công!','success');
  }catch(err){toast(err.message,'error');b.disabled=false;}
  return;
 }
 if(b.dataset.adminUserDelete){
  if(!requireRole('Admin'))return;
  const id=Number(b.dataset.adminUserDelete),name=b.dataset.adminUserName||('#'+id);
  if(!await jobConfirm({
   title:'Xóa tài khoản vĩnh viễn',
   message:`Bạn sắp xóa tài khoản "${name}" (#${id}) cùng dữ liệu liên quan, bao gồm đơn ứng tuyển, tin đã lưu và tin đăng nếu là nhà tuyển dụng. Hành động này không thể hoàn tác.`,
   action:'Xóa vĩnh viễn', danger:true
  }))return;
  b.disabled=true;
  try{
   await JobAPI.request('/api/admin/users/'+id,{method:'DELETE'});
   await JobAPI.refresh();renderAdminUserTable();toast('Đã xóa tài khoản và dữ liệu liên quan.','success');
  }catch(err){toast(err.message,'error');b.disabled=false;}
  return;
 }
 if(b.id==='adminUsersReload'){if(!requireRole('Admin'))return;b.disabled=true;try{await JobAPI.refresh();toast('Đã cập nhật danh sách tài khoản từ MySQL.','success');}catch(err){toast(err.message);}finally{const r=document.getElementById('adminUsersReload');if(r)r.disabled=false;}}
 if(b.hasAttribute('data-cancel-job')){const f=document.getElementById('jobForm');f.reset();f.elements.jobId.value='';}
 if(b.dataset.editJob){const j=ownedJobs().find(x=>x.id===Number(b.dataset.editJob));if(!j)return;const f=document.getElementById('jobForm');for(const name of ['title','location','type','min','max','description'])f.elements[name].value=j[name]??'';f.elements.skills.value=(j.skills||[]).join(', ');f.elements.jobId.value=j.id;f.scrollIntoView({behavior:'smooth',block:'center'});}
 if(b.dataset.closeJob){if(!requireRole('Recruiter'))return;if(!await jobConfirm({title:'Đóng tin tuyển dụng',message:'Tin tuyển dụng sẽ không còn nhận đơn ứng tuyển mới. Bạn có muốn tiếp tục?',action:'Đóng tin',danger:true}))return;try{await JobAPI.request('/api/jobs/'+b.dataset.closeJob+'/close',{method:'PATCH'});await JobAPI.refresh();saveAndRefresh('Đóng tin tuyển dụng thành công!');}catch(err){toast(err.message);}}
 if(b.dataset.reviewJob){if(!requireRole('Admin'))return;try{const approve=b.dataset.decision==='approved';await JobAPI.request('/api/admin/jobs/'+b.dataset.reviewJob+'/'+(approve?'approve':'reject'),{method:'PATCH'});await JobAPI.refresh();saveAndRefresh(approve?'Duyệt tin thành công!':'Từ chối tin thành công!');}catch(err){toast(err.message);}}
 if(b.dataset.previewAdmin){const j=findJob(b.dataset.previewAdmin);if(!j)return;document.getElementById('detailBody').innerHTML=detailBody(j);document.getElementById('detailDialog').showModal();}
});
document.addEventListener('submit',async e=>{
 const f=e.target;
 if(!['candidateProfileForm','companyForm','jobForm'].includes(f.id))return;
 e.preventDefault();
 try{
  if(f.id==='candidateProfileForm'){
   if(!requireRole('Candidate'))return;
   const d=Object.fromEntries(new FormData(f));
   await JobAPI.request('/candidate/profile',{method:'PATCH',body:{full_name:d.name.trim(),phone:d.phone.trim(),skills:d.skills.split(',').map(x=>x.trim()).filter(Boolean),cv_url:d.cv_url.trim()||null}});
   await JobAPI.refresh();saveAndRefresh('Cập nhật hồ sơ thành công!');
  }
  if(f.id==='companyForm'){
   if(!requireRole('Recruiter'))return;
   const d=Object.fromEntries(new FormData(f));
   await JobAPI.request('/company/profile',{method:'PATCH',body:{company_name:d.name.trim(),address:d.address.trim(),description:d.description.trim(),logo_url:d.logo.trim()||null}});
   await JobAPI.refresh();saveAndRefresh('Cập nhật doanh nghiệp thành công!');
  }
  if(f.id==='jobForm'){
   if(!requireRole('Recruiter'))return;
   const d=Object.fromEntries(new FormData(f));
   const payload={title:d.title.trim(),location:d.location,type:d.type,skills:d.skills.split(',').map(x=>x.trim()).filter(Boolean),min:Number(d.min),max:Number(d.max),description:d.description.trim()};
   const id=Number(d.jobId); await JobAPI.request(id?'/api/jobs/'+id:'/api/jobs',{method:id?'PUT':'POST',body:payload});
   await JobAPI.refresh();saveAndRefresh('Đã lưu tin, đang chờ Admin duyệt.');
  }
 }catch(err){toast(err.message);}
});
document.addEventListener('input',e=>{
 if(e.target.id==='adminUserSearch'){adminSearch=e.target.value;adminPage=1;renderAdminUserTable();}
});
document.addEventListener('change',e=>{
 if(e.target.id==='adminUserRole'){adminRoleFilter=e.target.value;adminPage=1;renderAdminUserTable();}
 if(e.target.id==='adminUserStatus'){adminStatusFilter=e.target.value;adminPage=1;renderAdminUserTable();}
});
document.addEventListener('change',async e=>{
 const el=e.target;if(!el.matches('[data-app-status]'))return;if(!requireRole('Recruiter'))return;
 const row=allAppsForRecruiter().find(a=>a.jobId===Number(el.dataset.appStatus)&&a.applicant.email===el.dataset.appEmail);
 if(!row)return;
 try{await JobAPI.request('/api/applications/'+row.id+'/status',{method:'PATCH',body:{status:el.value}});await JobAPI.refresh();portalRender();toast('Cập nhật trạng thái thành công!','success');}catch(err){toast(err.message);}
});
// Lệnh điều hướng và hiển thị được tích hợp với app.js cũ.
loadMockJobs();
syncNav();
