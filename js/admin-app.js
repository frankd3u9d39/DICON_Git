/**
 * DICON GITH — Administrator Dashboard Logic
 * Role-Based Access Control, Review Queue, Status Transitions, Audit Logs
 */

import { authService, DEFAULT_ACCOUNTS } from './auth-service.js';
import { storage } from './storage.js';
import { GITH_CATEGORIES, NIGERIAN_STATES } from './data.js';
import { firebaseService } from './firebase-config.js';

class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.activeApplication = null;
    this.auditLogs = JSON.parse(localStorage.getItem('dicon_gith_audit_logs') || '[]');

    this.init();
  }

  async init() {
    // 1. RBAC Guard: Strictly allow 'admin' and 'super_admin'
    const user = authService.getCurrentUser();

    if (!user || !user.uid) {
      window.location.href = '/login?redirect=/admin';
      return;
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      alert("Access Denied: The GITH Administrator Workspace requires authorized security credentials. Redirecting to your Innovator Portal.");
      window.location.href = '/dashboard';
      return;
    }

    this.currentUser = user;

    // 2. Setup UI
    this.bindSidebarEvents();
    this.populateDropdowns();
    this.bindHashRouting();
    this.bindReviewDrawerEvents();

    // 3. Render Admin Data
    this.renderAdminProfile();
    this.renderMetricsAndOverview();
    this.renderApplicationsTable();
    this.renderInnovatorsDirectory();
    this.renderAnalytics();
    this.renderCategories();
    this.renderAuditLogs();

    // 4. Initial Route
    const initialHash = window.location.hash || '#admin-overview';
    this.navigateToView(initialHash.replace('#', ''));
  }

  // ---- NAVIGATION & VIEW SWITCHING ----
  bindSidebarEvents() {
    // Mobile Drawer Toggle
    const mobileBtn = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('dashboard-sidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await authService.logout();
        window.location.href = '/login';
      });
    }
  }

  bindHashRouting() {
    window.addEventListener('hashchange', () => {
      const hash = (window.location.hash || '#admin-overview').replace('#', '');
      this.navigateToView(hash);
    });
  }

  navigateToView(hash) {
    let viewName = hash;
    let filterStatus = 'all';

    // Map sub-queues to applications view
    if (hash === 'admin-new') {
      viewName = 'admin-applications';
      filterStatus = 'submitted';
    } else if (hash === 'admin-screening') {
      viewName = 'admin-applications';
      filterStatus = 'screening';
    } else if (hash === 'admin-verification') {
      viewName = 'admin-applications';
      filterStatus = 'verification';
    } else if (hash === 'admin-shortlisted') {
      viewName = 'admin-applications';
      filterStatus = 'shortlisted';
    } else if (hash === 'admin-selected') {
      viewName = 'admin-applications';
      filterStatus = 'selected';
    }

    const targetId = viewName.startsWith('admin-view-') ? viewName : `admin-view-${viewName.replace('admin-', '')}`;
    const targetEl = document.getElementById(targetId);

    if (!targetEl) {
      this.navigateToView('admin-overview');
      return;
    }

    // Switch view sections
    document.querySelectorAll('.dashboard-view').forEach(v => v.classList.remove('active'));
    targetEl.classList.add('active');

    // Update active nav item
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      const itemHash = (item.querySelector('a')?.getAttribute('href') || '').replace('#', '');
      if (itemHash === hash || item.getAttribute('data-view') === targetId && filterStatus === 'all') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Topbar Title
    const titleMap = {
      'admin-overview': 'GITH Administration Dashboard',
      'admin-applications': 'National Applications Registry',
      'admin-new': 'New Incoming Submissions',
      'admin-screening': 'Screening Technical Queue',
      'admin-verification': 'Verification & Site Review',
      'admin-shortlisted': 'Shortlisted Candidates',
      'admin-selected': 'National Selected Innovators',
      'admin-innovators': 'Registered Innovators Directory',
      'admin-analytics': 'Reports & Geographic Distribution',
      'admin-categories': 'GITH Category Taxonomy',
      'admin-audit': 'Immutable Audit Logs'
    };
    const titleEl = document.getElementById('admin-topbar-title');
    if (titleEl) {
      titleEl.textContent = titleMap[hash] || 'GITH Administration';
    }

    // Set filter if navigating to filtered application queue
    if (viewName === 'admin-applications' || targetId === 'admin-view-applications') {
      const statusFilterEl = document.getElementById('admin-apps-status-filter');
      if (statusFilterEl) {
        statusFilterEl.value = filterStatus;
      }
      this.renderApplicationsTable();
    }

    // Auto-close mobile sidebar
    const sidebar = document.getElementById('dashboard-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Refresh metrics when overview opens
    if (targetId === 'admin-view-overview') this.renderMetricsAndOverview();
  }

  renderAdminProfile() {
    const user = this.currentUser;
    if (!user) return;

    document.getElementById('admin-user-name').textContent = user.fullName || 'Col. M. A. Danjuma';
    document.getElementById('admin-user-role').textContent = `${user.designation || 'Director'} • DICON`;
    if (user.photoUrl) {
      document.getElementById('admin-avatar').src = user.photoUrl;
    }
  }

  // ---- METRICS & OVERVIEW ----
  renderMetricsAndOverview() {
    const allInnos = storage.getInnovations();
    const registry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');

    const totalInnovators = Math.max(registry.length, 1);
    const totalInnos = allInnos.length;
    const newInnos = allInnos.filter(i => i.status === 'submitted').length;
    const inReview = allInnos.filter(i => ['screening', 'verification', 'assessment'].includes(i.status)).length;
    const shortlisted = allInnos.filter(i => i.status === 'shortlisted').length;
    const selected = allInnos.filter(i => i.status === 'selected').length;

    // Badges & stat cards
    document.getElementById('admin-stat-innovators').textContent = totalInnovators;
    document.getElementById('admin-stat-total-innos').textContent = totalInnos;
    document.getElementById('admin-stat-new-innos').textContent = newInnos;
    document.getElementById('admin-stat-in-review').textContent = inReview;
    document.getElementById('admin-stat-shortlisted').textContent = shortlisted;
    document.getElementById('admin-stat-selected').textContent = selected;

    document.getElementById('admin-badge-all').textContent = totalInnos;
    document.getElementById('admin-badge-new').textContent = newInnos;

    // Populate Overview Table (Recent 5 awaiting review)
    const tbody = document.getElementById('admin-overview-tbody');
    tbody.innerHTML = '';

    if (allInnos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--muted-gray);">No applications recorded in the national database.</td></tr>`;
      return;
    }

    allInnos.slice(0, 6).forEach(inno => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code style="font-weight:700; color:var(--deep-forest); font-size:12px;">${inno.referenceNumber}</code></td>
        <td><strong>${this.escapeHtml(inno.innovationName)}</strong></td>
        <td>${this.escapeHtml(inno.innovatorName || 'Innovator')}</td>
        <td>${this.escapeHtml(inno.state || 'Nigeria')}</td>
        <td>${this.escapeHtml(inno.category)}</td>
        <td><span class="status-pill pill-${inno.status}">${inno.status}</span></td>
        <td>
          <button class="btn-table-action" data-inno-id="${inno.innovationId}">Review</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', () => {
        this.openReviewDrawer(inno.innovationId);
      });

      tbody.appendChild(tr);
    });
  }

  // ---- APPLICATIONS REGISTRY TABLE ----
  renderApplicationsTable() {
    let innos = storage.getInnovations();

    const searchInput = document.getElementById('admin-apps-search');
    const catFilter = document.getElementById('admin-apps-cat-filter');
    const stateFilter = document.getElementById('admin-apps-state-filter');
    const statusFilter = document.getElementById('admin-apps-status-filter');

    const term = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const cat = catFilter ? catFilter.value : 'all';
    const state = stateFilter ? stateFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';

    if (term) {
      innos = innos.filter(i =>
        i.innovationName.toLowerCase().includes(term) ||
        i.referenceNumber.toLowerCase().includes(term) ||
        (i.innovatorName || '').toLowerCase().includes(term) ||
        (i.state || '').toLowerCase().includes(term)
      );
    }

    if (cat !== 'all') innos = innos.filter(i => i.category === cat);
    if (state !== 'all') innos = innos.filter(i => i.state === state);
    if (status !== 'all') innos = innos.filter(i => i.status === status);

    const tbody = document.getElementById('admin-apps-tbody');
    tbody.innerHTML = '';

    if (innos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--muted-gray);">No applications match the selected criteria.</td></tr>`;
      return;
    }

    innos.forEach(inno => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code style="font-weight:700; color:var(--deep-forest); font-size:12px;">${inno.referenceNumber}</code></td>
        <td><strong>${this.escapeHtml(inno.innovationName)}</strong></td>
        <td>${this.escapeHtml(inno.innovatorName || 'Innovator')}</td>
        <td>${this.escapeHtml(inno.category)}</td>
        <td>${this.escapeHtml(inno.state || 'Nigeria')}</td>
        <td><span style="font-size:12px; color:var(--charcoal);">${inno.developmentStage || 'Prototype'}</span></td>
        <td><span class="status-pill pill-${inno.status}">${inno.status}</span></td>
        <td>
          <button class="btn-table-action" data-inno-id="${inno.innovationId}">Review</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', () => {
        this.openReviewDrawer(inno.innovationId);
      });

      tbody.appendChild(tr);
    });

    if (!this._adminFiltersBound) {
      if (searchInput) searchInput.addEventListener('input', () => this.renderApplicationsTable());
      if (catFilter) catFilter.addEventListener('change', () => this.renderApplicationsTable());
      if (stateFilter) stateFilter.addEventListener('change', () => this.renderApplicationsTable());
      if (statusFilter) statusFilter.addEventListener('change', () => this.renderApplicationsTable());
      this._adminFiltersBound = true;
    }
  }

  // ---- REVIEW DRAWER (MODAL) ----
  bindReviewDrawerEvents() {
    const backdrop = document.getElementById('review-drawer-backdrop');
    const closeBtn = document.getElementById('modal-close-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        backdrop.classList.remove('active');
      });
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });

    // Action buttons in footer
    document.querySelectorAll('.btn-admin-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nextStatus = e.currentTarget.getAttribute('data-status');
        this.executeStatusTransition(nextStatus);
      });
    });
  }

  openReviewDrawer(innoId) {
    const inno = storage.getInnovationById(innoId);
    if (!inno) return;

    this.activeApplication = inno;

    document.getElementById('modal-app-title').textContent = inno.innovationName;
    document.getElementById('modal-ref-num').textContent = inno.referenceNumber;
    document.getElementById('modal-innovator-name').textContent = inno.innovatorName || 'Grassroots Innovator';
    document.getElementById('modal-location').textContent = `${inno.lga ? inno.lga + ', ' : ''}${inno.state || 'Nigeria'}`;
    document.getElementById('modal-category').textContent = inno.category;
    document.getElementById('modal-stage').textContent = inno.developmentStage || 'Prototype';

    const pill = document.getElementById('modal-status-pill');
    pill.className = `status-pill pill-${inno.status}`;
    pill.textContent = inno.status;

    document.getElementById('modal-problem').textContent = inno.problemDescription || 'No problem statement provided.';
    document.getElementById('modal-solution').textContent = inno.solutionDescription || 'No solution description provided.';
    document.getElementById('modal-uniqueness').textContent = inno.uniqueness || 'No uniqueness detailed.';
    document.getElementById('modal-ip-status').textContent = inno.ipStatus || 'Not Yet Registered';
    document.getElementById('modal-ip-support').textContent = inno.requiresIpSupport ? 'Yes (Requested)' : 'No';

    document.getElementById('modal-eval-note').value = '';

    // Render Status History
    this.renderStatusHistory(inno);

    document.getElementById('review-drawer-backdrop').classList.add('active');
  }

  renderStatusHistory(inno) {
    const historyList = document.getElementById('modal-status-history');
    historyList.innerHTML = '';

    const logs = this.auditLogs.filter(l => l.referenceNumber === inno.referenceNumber);

    if (logs.length === 0) {
      historyList.innerHTML = `
        <li class="activity-item">
          <div class="activity-dot"></div>
          <div class="activity-title">Application Submitted</div>
          <div class="activity-desc">Initial submission recorded into the GITH registry.</div>
          <div class="activity-time">${new Date(inno.submittedAt || inno.createdAt).toLocaleString()}</div>
        </li>
      `;
      return;
    }

    logs.forEach(log => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `
        <div class="activity-dot"></div>
        <div class="activity-title">${this.escapeHtml(log.actionTitle)} (${this.escapeHtml(log.newStatus)})</div>
        <div class="activity-desc">${this.escapeHtml(log.note || 'Review executed by technical board.')}</div>
        <div class="activity-time">${log.adminName} • ${new Date(log.timestamp).toLocaleString()}</div>
      `;
      historyList.appendChild(li);
    });
  }

  executeStatusTransition(nextStatus) {
    if (!this.activeApplication) return;

    const inno = this.activeApplication;
    const note = document.getElementById('modal-eval-note').value.trim();

    // Enforce note for sensitive transitions
    if (['returned', 'rejected'].includes(nextStatus) && !note) {
      alert(`An administrative evaluation note is required when returning or rejecting an application.`);
      return;
    }

    if (!confirm(`Are you sure you want to transition '${inno.innovationName}' to status: [${nextStatus.toUpperCase()}]?`)) {
      return;
    }

    const prevStatus = inno.status;
    const now = new Date().toISOString();

    // 1. Update in-memory and local storage
    inno.status = nextStatus;
    inno.updatedAt = now;

    const allInnos = storage.getInnovations();
    const targetIdx = allInnos.findIndex(i => i.innovationId === inno.innovationId);
    if (targetIdx !== -1) {
      allInnos[targetIdx] = inno;
      localStorage.setItem('dicon_gith_innovations', JSON.stringify(allInnos));
    }

    // 2. Sync to live Firestore if connected
    if (firebaseService.isLiveConnected && firebaseService.db) {
      firebaseService.saveInnovationDoc(inno.innovationId, {
        status: nextStatus,
        updatedAt: now,
        lastReviewedBy: this.currentUser.fullName || this.currentUser.email
      }).catch(err => console.warn("Firestore sync:", err));
    }

    // 3. Record Audit Log
    const auditRecord = {
      logId: `audit-${Date.now()}`,
      referenceNumber: inno.referenceNumber,
      innovationId: inno.innovationId,
      adminName: this.currentUser.fullName || 'Admin',
      adminEmail: this.currentUser.email,
      prevStatus,
      newStatus: nextStatus,
      actionTitle: `Moved to ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`,
      note: note || `Review action executed by ${this.currentUser.fullName || 'Administrator'}.`,
      timestamp: now
    };

    this.auditLogs.unshift(auditRecord);
    localStorage.setItem('dicon_gith_audit_logs', JSON.stringify(this.auditLogs));

    // 4. Notify Innovator
    storage.addNotification({
      title: `Application Status Updated: ${nextStatus.toUpperCase()}`,
      message: `Your innovation '${inno.innovationName}' (${inno.referenceNumber}) has moved to '${nextStatus}'. ${note ? 'Note: ' + note : ''}`,
      type: "status_update"
    });

    // 5. Update UI
    this.openReviewDrawer(inno.innovationId);
    this.renderMetricsAndOverview();
    this.renderApplicationsTable();
    this.renderAuditLogs();

    alert(`Success: '${inno.innovationName}' successfully updated to ${nextStatus.toUpperCase()}.`);
  }

  // ---- INNOVATORS DIRECTORY ----
  renderInnovatorsDirectory() {
    const tbody = document.getElementById('admin-innovators-tbody');
    if (!tbody) return;

    const defaultInnovator = DEFAULT_ACCOUNTS.INNOVATOR;
    const registry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');

    const allUsers = [defaultInnovator, ...registry.filter(u => u.uid !== defaultInnovator.uid)];
    const searchInput = document.getElementById('admin-innovators-search');
    const term = (searchInput ? searchInput.value : '').toLowerCase().trim();

    let filtered = allUsers;
    if (term) {
      filtered = allUsers.filter(u =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.state || '').toLowerCase().includes(term)
      );
    }

    tbody.innerHTML = '';
    filtered.forEach(u => {
      const userInnos = storage.getInnovations(u.uid);
      const completion = storage.calculateProfileCompletion(u);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:700;">${this.escapeHtml(u.fullName)}</div>
          <div style="font-size:11px; color:var(--muted-gray);">${u.role}</div>
        </td>
        <td>${this.escapeHtml(u.email)}</td>
        <td>${this.escapeHtml(u.state || 'Unassigned')} ${u.lga ? `(${u.lga})` : ''}</td>
        <td>${this.escapeHtml(u.occupation || 'Inventor')}</td>
        <td>
          <span style="font-weight:700; color:var(--deep-forest); font-size:12px;">${completion}%</span>
        </td>
        <td><strong>${userInnos.length}</strong></td>
        <td>${new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });

    if (!this._innovatorSearchBound && searchInput) {
      searchInput.addEventListener('input', () => this.renderInnovatorsDirectory());
      this._innovatorSearchBound = true;
    }
  }

  // ---- ANALYTICS & DISTRIBUTION ----
  renderAnalytics() {
    const innos = storage.getInnovations();

    // Submissions by Category
    const catCounts = {};
    innos.forEach(i => {
      catCounts[i.category] = (catCounts[i.category] || 0) + 1;
    });

    const catChart = document.getElementById('analytics-category-chart');
    if (catChart) {
      catChart.innerHTML = '';
      const total = Math.max(innos.length, 1);
      Object.keys(catCounts).forEach(cat => {
        const cnt = catCounts[cat];
        const pct = Math.round((cnt / total) * 100);

        const row = document.createElement('div');
        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:4px;">
            <span>${cat}</span>
            <span>${cnt} (${pct}%)</span>
          </div>
          <div style="height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:var(--deep-forest); border-radius:4px;"></div>
          </div>
        `;
        catChart.appendChild(row);
      });
    }

    // Submissions by State
    const stateCounts = {};
    innos.forEach(i => {
      const st = i.state || 'Unspecified';
      stateCounts[st] = (stateCounts[st] || 0) + 1;
    });

    const stateChart = document.getElementById('analytics-state-chart');
    if (stateChart) {
      stateChart.innerHTML = '';
      const total = Math.max(innos.length, 1);
      Object.keys(stateCounts).forEach(st => {
        const cnt = stateCounts[st];
        const pct = Math.round((cnt / total) * 100);

        const row = document.createElement('div');
        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:4px;">
            <span>${st} State</span>
            <span>${cnt} (${pct}%)</span>
          </div>
          <div style="height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:var(--primary-green); border-radius:4px;"></div>
          </div>
        `;
        stateChart.appendChild(row);
      });
    }
  }

  // ---- CATEGORIES ----
  renderCategories() {
    const container = document.getElementById('admin-categories-list');
    if (!container) return;

    container.innerHTML = '';
    GITH_CATEGORIES.forEach(cat => {
      const card = document.createElement('div');
      card.style.padding = '10px 14px';
      card.style.background = 'var(--surface-alt)';
      card.style.border = '1px solid var(--border)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';

      card.innerHTML = `
        <span style="font-size:13px; font-weight:700;">${cat}</span>
        <span style="font-size:10px; font-weight:800; color:var(--deep-forest); background:var(--soft-pale-green); padding:2px 6px; border-radius:4px;">ACTIVE</span>
      `;
      container.appendChild(card);
    });
  }

  // ---- AUDIT TRAIL ----
  renderAuditLogs() {
    const tbody = document.getElementById('admin-audit-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.auditLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:var(--muted-gray);">No audit log events recorded yet. Perform an application status change to generate logs.</td></tr>`;
      return;
    }

    this.auditLogs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td><strong>${this.escapeHtml(log.adminName)}</strong></td>
        <td>${this.escapeHtml(log.actionTitle)}</td>
        <td><code>${log.referenceNumber}</code></td>
        <td>
          <span style="font-size:11px; color:var(--muted-gray);">${log.prevStatus}</span> → 
          <span class="status-pill pill-${log.newStatus}">${log.newStatus}</span>
        </td>
        <td style="font-size:12px; color:var(--charcoal);">${this.escapeHtml(log.note || '-')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ---- METADATA DROPDOWNS ----
  populateDropdowns() {
    const stateFilter = document.getElementById('admin-apps-state-filter');
    if (stateFilter) {
      NIGERIAN_STATES.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        stateFilter.appendChild(opt);
      });
    }

    const catFilter = document.getElementById('admin-apps-cat-filter');
    if (catFilter) {
      GITH_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catFilter.appendChild(opt);
      });
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Instantiate admin on load
document.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});
