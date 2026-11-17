/* JobConnect -> Python FastAPI / MySQL. Không chứa mật khẩu hay khóa bí mật. */
window.JobAPI = {
 base:window.location.origin,recruiterApps:[],adminUsers:[],normalizeStatus(s){return ({pending:'submitted',approved:'accepted'})[s]||s;},
 async request(path,{method='GET',body=null,auth=true}={}){
  const headers={'Content-Type':'application/json'};
  const token=sessionStorage.getItem('jobconnect_jwt');
  if(auth&&token)headers.Authorization='Bearer '+token;
  let res;
  try{res=await fetch(this.base+path,{method,headers,body:body===null?undefined:JSON.stringify(body)});}
  catch{throw new Error('Không kết nối được Backend Python. Hãy mở http://127.0.0.1:8000/docs và kiểm tra Uvicorn đang chạy.');}
  const data=await res.json().catch(()=>null);
  if(!res.ok){
   if(res.status===401&&auth) sessionStorage.removeItem('jobconnect_jwt');
   const detail=data?.detail;
   throw new Error(typeof detail==='string'?detail:Array.isArray(detail)?detail.map(x=>x.msg).join('; '):'API lỗi '+res.status);
  }
  return data;
 },
 async refresh(){
  const token=sessionStorage.getItem('jobconnect_jwt');
  let me=null;
  if(token){try{me=await this.request('/auth/me');}catch{sessionStorage.removeItem('jobconnect_jwt');}}
  state.user=me?{email:me.email,name:me.full_name,role:({candidate:'Candidate',recruiter:'Recruiter',admin:'Admin'})[me.role]}:null;
  const a=me?{name:me.full_name,email:me.email,role:state.user.role,saved:[],applications:[],profile:{},company:{}}:null;
  state.accounts=a?[a]:[];this.recruiterApps=[];this.adminUsers=[];
  const all=await this.request('/api/jobs');
  let combined=[...all];
  if(me?.role==='candidate'){
   const [saved,applications,profile]=await Promise.all([this.request('/api/saved'),this.request('/api/applications/my'),this.request('/candidate/profile')]);
   a.saved=saved;
   a.profile={...profile,skills:(profile.skills||[]).join(', ')};
   a.applications=applications.map(x=>({id:x.id,jobId:x.job_id,date:x.applied_at,status:this.normalizeStatus(x.status),cvName:'CV lưu trên trình duyệt'}));
  }else if(me?.role==='recruiter'){
   const [own,company,apps]=await Promise.all([this.request('/api/jobs/mine'),this.request('/company/profile'),this.request('/api/recruiter/applications')]);
   combined.push(...own);
   a.company={name:company.company_name||'',address:company.address||'',description:company.description||'',logo:company.logo_url||''};
   this.recruiterApps=apps;
  }else if(me?.role==='admin'){
   const [allJobs,users]=await Promise.all([this.request('/api/admin/jobs'),this.request('/api/admin/users')]);
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
  jobs.splice(0,jobs.length,...map.values());
  if(typeof render==='function')render();if(typeof portalRender==='function')portalRender();
 },
};
JobAPI.refresh().catch(e=>{console.error(e);jobs.splice(0,jobs.length);if(typeof render==='function')render();toast('Backend chưa kết nối: '+e.message);});
