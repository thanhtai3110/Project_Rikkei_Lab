/* JobConnect -> Python FastAPI / MySQL. Không chứa mật khẩu hay khóa bí mật. */
// Chuyển token phiên cũ sang lưu trữ bền vững; token vẫn hết hạn theo JWT Backend.
if (!localStorage.getItem('jobconnect_jwt') && sessionStorage.getItem('jobconnect_jwt')) {
  localStorage.setItem('jobconnect_jwt', sessionStorage.getItem('jobconnect_jwt'));
}
window.JobAPI = {
 base:window.location.origin,recruiterApps:[],adminUsers:[],normalizeStatus(s){return ({pending:'submitted',approved:'accepted'})[s]||s;},
 getToken(){return localStorage.getItem('jobconnect_jwt')||sessionStorage.getItem('jobconnect_jwt');},
 clearToken(){
  localStorage.removeItem('jobconnect_jwt');
  sessionStorage.removeItem('jobconnect_jwt');
 },
 async request(path,{method='GET',body=null,auth=true,responseType='json'}={}){
  const form=body instanceof FormData;
  const headers=form?{}:{'Content-Type':'application/json'};
  const token=this.getToken();
  if(auth&&token)headers.Authorization='Bearer '+token;
  let res;
  try{res=await fetch(this.base+path,{method,headers,body:form?body:body===null?undefined:JSON.stringify(body)});}
  catch{throw new Error('Không kết nối được Backend Python. Hãy mở http://127.0.0.1:8000/docs và kiểm tra Uvicorn đang chạy.');}
  if(res.ok&&responseType==='blob')return res.blob();
  const data=await res.json().catch(()=>null);
  if(!res.ok){
   if(auth&&token===this.getToken()&&(res.status===401||(path==='/auth/me'&&res.status===403))) this.clearToken();
   const detail=data?.detail;
   if(path==='/api/applications'&&method==='POST'&&res.status===422&&Array.isArray(detail)
      &&detail.some(error=>error.type==='missing'&&['cv','job_id'].includes(error.loc?.at(-1)))){
    throw new Error('Máy chủ chưa nhận được mã tin hoặc CV PDF. Hãy tải lại trang, chọn CV và gửi lại.');
   }
   throw new Error(typeof detail==='string'?detail:Array.isArray(detail)?detail.map(x=>x.msg).join('; '):'API lỗi '+res.status);
  }
  return data;
 },
 async refresh(){
  const token=this.getToken();
  let me=null;
  if(token){
   try{me=await this.request('/auth/me');}
   catch(error){if(token===this.getToken())throw error;}
  }
  const activeToken=this.getToken();
  if(activeToken!==token&&(me||activeToken))return;
  state.user=me?{id:me.user_id,email:me.email,name:me.full_name,role:({candidate:'Candidate',recruiter:'Recruiter',admin:'Admin'})[me.role]}:null;
  const a=me?{name:me.full_name,email:me.email,role:state.user.role,saved:[],applications:[],profile:{},company:{}}:null;
  state.accounts=a?[a]:[];this.recruiterApps=[];this.adminUsers=[];
  const all=await this.request('/api/jobs');
  if(activeToken!==this.getToken())return;
  let combined=[...all];
  if(me?.role==='candidate'){
   const [saved,applications,profile]=await Promise.all([this.request('/api/saved'),this.request('/api/applications/my'),this.request('/candidate/profile')]);
   if(activeToken!==this.getToken())return;
   a.saved=saved;
   a.profile={...profile,skills:(profile.skills||[]).join(', ')};
   a.applications=applications.map(x=>({id:x.id,jobId:x.job_id,date:x.applied_at,status:this.normalizeStatus(x.status),cvName:x.cv_filename||'Chưa có CV đính kèm'}));
  }else if(me?.role==='recruiter'){
   const [own,company,apps]=await Promise.all([this.request('/api/jobs/mine'),this.request('/company/profile'),this.request('/api/recruiter/applications')]);
   if(activeToken!==this.getToken())return;
   combined.push(...own);
   a.company={name:company.company_name||'',address:company.address||'',description:company.description||'',logo:company.logo_url||''};
   this.recruiterApps=apps;
  }else if(me?.role==='admin'){
   const [allJobs,users]=await Promise.all([this.request('/api/admin/jobs'),this.request('/api/admin/users')]);
   if(activeToken!==this.getToken())return;
   combined=allJobs;
   this.adminUsers=users;
   state.accounts=users.map(x=>({id:x.user_id,email:x.email,name:x.full_name,role:({candidate:'Candidate',recruiter:'Recruiter',admin:'Admin'})[x.role]||x.role,status:x.status,saved:[],applications:[]}));
  }
  const map=new Map();
  for(const j of combined)map.set(j.id,{...j,date:String(j.date),owner:j.recruiter_id===me?.user_id?me?.email:undefined});
  // backend không gửi recruiter_id trong JobResponse; các tin riêng được gắn owner bên dưới.
  if(me?.role==='recruiter'){
   const own=combined.filter(j=>j.owner===me.email); // owner will be resolved by endpoint below
   for(const j of await this.request('/api/jobs/mine'))map.set(j.id,{...j,date:String(j.date),owner:me.email});
  }
  if(activeToken!==this.getToken())return;
  jobs.splice(0,jobs.length,...map.values());
  if(typeof render==='function')render();if(typeof portalRender==='function')portalRender();
 },
};
async function initializeJobConnect(){
 try{
  await JobAPI.refresh();
 }catch(error){
  console.error(error);
  jobs.splice(0,jobs.length);
  render();
  toast('Backend chưa kết nối: '+error.message);
  if(!state.user&&JobAPI.getToken()){
   initialRouteReady=true;
   return;
  }
 }
 initialRouteReady=true;
 route();
}
initializeJobConnect();
