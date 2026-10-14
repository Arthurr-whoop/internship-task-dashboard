const SUPABASE_URL = "https://qqczmweakaegflvcpnrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_6UX7lqrRNm7-exhxypjHJw_jyCtCbuw";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null, currentRole = "user", tasks = [];
const statusLabels = {pending:"Belum mulai",progress:"Berjalan",completed:"Selesai"};
const priorityLabels = {low:"Rendah",medium:"Sedang",high:"Tinggi"};
const $ = id => document.getElementById(id);
function message(el, text, ok=false){el.textContent=text||"";el.classList.toggle("success",ok)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function admin(){return currentRole==="admin"}
function dateText(v){if(!v)return "—";const d=new Date(v+"T00:00:00");return Number.isNaN(d.getTime())?"—":d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}
function stats(){$("totalTasks").textContent=tasks.length;$("completedTasks").textContent=tasks.filter(t=>t.status==="completed").length;$("progressTasks").textContent=tasks.filter(t=>t.status==="progress").length;$("pendingTasks").textContent=tasks.filter(t=>t.status==="pending").length}
function render(){
 const q=$("searchInput").value.trim().toLowerCase(), st=$("statusFilter").value;
 const rows=tasks.filter(t=>(`${t.title} ${t.category}`.toLowerCase().includes(q))&&(st==="all"||t.status===st));
 $("taskTableBody").innerHTML=rows.map(t=>`<tr><td><div class="task-name">${esc(t.title)}</div><div class="task-category">${esc(t.category||"Umum")}</div></td><td>${dateText(t.deadline)}</td><td><span class="priority ${esc(t.priority)}">${esc(priorityLabels[t.priority]||"Sedang")}</span></td><td>${admin()?`<select class="status-select" data-id="${esc(t.id)}">${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${v===t.status?"selected":""}>${l}</option>`).join("")}</select>`:`<span class="status-text ${esc(t.status)}">${esc(statusLabels[t.status]||t.status)}</span>`}</td><td>${admin()?`<button class="text-button edit-task" data-id="${esc(t.id)}">Edit</button><button class="text-button delete-task" data-id="${esc(t.id)}">Hapus</button>`:"—"}</td></tr>`).join("");
 $("emptyState").hidden=rows.length>0;stats();
}
async function loadProfile(user){
 const {data,error}=await supabaseClient.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(error)throw Error("Gagal membaca profil: "+error.message);
 if(!data)throw Error("Profil akun ini belum dibuat di tabel profiles. Minta admin menambahkan ID akun dengan role user atau admin.");
 currentRole=data.role==="admin"?"admin":"user";
}
async function loadTasks(){
 message($("pageMessage"),"Memuat tugas...");
 const {data,error}=await supabaseClient.from("tasks").select("*").order("created_at",{ascending:false});
 if(error){message($("pageMessage"),"Gagal memuat tugas: "+error.message);tasks=[];render();return}
 tasks=(data||[]).map(r=>({id:r.id,title:r.title||"",category:r.category||"Umum",deadline:r.due_date||"",priority:r.priority||"medium",status:r.status||"pending"}));
 message($("pageMessage"),"");render();
}
async function openSession(user){
 try{await loadProfile(user);currentUser=user;$("authView").hidden=true;$("appView").hidden=false;$("userEmail").textContent=user.email||"Pengguna";$("avatarLetter").textContent=(user.email||"U")[0].toUpperCase();$("userRole").textContent=admin()?"Administrator":"Pengguna";$("accessBadge").textContent=admin()?"ADMIN ACCESS":"USER ACCESS";$("addTaskButton").hidden=!admin();$("actionHeader").textContent=admin()?"AKSI":"AKSES";await loadTasks()}
 catch(e){$("appView").hidden=true;$("authView").hidden=false;message($("authMessage"),e.message)}
}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();const b=$("loginForm").querySelector("button");b.disabled=true;message($("authMessage"),"Memeriksa akun...");const {data,error}=await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});b.disabled=false;if(error){message($("authMessage"),"Login gagal: "+error.message);return}message($("authMessage"),"");await openSession(data.user)});
$("logoutButton").addEventListener("click",async()=>{const {error}=await supabaseClient.auth.signOut();if(error){message($("pageMessage"),"Gagal logout: "+error.message);return}currentUser=null;currentRole="user";tasks=[];$("appView").hidden=true;$("authView").hidden=false;$("loginForm").reset()});
$("refreshButton").addEventListener("click",loadTasks);$("searchInput").addEventListener("input",render);$("statusFilter").addEventListener("change",render);
function closeDialog(){$("taskDialog").close()}
$("closeDialog").addEventListener("click",closeDialog);$("cancelDialog").addEventListener("click",closeDialog);
$("addTaskButton").addEventListener("click",()=>{if(!admin())return;$("taskForm").reset();$("dialogTitle").textContent="Tambah tugas";$("taskForm").dataset.mode="add";delete $("taskForm").dataset.id;message($("formMessage"),"");$("taskDialog").showModal()});
$("taskForm").addEventListener("submit",async e=>{e.preventDefault();if(!admin()||!currentUser)return;const f=new FormData($("taskForm")),title=String(f.get("title")||"").trim();if(!title){message($("formMessage"),"Nama tugas wajib diisi.");return}
 const payload={title,category:String(f.get("category")||"").trim()||"Umum",due_date:String(f.get("deadline")||"")||null,priority:String(f.get("priority")||"medium"),status:String(f.get("status")||"pending"),user_id:currentUser.id};
 const b=$("taskForm").querySelector('button[type="submit"]');b.disabled=true;message($("formMessage"),"Menyimpan...");
 const result=$("taskForm").dataset.mode==="edit"?await supabaseClient.from("tasks").update(payload).eq("id",$("taskForm").dataset.id).select().single():await supabaseClient.from("tasks").insert(payload).select().single();
 b.disabled=false;if(result.error){message($("formMessage"),"Gagal menyimpan: "+result.error.message);return}closeDialog();await loadTasks()});
$("taskTableBody").addEventListener("change",async e=>{if(!e.target.matches(".status-select")||!admin())return;const {error}=await supabaseClient.from("tasks").update({status:e.target.value}).eq("id",e.target.dataset.id);if(error){message($("pageMessage"),"Gagal mengubah status: "+error.message);await loadTasks();return}await loadTasks()});
$("taskTableBody").addEventListener("click",async e=>{if(!admin())return;const edit=e.target.closest(".edit-task"),del=e.target.closest(".delete-task");if(edit){const t=tasks.find(x=>String(x.id)===edit.dataset.id);if(!t)return;$("taskForm").reset();$("dialogTitle").textContent="Edit tugas";$("taskForm").dataset.mode="edit";$("taskForm").dataset.id=t.id;$("taskForm").elements.title.value=t.title;$("taskForm").elements.category.value=t.category||"";$("taskForm").elements.deadline.value=t.deadline||"";$("taskForm").elements.priority.value=t.priority||"medium";$("taskForm").elements.status.value=t.status||"pending";message($("formMessage"),"");$("taskDialog").showModal()}else if(del){const t=tasks.find(x=>String(x.id)===del.dataset.id);if(!t||!confirm(`Yakin menghapus tugas "${t.title}"?`))return;const {error}=await supabaseClient.from("tasks").delete().eq("id",t.id);if(error){message($("pageMessage"),"Gagal menghapus: "+error.message);return}await loadTasks()}});
(async()=>{const {data,error}=await supabaseClient.auth.getSession();if(error){message($("authMessage"),error.message);return}if(data.session?.user)await openSession(data.session.user)})();
supabaseClient.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"||!session){$("appView").hidden=true;$("authView").hidden=false}});
