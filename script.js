
const SUPABASE_URL = "https://qqczmweakaegflvcpnrq.supabase.co";
const SUPABASE_KEY = "sb_publishable_6UX7lqrRNm7-exhxypjHJw_jyCtCbuw";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const initialTasks = [
  {
    id: 1,
    title: "Mempelajari alur kerja tim",
    category: "Orientasi",
    deadline: "2026-10-15",
    priority: "medium",
    status: "completed"
  },
  {
    id: 2,
    title: "Membuat laporan mingguan",
    category: "Administrasi",
    deadline: "2026-10-16",
    priority: "high",
    status: "progress"
  },
  {
    id: 3,
    title: "Merapikan dokumentasi",
    category: "Dokumentasi",
    deadline: "2026-10-17",
    priority: "medium",
    status: "progress"
  },
  {
    id: 4,
    title: "Mempelajari tools kerja",
    category: "Pengembangan",
    deadline: "2026-10-19",
    priority: "low",
    status: "pending"
  },
  {
    id: 5,
    title: "Evaluasi hasil pekerjaan",
    category: "Evaluasi",
    deadline: "2026-10-20",
    priority: "high",
    status: "completed"
  }
];
let tasks = [];

async function loadTasks() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil tugas:", error.message);
    return;
  }

  tasks = (data || []).map(task => ({
    id: task.id,
    title: task.title,
    category: task.category || "Umum",
    deadline: task.due_date || "",
    priority: task.priority || "medium",
    status: task.status || "pending"
  }));

  renderTasks();
}

const statusLabels = {
  pending: "Belum mulai",
  progress: "Berjalan",
  completed: "Selesai"
};

const priorityLabels = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi"
};

const tableBody = document.getElementById("taskTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const emptyState = document.getElementById("emptyState");
const taskDialog = document.getElementById("taskDialog");
const taskForm = document.getElementById("taskForm");
const activityList = document.getElementById("activityList");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function updateStatistics() {
  document.getElementById("totalTasks").textContent = tasks.length;

  document.getElementById("completedTasks").textContent =
    tasks.filter(task => task.status === "completed").length;

  document.getElementById("progressTasks").textContent =
    tasks.filter(task => task.status === "progress").length;

  document.getElementById("pendingTasks").textContent =
    tasks.filter(task => task.status === "pending").length;
}

function renderTasks() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredTasks = tasks.filter(task => {
    const matchesKeyword =
      task.title.toLowerCase().includes(keyword) ||
      task.category.toLowerCase().includes(keyword);

    const matchesStatus =
      selectedStatus === "all" || task.status === selectedStatus;

    return matchesKeyword && matchesStatus;
  });

  tableBody.innerHTML = filteredTasks.map(task => `
    <tr>
      <td>
        <div class="task-name">${escapeHTML(task.title)}</div>
        <div class="task-category">${escapeHTML(task.category || "Umum")}</div>
      </td>
      <td>${formatDate(task.deadline)}</td>
      <td>
        <span class="priority ${task.priority}">
          ${priorityLabels[task.priority]}
        </span>
      </td>
      <td>
        <select
          class="status-select"
          data-id="${task.id}"
          aria-label="Ubah status ${escapeHTML(task.title)}"
        >
          ${Object.entries(statusLabels).map(([value, label]) => `
            <option value="${value}" ${task.status === value ? "selected" : ""}>
              ${label}
            </option>
          `).join("")}
        </select>
      </td>
      <td>
        <button class="text-button delete-task" data-id="${task.id}" type="button">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  // Gunakan gaya status yang sama pada pilihan status di tabel.
  tableBody.querySelectorAll(".status-select").forEach(select => {
    select.style.border = "1px solid #e8edf5";
    select.style.borderRadius = "6px";
    select.style.padding = "6px";
    select.style.background = "#fff";
    select.style.color = "#526176";
    select.style.fontSize = "11px";
  });

  emptyState.hidden = filteredTasks.length > 0;
  updateStatistics();
}

function addActivity(title, description) {
  const item = document.createElement("div");
  item.className = "activity-item";

  const dot = document.createElement("span");
  dot.className = "activity-dot dot-blue";

  const content = document.createElement("div");
  const heading = document.createElement("strong");
  const detail = document.createElement("p");

  heading.textContent = title;
  detail.textContent = description;

  content.append(heading, detail);

  const time = document.createElement("span");
  time.className = "activity-time";
  time.textContent = "Baru saja";

  item.append(dot, content, time);
  activityList.prepend(item);
}

document.getElementById("addTaskButton").addEventListener("click", () => {
  taskForm.reset();
  taskDialog.showModal();
});

function closeTaskDialog() {
  taskDialog.close();
}

document.getElementById("closeDialog").addEventListener("click", closeTaskDialog);
document.getElementById("cancelDialog").addEventListener("click", closeTaskDialog);

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(taskForm);
  const title = String(formData.get("title") || "").trim();

  if (!title) return;

  const task = {
    id: Date.now(),
    title,
    category: String(formData.get("category") || "").trim() || "Umum",
    deadline: String(formData.get("deadline") || ""),
    priority: String(formData.get("priority") || "medium"),
    status: String(formData.get("status") || "pending")
  };

  tasks.unshift(task);

  addActivity(task.title, "Tugas baru berhasil ditambahkan.");
  taskDialog.close();
  renderTasks();
});

searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);

tableBody.addEventListener("change", event => {
  if (!event.target.matches(".status-select")) return;

  const id = Number(event.target.dataset.id);
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  task.status = event.target.value;

  addActivity(
    task.title,
    `Status tugas diubah menjadi ${statusLabels[task.status]}.`
  );

  renderTasks();
});

tableBody.addEventListener("click", event => {
  const button = event.target.closest(".delete-task");

  if (!button) return;

  const id = Number(button.dataset.id);
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  const confirmed = window.confirm(
    `Yakin ingin menghapus tugas "${task.title}"?`
  );

  if (!confirmed) return;

  tasks = tasks.filter(item => item.id !== id);

  addActivity(task.title, "Tugas dihapus dari daftar.");
  renderTasks();
});

loadTasks();
