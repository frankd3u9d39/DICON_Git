/**
 * DICON GITH — Administrator Dashboard Logic
 * Role-Based Access Control, Review Queue, Status Transitions, Audit Logs
 */

import { authService, DEFAULT_ACCOUNTS } from './auth-service.js';
import { storage } from './storage.js';
import { GITH_CATEGORIES, NIGERIAN_STATES } from './data.js';
import { firebaseService } from './firebase-config.js';
import { legalContentService } from './legal-content.js';

// Authorized State Machine Transitions
const VALID_TRANSITIONS = {
  submitted: ['screening', 'returned', 'rejected'],
  screening: ['verification', 'returned', 'rejected'],
  verification: ['assessment', 'returned', 'rejected'],
  assessment: ['shortlisted', 'returned', 'rejected'],
  shortlisted: ['selected', 'rejected'],
  selected: ['mentorship', 'incubation'],
  returned: ['screening', 'rejected'],
  rejected: ['screening'],
  mentorship: ['incubation'],
  incubation: []
};

class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.activeApplication = null;
    this.pendingTransitionStatus = null;
    this.toastTimer = null;
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
      window.location.href = '/dashboard';
      return;
    }

    document.documentElement.style.display = '';
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
    this.initPolicyEditor();

    // 4. Initial Route
    const initialHash = window.location.hash || '#admin-overview';
    this.navigateToView(initialHash.replace('#', ''));
  }

  // ---- NAVIGATION & VIEW SWITCHING ----
  bindSidebarEvents() {
    // Mobile Drawer Toggle
    const mobileBtn = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('dashboard-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('mobile-open');
        if (backdrop) backdrop.classList.toggle('active', isOpen);
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
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
      if (itemHash === hash || (item.getAttribute('data-view') === targetId && filterStatus === 'all')) {
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
      'admin-audit': 'Immutable Audit Logs',
      'admin-settings': 'System Policies & Institutional Content'
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
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');

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

    // Populate Overview Table (Recent 6)
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

  // ---- REVIEW DRAWER & CONFIRMATION MODAL ----
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

    // Action buttons in footer -> Validate transition then open modal
    document.querySelectorAll('.btn-admin-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nextStatus = e.currentTarget.getAttribute('data-status');
        if (!this.activeApplication) return;

        const currentStatus = this.activeApplication.status || 'submitted';
        const allowed = VALID_TRANSITIONS[currentStatus] || [];

        if (!allowed.includes(nextStatus)) {
          this.showToast(
            `Transition from ${currentStatus.toUpperCase()} to ${nextStatus.toUpperCase()} is not allowed. Valid next steps: ${allowed.join(', ') || 'None (Terminal)'}`,
            'error'
          );
          return;
        }

        this.openStatusConfirmModal(nextStatus);
      });
    });

    // Confirmation Pop-Up Modal Controls
    const confirmBackdrop = document.getElementById('status-confirm-modal-backdrop');
    const confirmCloseBtn = document.getElementById('btn-close-confirm-modal');
    const confirmCancelBtn = document.getElementById('btn-cancel-confirm-modal');
    const confirmSubmitBtn = document.getElementById('btn-submit-confirm-modal');
    const confirmNoteInput = document.getElementById('confirm-modal-note');

    if (confirmCloseBtn) {
      confirmCloseBtn.addEventListener('click', () => this.closeStatusConfirmModal());
    }
    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener('click', () => this.closeStatusConfirmModal());
    }
    if (confirmBackdrop) {
      confirmBackdrop.addEventListener('click', (e) => {
        if (e.target === confirmBackdrop) this.closeStatusConfirmModal();
      });
    }

    if (confirmNoteInput) {
      confirmNoteInput.addEventListener('input', () => {
        const errorEl = document.getElementById('confirm-modal-error');
        if (errorEl) errorEl.style.display = 'none';
        confirmNoteInput.style.borderColor = '';
      });
    }

    if (confirmSubmitBtn) {
      confirmSubmitBtn.addEventListener('click', () => {
        this.submitStatusTransition();
      });
    }
  }

  openStatusConfirmModal(nextStatus) {
    if (!this.activeApplication) return;
    this.pendingTransitionStatus = nextStatus;

    const inno = this.activeApplication;
    const currentStatus = inno.status || 'submitted';

    const statusConfigs = {
      screening: {
        title: 'Move to Technical Screening',
        message: 'Advance this innovation to formal screening to verify document compliance, eligibility, and completeness.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        bg: '#EDE9FE',
        color: '#6D28D9',
        btnText: 'Move to Screening',
        requiredNote: false
      },
      verification: {
        title: 'Move to Field Verification',
        message: 'Schedule and authorize physical site inspection, innovator identity verification, and prototype plausibility checks.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>',
        bg: '#FEF3C7',
        color: '#B45309',
        btnText: 'Move to Verification',
        requiredNote: false
      },
      assessment: {
        title: 'Move to Defense Assessment',
        message: 'Submit candidate details to the Armed Forces Technical Assessment Committee for defense applicability scoring.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        bg: '#DBEAFE',
        color: '#1D4ED8',
        btnText: 'Move to Assessment',
        requiredNote: false
      },
      shortlisted: {
        title: 'Shortlist Candidate for Award',
        message: 'Approve candidate to the official shortlist for final pitch demonstration and high-level evaluation.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
        bg: '#CCFBF1',
        color: '#0F766E',
        btnText: 'Shortlist Candidate',
        requiredNote: false
      },
      selected: {
        title: 'Select for National Defense Award',
        message: 'Formally select this grassroots innovation for the National Defense Innovation Award & R&D incubation contract.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2v20"></path></svg>',
        bg: '#DCFCE7',
        color: '#15803D',
        btnText: 'Confirm Selection',
        requiredNote: false
      },
      returned: {
        title: 'Return Submission for Correction',
        message: 'Reopen this application for editing and notify the innovator to revise required sections.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
        bg: '#FFEDD5',
        color: '#C2410C',
        btnText: 'Return for Correction',
        requiredNote: true
      },
      rejected: {
        title: 'Reject Submission',
        message: 'Formally decline this application from the current talent hunt cycle. Please document the official evaluation reasoning.',
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        bg: '#FEE2E2',
        color: '#B91C1C',
        btnText: 'Reject Submission',
        requiredNote: true
      }
    };

    const cfg = statusConfigs[nextStatus] || {
      title: `Transition to ${nextStatus}`,
      message: `Are you sure you want to transition this innovation to status '${nextStatus.toUpperCase()}'?`,
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      bg: '#E2E8F0',
      color: '#334155',
      btnText: 'Confirm Transition',
      requiredNote: false
    };

    const iconBadge = document.getElementById('confirm-modal-icon');
    if (iconBadge) {
      iconBadge.innerHTML = cfg.icon;
      iconBadge.style.background = cfg.bg;
      iconBadge.style.color = cfg.color;
    }

    const titleEl = document.getElementById('confirm-modal-title');
    if (titleEl) titleEl.textContent = cfg.title;

    const subtitleEl = document.getElementById('confirm-modal-subtitle');
    if (subtitleEl) subtitleEl.textContent = `${inno.innovationName} • Ref: ${inno.referenceNumber}`;

    const fromPill = document.getElementById('confirm-from-status');
    if (fromPill) fromPill.textContent = currentStatus.toUpperCase();

    const toPill = document.getElementById('confirm-to-status');
    if (toPill) {
      toPill.textContent = nextStatus.toUpperCase();
      toPill.style.background = cfg.bg;
      toPill.style.color = cfg.color;
    }

    const msgEl = document.getElementById('confirm-modal-message');
    if (msgEl) msgEl.textContent = cfg.message;

    const reqLabel = document.getElementById('confirm-note-requirement');
    if (reqLabel) {
      reqLabel.textContent = cfg.requiredNote ? '(Required)' : '(Optional)';
      reqLabel.style.color = cfg.requiredNote ? '#DC2626' : 'var(--muted-gray)';
    }

    const noteInput = document.getElementById('confirm-modal-note');
    const drawerNote = document.getElementById('modal-eval-note');
    if (noteInput) {
      noteInput.value = drawerNote ? drawerNote.value.trim() : '';
      noteInput.style.borderColor = '';
    }

    const errorEl = document.getElementById('confirm-modal-error');
    if (errorEl) errorEl.style.display = 'none';

    const submitBtn = document.getElementById('btn-submit-confirm-modal');
    if (submitBtn) {
      submitBtn.textContent = cfg.btnText;
      submitBtn.style.background = cfg.color;
    }

    const backdrop = document.getElementById('status-confirm-modal-backdrop');
    if (backdrop) backdrop.classList.add('active');
  }

  closeStatusConfirmModal() {
    const backdrop = document.getElementById('status-confirm-modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    this.pendingTransitionStatus = null;
  }

  submitStatusTransition() {
    if (!this.pendingTransitionStatus || !this.activeApplication) return;

    const nextStatus = this.pendingTransitionStatus;
    const noteInput = document.getElementById('confirm-modal-note');
    const note = noteInput ? noteInput.value.trim() : '';
    const isSensitive = ['returned', 'rejected'].includes(nextStatus);

    if (isSensitive && !note) {
      const errorEl = document.getElementById('confirm-modal-error');
      if (errorEl) {
        errorEl.textContent = `An administrative evaluation note is required for ${nextStatus === 'returned' ? 'returning' : 'rejecting'} this submission.`;
        errorEl.style.display = 'block';
      }
      if (noteInput) {
        noteInput.style.borderColor = '#DC2626';
        noteInput.focus();
      }
      return;
    }

    this.closeStatusConfirmModal();
    this.executeStatusTransition(nextStatus, note);
  }

  showToast(message, type = 'success') {
    const banner = document.getElementById('admin-toast-banner');
    const msgEl = document.getElementById('admin-toast-message');
    const iconEl = document.getElementById('admin-toast-icon');

    if (!banner || !msgEl) return;

    msgEl.textContent = message;

    if (iconEl) {
      if (type === 'error') {
        iconEl.style.background = '#EF4444';
        iconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      } else {
        iconEl.style.background = '#10B981';
        iconEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      }
    }

    banner.classList.add('active');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      banner.classList.remove('active');
    }, 3800);
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

    // Populate Media & Supporting Documents Section
    const mediaContainer = document.getElementById('modal-media-container');
    if (mediaContainer) {
      mediaContainer.innerHTML = '';

      let hasMedia = false;

      // Images
      if (inno.imageUrls && inno.imageUrls.length > 0) {
        hasMedia = true;
        const imgWrap = document.createElement('div');
        imgWrap.innerHTML = `
          <div style="font-size:12px; font-weight:700; margin-bottom:6px; color:var(--dark-ink);">Prototype Photography:</div>
          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            ${inno.imageUrls.map(url => `
              <a href="${url}" target="_blank" rel="noopener noreferrer">
                <img src="${url}" alt="Prototype preview" style="width:96px; height:72px; object-fit:cover; border-radius:6px; border:1px solid var(--border);">
              </a>
            `).join('')}
          </div>
        `;
        mediaContainer.appendChild(imgWrap);
      }

      // Documents
      if (inno.documentUrls && inno.documentUrls.length > 0) {
        hasMedia = true;
        const docWrap = document.createElement('div');
        docWrap.innerHTML = `
          <div style="font-size:12px; font-weight:700; margin-top:8px; margin-bottom:6px; color:var(--dark-ink);">Technical Documents:</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${inno.documentUrls.map(doc => `
              <div style="display:flex; align-items:center; gap:8px; background:var(--surface-alt); padding:6px 12px; border-radius:6px; border:1px solid var(--border); font-size:12px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                <span style="font-weight:600;">${this.escapeHtml(typeof doc === 'string' ? doc : (doc.name || 'Specification Document'))}</span>
                <span style="color:var(--muted-gray); font-size:11px;">${typeof doc === 'object' && doc.size ? `(${doc.size})` : ''}</span>
              </div>
            `).join('')}
          </div>
        `;
        mediaContainer.appendChild(docWrap);
      }

      // Videos
      if (inno.videoUrls && inno.videoUrls.length > 0) {
        hasMedia = true;
        const vidWrap = document.createElement('div');
        vidWrap.innerHTML = `
          <div style="font-size:12px; font-weight:700; margin-top:8px; margin-bottom:6px; color:var(--dark-ink);">Video Demonstration:</div>
          <div>
            ${inno.videoUrls.map(url => `
              <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--primary-green); text-decoration:underline;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>${this.escapeHtml(url)}</span>
              </a>
            `).join('')}
          </div>
        `;
        mediaContainer.appendChild(vidWrap);
      }

      if (!hasMedia) {
        mediaContainer.innerHTML = `<div style="font-size:12px; color:var(--muted-gray); font-style:italic;">No prototype media, schematics, or video links attached to this submission.</div>`;
      }
    }

    // Configure Authorized Transition Buttons
    const allowedTransitions = VALID_TRANSITIONS[inno.status] || [];
    document.querySelectorAll('.btn-admin-action').forEach(btn => {
      const targetStatus = btn.getAttribute('data-status');
      const isAllowed = allowedTransitions.includes(targetStatus);
      if (isAllowed) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.title = `Advance innovation to ${targetStatus}`;
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.title = `Cannot advance directly from ${inno.status} to ${targetStatus}`;
      }
    });

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

  executeStatusTransition(nextStatus, noteOverride) {
    if (!this.activeApplication) return;

    const inno = this.activeApplication;
    const note = noteOverride !== undefined ? noteOverride : (document.getElementById('modal-eval-note')?.value.trim() || '');

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

    // 4. Notify Innovator (scoped to user)
    storage.addNotification({
      title: `Application Status Updated: ${nextStatus.toUpperCase()}`,
      message: `Your innovation '${inno.innovationName}' (${inno.referenceNumber}) has moved to '${nextStatus}'. ${note ? 'Note: ' + note : ''}`,
      type: "status_update",
      targetUserId: inno.userId
    });

    // 5. Update UI
    this.openReviewDrawer(inno.innovationId);
    this.renderMetricsAndOverview();
    this.renderApplicationsTable();
    this.renderAuditLogs();

    this.showToast(`Status updated: "${inno.innovationName}" is now ${nextStatus.toUpperCase()}`);
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
      const isActive = u.isActive !== false;

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
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn-table-action btn-view-user-apps" style="font-size:11px; padding:4px 8px;">View Apps</button>
            <button class="btn-table-action btn-toggle-user-status" style="font-size:11px; padding:4px 8px; color:${isActive ? 'var(--status-rejected)' : 'var(--primary-green)'};">
              ${isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </td>
      `;

      // View Apps action
      tr.querySelector('.btn-view-user-apps').addEventListener('click', () => {
        window.location.hash = '#admin-applications';
        const searchBox = document.getElementById('admin-apps-search');
        if (searchBox) {
          searchBox.value = u.fullName;
          this.renderApplicationsTable();
        }
      });

      // Toggle status action
      tr.querySelector('.btn-toggle-user-status').addEventListener('click', () => {
        const actionWord = isActive ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${actionWord} the account for ${u.fullName}?`)) {
          u.isActive = !isActive;
          // Update in registry
          const regIdx = registry.findIndex(item => item.uid === u.uid);
          if (regIdx !== -1) {
            registry[regIdx].isActive = u.isActive;
            localStorage.setItem('dicon_gith_users_registry', JSON.stringify(registry));
          }

          // If active user session matches, update session
          const currUser = storage.getUser();
          if (currUser && currUser.uid === u.uid) {
            currUser.isActive = u.isActive;
            storage.setUser(currUser);
          }

          // Record audit log
          this.auditLogs.unshift({
            logId: `audit-${Date.now()}`,
            referenceNumber: 'USER-' + u.uid,
            innovationId: u.uid,
            adminName: this.currentUser.fullName || 'Admin',
            adminEmail: this.currentUser.email,
            prevStatus: isActive ? 'active' : 'deactivated',
            newStatus: u.isActive ? 'active' : 'deactivated',
            actionTitle: `Account ${u.isActive ? 'Activated' : 'Deactivated'}`,
            note: `Administrator altered account status for ${u.fullName} (${u.email}).`,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('dicon_gith_audit_logs', JSON.stringify(this.auditLogs));

          this.renderInnovatorsDirectory();
          this.renderAuditLogs();
          this.showToast(`Account for ${u.fullName} is now ${u.isActive ? 'Active' : 'Deactivated'}.`);
        }
      });

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
      stateFilter.innerHTML = '<option value="all">All States</option>';
      NIGERIAN_STATES.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        stateFilter.appendChild(opt);
      });
    }

    const catFilter = document.getElementById('admin-apps-cat-filter');
    if (catFilter) {
      catFilter.innerHTML = '<option value="all">All Categories</option>';
      GITH_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catFilter.appendChild(opt);
      });
    }
  }

  // ---- SYSTEM POLICIES & INSTITUTIONAL CONTENT EDITOR ----
  async initPolicyEditor() {
    this.activePolicyType = 'privacy';
    this.isPolicyPreviewMode = false;

    const textarea = document.getElementById('admin-policy-textarea');
    const titleEl = document.getElementById('admin-policy-editor-title');
    const subEl = document.getElementById('admin-policy-editor-sub');
    const statsEl = document.getElementById('admin-policy-meta-stats');
    const previewPane = document.getElementById('admin-policy-preview-pane');
    const editPane = document.getElementById('admin-policy-edit-pane');
    const btnEdit = document.getElementById('btn-mode-edit');
    const btnPreview = document.getElementById('btn-mode-preview');
    const btnSave = document.getElementById('btn-admin-policy-save');
    const btnReset = document.getElementById('btn-admin-policy-reset');
    const btnPublicModal = document.getElementById('btn-admin-preview-public');
    const tabs = document.querySelectorAll('.admin-policy-tab');

    if (!textarea) return;

    const updateStats = () => {
      const text = textarea.value || '';
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      if (statsEl) {
        statsEl.textContent = `Characters: ${chars.toLocaleString()} • Words: ${words.toLocaleString()}`;
      }
    };

    const loadPolicy = async (type) => {
      this.activePolicyType = type;
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.policy === type);
      });

      const titles = {
        privacy: { title: 'Privacy Policy Editor', sub: 'Governs personal data protection, Section 11 Data Security & Section 12 Data Breaches' },
        terms: { title: 'Terms & Conditions Editor', sub: 'Governs participation rules, Section 20 Indemnity, Dispute Resolution, and DICON GITH mandate' },
        about: { title: 'About GITH Institutional Charter Editor', sub: 'The complete 11-section framework, DICON partnership, and innovation development pathway' }
      };

      if (titleEl) titleEl.textContent = titles[type]?.title || 'Policy Editor';
      if (subEl) subEl.textContent = titles[type]?.sub || 'Official Platform Policy';

      const policyData = await legalContentService.getPolicy(type);
      textarea.value = policyData.content || '';
      updateStats();

      if (this.isPolicyPreviewMode && previewPane) {
        previewPane.innerHTML = legalContentService.renderPolicyToHtml(textarea.value);
      }
    };

    // Tab clicks
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.dataset.policy;
        if (type) loadPolicy(type);
      });
    });

    // Textarea input
    textarea.addEventListener('input', updateStats);

    // Edit vs Preview mode toggle
    if (btnEdit && btnPreview) {
      btnEdit.addEventListener('click', () => {
        this.isPolicyPreviewMode = false;
        btnEdit.classList.add('active');
        btnPreview.classList.remove('active');
        if (editPane) editPane.style.display = 'block';
        if (previewPane) previewPane.style.display = 'none';
      });

      btnPreview.addEventListener('click', () => {
        this.isPolicyPreviewMode = true;
        btnPreview.classList.add('active');
        btnEdit.classList.remove('active');
        if (editPane) editPane.style.display = 'none';
        if (previewPane) {
          previewPane.style.display = 'block';
          previewPane.innerHTML = legalContentService.renderPolicyToHtml(textarea.value);
        }
      });
    }

    // Save Policy Button
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const text = textarea.value;
        btnSave.disabled = true;
        btnSave.innerHTML = `<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> Saving...`;

        try {
          const author = this.currentUser?.fullName || 'Admin Reviewer';
          await legalContentService.savePolicy(this.activePolicyType, text, author);

          // Append to Immutable Audit Logs
          const auditEntry = {
            timestamp: new Date().toISOString(),
            adminName: author,
            actionTitle: `Updated ${legalContentService.titles[this.activePolicyType] || this.activePolicyType}`,
            referenceNumber: 'SYS-POL-' + this.activePolicyType.toUpperCase(),
            prevStatus: 'active',
            newStatus: 'published',
            note: `Updated and synchronized ${this.activePolicyType} across GITH portal.`
          };
          this.auditLogs.unshift(auditEntry);
          localStorage.setItem('dicon_gith_audit_logs', JSON.stringify(this.auditLogs));
          this.renderAuditLogs();

          this.showToast(`✓ ${legalContentService.titles[this.activePolicyType]} saved and published successfully!`);
        } catch (e) {
          this.showToast(`Error saving policy: ${e.message}`, 'error');
        } finally {
          btnSave.disabled = false;
          btnSave.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            <span>Save & Publish Changes</span>
          `;
        }
      });
    }

    // Reset Policy Button
    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        const confirmed = confirm(`Are you sure you want to reset "${legalContentService.titles[this.activePolicyType]}" to the official institutional default?`);
        if (!confirmed) return;

        const defaultContent = await legalContentService.resetPolicy(this.activePolicyType);
        textarea.value = defaultContent;
        updateStats();

        if (this.isPolicyPreviewMode && previewPane) {
          previewPane.innerHTML = legalContentService.renderPolicyToHtml(defaultContent);
        }

        this.showToast(`✓ Reset ${legalContentService.titles[this.activePolicyType]} to official default.`);
      });
    }

    // Public modal preview
    if (btnPublicModal) {
      btnPublicModal.addEventListener('click', () => {
        legalContentService.openModal(this.activePolicyType);
      });
    }

    // Initial load
    await loadPolicy('privacy');
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
