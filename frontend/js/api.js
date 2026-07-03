// ---- Config ----
// Use the same hostname the page was loaded from, so this works whether you open
// it as localhost OR as your laptop's network IP (e.g. from a phone on the same WiFi).
const API_BASE = `http://${window.location.hostname}:5000/api`;
const SOCKET_BASE = `http://${window.location.hostname}:5000`;

// ---- Token / Session helpers ----
function saveSession(token, user) {
  localStorage.setItem('cms_token', token);
  localStorage.setItem('cms_user', JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem('cms_token');
}

function getUser() {
  const raw = localStorage.getItem('cms_user');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  window.location.href = 'login.html';
}

// Redirect to login if not authenticated; optionally enforce a role
function requireAuth(requiredRole) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = 'login.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    alert('Access denied for your role');
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ---- API wrapper ----
async function apiRequest(path, { method = 'GET', body = null, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : null
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

// ---- UI helpers ----
function showError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearMessage(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function statusBadge(status) {
  const cls = status.replace(/\s+/g, '-');
  return `<span class="badge badge-${cls}">${status}</span>`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

// Open a complaint's details page reliably even if the host strips query strings
function goToComplaint(id) {
  sessionStorage.setItem('cms_active_complaint', id);
  window.location.href = 'complaint-details.html?id=' + id;
}

function goToFeedback(id) {
  sessionStorage.setItem('cms_active_complaint', id);
  window.location.href = 'feedback.html?id=' + id;
}

function renderNavbar(activeUser) {
  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  let links = '';
  if (activeUser.role === 'USER') {
    links = `
      <a href="user-dashboard.html">Dashboard</a>
      <a href="create-complaint.html">New Complaint</a>
    `;
  } else if (activeUser.role === 'AGENT') {
    links = `<a href="agent-dashboard.html">Dashboard</a>`;
  } else if (activeUser.role === 'ADMIN') {
    links = `
      <a href="admin-dashboard.html">Dashboard</a>
      <a href="admin-users.html">Users</a>
      <a href="admin-agents.html">Agents</a>
      <a href="admin-complaints.html">Complaints</a>
    `;
  }

  navEl.innerHTML = `
    <div class="brand">Complaint Management</div>
    <div>
      <span style="margin-right:18px;">${activeUser.name} (${activeUser.role})</span>
      ${links}
      <a href="#" onclick="logout()">Logout</a>
    </div>
  `;
}
