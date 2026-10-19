/**
 * DICON GITH — Innovator Dashboard Application Logic
 */

import { authService } from './auth-service.js';
import { storage } from './storage.js';
import {
  GITH_CATEGORIES,
  NIGERIAN_STATES,
  DEVELOPMENT_STAGES,
  AVAILABLE_SKILLS,
  PIPELINE_STAGES
} from './data.js';

class InnovatorDashboard {
  constructor() {
    this.currentUser = null;
    this.currentStep = 1;
    this.totalSteps = 6;
    this.selectedSkills = [];
    this.activeTrackingId = null;
    this.uploadedPhoto = null;
    this.uploadedDoc = null;
    this.editingInnovationId = null;

    this.init();
  }

  async init() {
    // 1. Auth Guard
    if (!authService.requireAuth(['innovator', 'admin', 'super_admin'])) {
      return;
    }

    document.documentElement.style.display = '';
    this.currentUser = authService.getCurrentUser();

    // 2. Setup UI
    this.bindSidebarEvents();
    this.populateDropdowns();
    this.bindHashRouting();
    this.bindWizardEvents();
    this.bindProfileEvents();
    this.bindNotificationsEvents();

    // 3. Render User Data
    this.renderUserProfile();
    this.renderOverviewStats();
    this.renderInnovationsTable();
    this.renderDrafts();
    this.renderTracking();
    this.renderNotifications();

    // 4. Initial Route
    const initialHash = window.location.hash || '#overview';
    this.navigateToView(initialHash.replace('#', ''));
  }

  // ---- TOAST FEEDBACK ----
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    if (type === 'error') {
      toast.style.borderLeftColor = 'var(--status-rejected)';
    }
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
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
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await authService.logout();
        window.location.href = '/login';
      });
    }

    const settingsLogout = document.getElementById('btn-settings-signout');
    if (settingsLogout) {
      settingsLogout.addEventListener('click', async () => {
        await authService.logout();
        window.location.href = '/login';
      });
    }

    // Quick Submit button in topbar
    const quickSubmit = document.getElementById('btn-quick-submit');
    if (quickSubmit) {
      quickSubmit.addEventListener('click', () => {
        window.location.hash = '#submit';
      });
    }
  }

  bindHashRouting() {
    window.addEventListener('hashchange', () => {
      const viewName = (window.location.hash || '#overview').replace('#', '');
      this.navigateToView(viewName);
    });
  }

  navigateToView(viewName) {
    const targetId = `view-${viewName}`;
    const targetEl = document.getElementById(targetId);

    if (!targetEl) {
      this.navigateToView('overview');
      return;
    }

    // Switch view sections
    document.querySelectorAll('.dashboard-view').forEach(v => v.classList.remove('active'));
    targetEl.classList.add('active');

    // Update active nav item
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      if (item.getAttribute('data-view') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Topbar Title
    const titleMap = {
      'overview': 'Workspace Overview',
      'profile': 'My Innovator Profile',
      'innovations': 'My Innovations',
      'submit': 'Submit New Innovation',
      'drafts': 'Saved Drafts',
      'tracking': 'Application Status Tracking',
      'notifications': 'System Notifications',
      'settings': 'Account Settings'
    };
    const topbarTitle = document.getElementById('topbar-current-view');
    if (topbarTitle) {
      topbarTitle.textContent = titleMap[viewName] || 'Workspace';
    }

    // Auto-close mobile sidebar if open
    const sidebar = document.getElementById('dashboard-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');

    // Trigger view-specific refreshes
    if (viewName === 'overview') this.renderOverviewStats();
    if (viewName === 'innovations') this.renderInnovationsTable();
    if (viewName === 'tracking') this.renderTracking();
    if (viewName === 'drafts') this.renderDrafts();
  }

  // ---- DROPDOWNS & METADATA ----
  populateDropdowns() {
    // States
    const stateSelects = [document.getElementById('prof-state'), document.getElementById('wiz-state')];
    stateSelects.forEach(select => {
      if (!select) return;
      select.innerHTML = '<option value="">Select State</option>';
      NIGERIAN_STATES.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        select.appendChild(opt);
      });
    });

    // Categories
    const catSelects = [document.getElementById('wiz-category'), document.getElementById('innovations-filter-category')];
    catSelects.forEach(select => {
      if (!select) return;
      if (select.id === 'innovations-filter-category') {
        select.innerHTML = '<option value="all">All Categories</option>';
      } else {
        select.innerHTML = '<option value="">Select Category</option>';
      }
      GITH_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    });

    // Development Stages
    const stageSelect = document.getElementById('wiz-stage');
    if (stageSelect) {
      stageSelect.innerHTML = '<option value="">Select Stage</option>';
      DEVELOPMENT_STAGES.forEach(stg => {
        const opt = document.createElement('option');
        opt.value = stg;
        opt.textContent = stg;
        stageSelect.appendChild(opt);
      });
    }

    // Skills Chips
    const skillsContainer = document.getElementById('prof-skills-container');
    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      AVAILABLE_SKILLS.forEach(skill => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'btn-table-action';
        chip.textContent = skill;
        chip.style.borderRadius = '9999px';
        chip.style.padding = '5px 12px';

        chip.addEventListener('click', () => {
          if (this.selectedSkills.includes(skill)) {
            this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
            chip.style.background = 'var(--surface-alt)';
            chip.style.color = 'var(--dark-ink)';
            chip.style.borderColor = 'var(--border)';
          } else {
            this.selectedSkills.push(skill);
            chip.style.background = 'var(--deep-forest)';
            chip.style.color = '#FFFFFF';
            chip.style.borderColor = 'var(--deep-forest)';
          }
        });
        skillsContainer.appendChild(chip);
      });
    }
  }

  // ---- PROFILE RENDERING & SAVING ----
  renderUserProfile() {
    const user = this.currentUser;
    if (!user) return;

    // Sidebar & Topbar
    document.getElementById('sidebar-user-name').textContent = user.fullName || 'GITH Innovator';
    document.getElementById('sidebar-user-state').textContent = `${user.state || 'Nigeria'}${user.lga ? ` (${user.lga})` : ''}`;
    document.getElementById('welcome-user-heading').textContent = `Welcome back, ${(user.fullName || '').split(' ')[0] || 'Innovator'}`;

    if (user.photoUrl) {
      const sidebarAvatar = document.getElementById('sidebar-user-avatar');
      const topbarAvatar = document.getElementById('topbar-user-avatar');
      const profilePreview = document.getElementById('profile-photo-preview');
      const profileUrl = document.getElementById('profile-photo-url');

      if (sidebarAvatar) sidebarAvatar.src = user.photoUrl;
      if (topbarAvatar) topbarAvatar.src = user.photoUrl;
      if (profilePreview) profilePreview.src = user.photoUrl;
      if (profileUrl) profileUrl.value = user.photoUrl;
    }

    // Form inputs
    document.getElementById('prof-fullName').value = user.fullName || '';
    document.getElementById('prof-email').value = user.email || '';
    document.getElementById('prof-phone').value = user.phoneNumber || '';
    document.getElementById('prof-occupation').value = user.occupation || '';
    document.getElementById('prof-state').value = user.state || '';
    document.getElementById('prof-lga').value = user.lga || '';
    document.getElementById('prof-community').value = user.community || '';
    document.getElementById('prof-institution').value = user.institution || '';
    document.getElementById('prof-bio').value = user.bio || '';

    // Skills
    this.selectedSkills = user.skills || [];
    const skillButtons = document.querySelectorAll('#prof-skills-container button');
    skillButtons.forEach(btn => {
      if (this.selectedSkills.includes(btn.textContent)) {
        btn.style.background = 'var(--deep-forest)';
        btn.style.color = '#FFFFFF';
        btn.style.borderColor = 'var(--deep-forest)';
      } else {
        btn.style.background = 'var(--surface-alt)';
        btn.style.color = 'var(--dark-ink)';
        btn.style.borderColor = 'var(--border)';
      }
    });

    // Profile completion meter
    const pct = storage.calculateProfileCompletion(user);
    document.getElementById('profile-percent-text').textContent = `${pct}%`;
    document.getElementById('profile-meter-fill').style.width = `${pct}%`;

    const missingNotice = document.getElementById('profile-missing-notice');
    if (pct >= 90) {
      missingNotice.textContent = "Your profile is fully completed and verified for priority technical screening.";
      missingNotice.style.background = "var(--soft-pale-green)";
      missingNotice.style.color = "var(--deep-forest)";
    } else {
      missingNotice.textContent = "Add your skills, occupation, and institution to complete your profile.";
      missingNotice.style.background = "var(--surface-alt)";
      missingNotice.style.color = "var(--charcoal)";
    }
  }

  bindProfileEvents() {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

    // Profile photo upload button and file listener
    const avatarBtn = document.getElementById('btn-upload-avatar');
    const avatarInput = document.getElementById('profile-photo-file');
    if (avatarBtn && avatarInput) {
      avatarBtn.addEventListener('click', () => avatarInput.click());
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          this.showToast('Profile photo must be less than 5MB.', 'error');
          avatarInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (re) => {
          const preview = document.getElementById('profile-photo-preview');
          const urlInput = document.getElementById('profile-photo-url');
          if (preview) preview.src = re.target.result;
          if (urlInput) urlInput.value = re.target.result;
          this.showToast('Photo selected! Click "Save Profile Changes" to save.');
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const updated = storage.updateProfile({
        fullName: document.getElementById('prof-fullName').value.trim(),
        phoneNumber: document.getElementById('prof-phone').value.trim(),
        occupation: document.getElementById('prof-occupation').value.trim(),
        state: document.getElementById('prof-state').value,
        lga: document.getElementById('prof-lga').value.trim(),
        community: document.getElementById('prof-community').value.trim(),
        institution: document.getElementById('prof-institution').value.trim(),
        bio: document.getElementById('prof-bio').value.trim(),
        photoUrl: document.getElementById('profile-photo-url').value.trim() || 'assets/innovator_main.jpg',
        skills: this.selectedSkills
      });

      this.currentUser = updated;
      this.renderUserProfile();
      this.showToast('Profile updated successfully!');
    });
  }

  // ---- OVERVIEW METRICS & ACTIVITY ----
  renderOverviewStats() {
    const user = this.currentUser;
    if (!user) return;

    const allInnos = storage.getInnovations(user.uid);
    const draft = storage.getDraft(user.uid);

    const submittedCount = allInnos.filter(i => i.status !== 'draft').length;
    const reviewCount = allInnos.filter(i => ['submitted', 'screening', 'verification', 'assessment'].includes(i.status)).length;
    const draftsCount = draft && draft.innovationName ? 1 : 0;

    document.getElementById('stat-total').textContent = submittedCount + draftsCount;
    document.getElementById('stat-submitted').textContent = submittedCount;
    document.getElementById('stat-review').textContent = reviewCount;
    document.getElementById('stat-drafts').textContent = draftsCount;

    document.getElementById('badge-total-innovations').textContent = submittedCount;
    document.getElementById('badge-drafts-count').textContent = draftsCount;

    // Populate Overview Recent Table
    const tbody = document.getElementById('overview-innovations-tbody');
    tbody.innerHTML = '';

    if (allInnos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--muted-gray);">No innovations submitted yet. Click '+ Submit Innovation' to begin.</td></tr>`;
    } else {
      allInnos.slice(0, 5).forEach(inno => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${this.escapeHtml(inno.innovationName)}</strong></td>
          <td>${this.escapeHtml(inno.category)}</td>
          <td><code style="font-size:12px; font-weight:700;">${inno.referenceNumber}</code></td>
          <td><span class="status-pill pill-${inno.status}">${inno.status}</span></td>
          <td>
            <button class="btn-table-action" data-track-id="${inno.innovationId}">Track</button>
          </td>
        `;
        tr.querySelector('button').addEventListener('click', () => {
          this.activeTrackingId = inno.innovationId;
          window.location.hash = '#tracking';
        });
        tbody.appendChild(tr);
      });
    }

    // Populate Recent Activity from real user notifications and events
    const actList = document.getElementById('overview-activity-list');
    actList.innerHTML = '';
    const userNotifs = storage.getNotifications(user.uid).slice(0, 4);

    if (userNotifs.length === 0 && allInnos.length === 0) {
      actList.innerHTML = `<li style="font-size:13px; color:var(--muted-gray); padding:16px 0;">No account activity recorded yet. Complete your profile and submit your first innovation.</li>`;
    } else {
      userNotifs.forEach(n => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
          <div class="activity-dot"></div>
          <div class="activity-title">${this.escapeHtml(n.title)}</div>
          <div class="activity-desc">${this.escapeHtml(n.message)}</div>
          <div class="activity-time">${new Date(n.createdAt).toLocaleDateString()}</div>
        `;
        actList.appendChild(li);
      });
    }
  }

  // ---- INNOVATIONS TABLE & FILTERS ----
  renderInnovationsTable() {
    const user = this.currentUser;
    if (!user) return;

    let innos = storage.getInnovations(user.uid);

    const searchInput = document.getElementById('innovations-search');
    const catFilter = document.getElementById('innovations-filter-category');
    const statusFilter = document.getElementById('innovations-filter-status');

    const term = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const cat = catFilter ? catFilter.value : 'all';
    const st = statusFilter ? statusFilter.value : 'all';

    if (term) {
      innos = innos.filter(i =>
        i.innovationName.toLowerCase().includes(term) ||
        i.referenceNumber.toLowerCase().includes(term) ||
        (i.problemDescription || '').toLowerCase().includes(term)
      );
    }

    if (cat !== 'all') {
      innos = innos.filter(i => i.category === cat);
    }

    if (st !== 'all') {
      innos = innos.filter(i => i.status === st);
    }

    const tbody = document.getElementById('innovations-full-tbody');
    tbody.innerHTML = '';

    if (innos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--muted-gray);">No innovations match your filter criteria.</td></tr>`;
      return;
    }

    innos.forEach(inno => {
      const tr = document.createElement('tr');
      const dateStr = new Date(inno.submittedAt || inno.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      tr.innerHTML = `
        <td><code style="font-size:12px; font-weight:700;">${inno.referenceNumber}</code></td>
        <td>
          <div style="font-weight:700; color:var(--dark-ink);">${this.escapeHtml(inno.innovationName)}</div>
          <div style="font-size:11px; color:var(--muted-gray);">${this.escapeHtml(inno.teamName || inno.state)}</div>
        </td>
        <td>${this.escapeHtml(inno.category)}</td>
        <td><span style="font-size:12px; font-weight:600; color:var(--charcoal);">${inno.developmentStage}</span></td>
        <td>${dateStr}</td>
        <td><span class="status-pill pill-${inno.status}">${inno.status}</span></td>
        <td>
          <button class="btn-table-action" data-track-id="${inno.innovationId}">Track</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', () => {
        this.activeTrackingId = inno.innovationId;
        window.location.hash = '#tracking';
      });

      tbody.appendChild(tr);
    });

    if (!this._tableEventsBound) {
      if (searchInput) searchInput.addEventListener('input', () => this.renderInnovationsTable());
      if (catFilter) catFilter.addEventListener('change', () => this.renderInnovationsTable());
      if (statusFilter) statusFilter.addEventListener('change', () => this.renderInnovationsTable());
      this._tableEventsBound = true;
    }
  }

  // ---- 6-STEP INNOVATION SUBMISSION WIZARD ----
  bindWizardEvents() {
    const prevBtn = document.getElementById('wiz-btn-prev');
    const nextBtn = document.getElementById('wiz-btn-next');
    const draftBtn = document.getElementById('wiz-btn-draft');
    const form = document.getElementById('submission-wizard-form');

    // Clickable Step Nodes in Wizard Header
    document.querySelectorAll('.wizard-step-node').forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        const targetStep = parseInt(node.getAttribute('data-step'), 10);
        if (targetStep < this.currentStep) {
          this.goToWizardStep(targetStep);
        } else if (targetStep === this.currentStep + 1 && this.validateWizardStep(this.currentStep)) {
          this.goToWizardStep(targetStep);
        }
      });
    });

    // File Upload Zones with drag/drop, keyboard, and real FileReader
    const photoZone = document.getElementById('zone-photo');
    const photoInput = document.getElementById('file-photo');
    if (photoZone && photoInput) {
      photoZone.addEventListener('click', () => photoInput.click());
      photoZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          photoInput.click();
        }
      });

      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.showToast('Photo file exceeds the 10MB limit. Please choose a smaller file.', 'error');
          photoInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (re) => {
          this.uploadedPhoto = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            url: re.target.result
          };
          document.getElementById('file-photo-status').textContent = `✓ Selected: ${file.name} (${this.uploadedPhoto.size})`;
          this.showToast('Prototype photo loaded successfully!');
        };
        reader.readAsDataURL(file);
      });
    }

    const docZone = document.getElementById('zone-doc');
    const docInput = document.getElementById('file-doc');
    if (docZone && docInput) {
      docZone.addEventListener('click', () => docInput.click());
      docZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          docInput.click();
        }
      });

      docInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          this.showToast('Document file exceeds the 15MB limit. Please choose a smaller file.', 'error');
          docInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (re) => {
          this.uploadedDoc = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            url: re.target.result
          };
          document.getElementById('file-doc-status').textContent = `✓ Selected: ${file.name} (${this.uploadedDoc.size})`;
          this.showToast('Technical document loaded successfully!');
        };
        reader.readAsDataURL(file);
      });
    }

    // Step Continue
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.validateWizardStep(this.currentStep)) {
          this.goToWizardStep(this.currentStep + 1);
        }
      });
    }

    // Step Back
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentStep > 1) {
          this.goToWizardStep(this.currentStep - 1);
        }
      });
    }

    // Save Draft
    if (draftBtn) {
      draftBtn.addEventListener('click', () => {
        this.saveCurrentDraft();
      });
    }

    // Final Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitFinalInnovation();
      });
    }

    // Check for existing draft to restore
    this.restoreExistingDraft();
  }

  validateWizardStep(step) {
    if (step === 1) {
      const title = document.getElementById('wiz-title');
      const cat = document.getElementById('wiz-category');
      const stage = document.getElementById('wiz-stage');
      const state = document.getElementById('wiz-state');
      const lga = document.getElementById('wiz-lga');

      let valid = true;
      [title, cat, stage, state, lga].forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('is-invalid');
          valid = false;
        } else {
          field.classList.remove('is-invalid');
        }
      });

      if (!valid) {
        this.showToast("Please complete all required fields marked with * in Step 1.", "error");
        return false;
      }
    } else if (step === 2) {
      const prob = document.getElementById('wiz-problem');
      const target = document.getElementById('wiz-target-users');
      const imp = document.getElementById('wiz-importance');

      let valid = true;
      [prob, target, imp].forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('is-invalid');
          valid = false;
        } else {
          field.classList.remove('is-invalid');
        }
      });

      if (!valid) {
        this.showToast("Please complete all problem details in Step 2.", "error");
        return false;
      }
    } else if (step === 3) {
      const sol = document.getElementById('wiz-solution');
      const how = document.getElementById('wiz-how-it-works');
      const uniq = document.getElementById('wiz-uniqueness');

      let valid = true;
      [sol, how, uniq].forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('is-invalid');
          valid = false;
        } else {
          field.classList.remove('is-invalid');
        }
      });

      if (!valid) {
        this.showToast("Please describe your solution and its uniqueness in Step 3.", "error");
        return false;
      }
    }
    return true;
  }

  goToWizardStep(step) {
    this.currentStep = step;

    // Panes
    document.querySelectorAll('.wizard-pane').forEach(p => p.classList.remove('active'));
    const currentPane = document.querySelector(`.wizard-pane[data-pane="${step}"]`);
    if (currentPane) currentPane.classList.add('active');

    // Header nodes
    document.querySelectorAll('.wizard-step-node').forEach(node => {
      const nodeStep = parseInt(node.getAttribute('data-step'), 10);
      node.classList.remove('active', 'completed');
      if (nodeStep === step) {
        node.classList.add('active');
      } else if (nodeStep < step) {
        node.classList.add('completed');
      }
    });

    // Buttons
    const prevBtn = document.getElementById('wiz-btn-prev');
    const nextBtn = document.getElementById('wiz-btn-next');
    const submitBtn = document.getElementById('wiz-btn-submit');

    if (prevBtn) prevBtn.disabled = step === 1;

    if (step === this.totalSteps) {
      if (nextBtn) nextBtn.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'inline-flex';
      this.generateWizardSummary();
    } else {
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.style.display = 'none';
    }
  }

  generateWizardSummary() {
    const summaryBox = document.getElementById('wizard-summary-box');
    if (!summaryBox) return;

    summaryBox.innerHTML = `
      <div style="font-weight:800; font-size:16px; margin-bottom:12px; color:var(--deep-forest);">
        ${this.escapeHtml(document.getElementById('wiz-title').value)}
      </div>
      <div class="wizard-summary-meta">
        <div><strong>Category:</strong> ${this.escapeHtml(document.getElementById('wiz-category').value)}</div>
        <div><strong>Stage:</strong> ${this.escapeHtml(document.getElementById('wiz-stage').value)}</div>
        <div><strong>Location:</strong> ${this.escapeHtml(document.getElementById('wiz-lga').value)}, ${this.escapeHtml(document.getElementById('wiz-state').value)} State</div>
        <div><strong>IP Status:</strong> ${this.escapeHtml(document.getElementById('wiz-ip-status').value)}</div>
      </div>
      <div style="margin-bottom:8px;">
        <strong>Problem Summary:</strong>
        <p style="color:var(--muted-gray); margin-top:2px;">${this.escapeHtml(document.getElementById('wiz-problem').value)}</p>
      </div>
      <div>
        <strong>Solution Overview:</strong>
        <p style="color:var(--muted-gray); margin-top:2px;">${this.escapeHtml(document.getElementById('wiz-solution').value)}</p>
      </div>
      ${this.uploadedPhoto ? `<div style="margin-top:10px; font-weight:600; color:var(--primary-green);">✓ Photography Attached: ${this.escapeHtml(this.uploadedPhoto.name)}</div>` : ''}
      ${this.uploadedDoc ? `<div style="margin-top:4px; font-weight:600; color:var(--primary-green);">✓ Document Attached: ${this.escapeHtml(this.uploadedDoc.name)}</div>` : ''}
    `;
  }

  saveCurrentDraft() {
    const user = this.currentUser;
    const uid = user ? user.uid : 'anon';

    const draftData = {
      innovationName: document.getElementById('wiz-title').value.trim(),
      category: document.getElementById('wiz-category').value,
      developmentStage: document.getElementById('wiz-stage').value,
      state: document.getElementById('wiz-state').value,
      lga: document.getElementById('wiz-lga').value.trim(),
      teamName: document.getElementById('wiz-team').value.trim(),
      problemDescription: document.getElementById('wiz-problem').value.trim(),
      targetUsers: document.getElementById('wiz-target-users').value.trim(),
      problemImportance: document.getElementById('wiz-importance').value.trim(),
      solutionDescription: document.getElementById('wiz-solution').value.trim(),
      howItWorks: document.getElementById('wiz-how-it-works').value.trim(),
      uniqueness: document.getElementById('wiz-uniqueness').value.trim(),
      ipStatus: document.getElementById('wiz-ip-status').value,
      requiresIpSupport: document.getElementById('wiz-ip-support').checked,
      uploadedPhoto: this.uploadedPhoto,
      uploadedDoc: this.uploadedDoc
    };

    storage.saveDraft(draftData, uid);
    this.showToast('Draft saved successfully! You can resume anytime.');
    this.renderOverviewStats();
    this.renderDrafts();
  }

  restoreExistingDraft() {
    const user = this.currentUser;
    const uid = user ? user.uid : null;
    const draft = storage.getDraft(uid);
    if (!draft) return;

    if (draft.innovationName) document.getElementById('wiz-title').value = draft.innovationName;
    if (draft.category) document.getElementById('wiz-category').value = draft.category;
    if (draft.developmentStage) document.getElementById('wiz-stage').value = draft.developmentStage;
    if (draft.state) document.getElementById('wiz-state').value = draft.state;
    if (draft.lga) document.getElementById('wiz-lga').value = draft.lga;
    if (draft.teamName) document.getElementById('wiz-team').value = draft.teamName;
    if (draft.problemDescription) document.getElementById('wiz-problem').value = draft.problemDescription;
    if (draft.targetUsers) document.getElementById('wiz-target-users').value = draft.targetUsers;
    if (draft.problemImportance) document.getElementById('wiz-importance').value = draft.problemImportance;
    if (draft.solutionDescription) document.getElementById('wiz-solution').value = draft.solutionDescription;
    if (draft.howItWorks) document.getElementById('wiz-how-it-works').value = draft.howItWorks;
    if (draft.uniqueness) document.getElementById('wiz-uniqueness').value = draft.uniqueness;
    if (draft.ipStatus) document.getElementById('wiz-ip-status').value = draft.ipStatus;
    if (typeof draft.requiresIpSupport === 'boolean') {
      document.getElementById('wiz-ip-support').checked = draft.requiresIpSupport;
    }
    if (draft.uploadedPhoto) {
      this.uploadedPhoto = draft.uploadedPhoto;
      const el = document.getElementById('file-photo-status');
      if (el) el.textContent = `✓ Saved in draft: ${draft.uploadedPhoto.name}`;
    }
    if (draft.uploadedDoc) {
      this.uploadedDoc = draft.uploadedDoc;
      const el = document.getElementById('file-doc-status');
      if (el) el.textContent = `✓ Saved in draft: ${draft.uploadedDoc.name}`;
    }
  }

  submitFinalInnovation() {
    const declaration = document.getElementById('wiz-declaration');
    if (!declaration.checked) {
      this.showToast("Please confirm the legal declaration before submitting.", "error");
      return;
    }

    const data = {
      innovationName: document.getElementById('wiz-title').value.trim(),
      category: document.getElementById('wiz-category').value,
      developmentStage: document.getElementById('wiz-stage').value,
      state: document.getElementById('wiz-state').value,
      lga: document.getElementById('wiz-lga').value.trim(),
      teamName: document.getElementById('wiz-team').value.trim(),
      problemDescription: document.getElementById('wiz-problem').value.trim(),
      targetUsers: document.getElementById('wiz-target-users').value.trim(),
      problemImportance: document.getElementById('wiz-importance').value.trim(),
      solutionDescription: document.getElementById('wiz-solution').value.trim(),
      howItWorks: document.getElementById('wiz-how-it-works').value.trim(),
      uniqueness: document.getElementById('wiz-uniqueness').value.trim(),
      ipStatus: document.getElementById('wiz-ip-status').value,
      requiresIpSupport: document.getElementById('wiz-ip-support').checked,
      imageUrls: this.uploadedPhoto ? [this.uploadedPhoto.url] : [],
      documentUrls: this.uploadedDoc ? [{ name: this.uploadedDoc.name, size: this.uploadedDoc.size, url: this.uploadedDoc.url }] : [],
      videoUrls: document.getElementById('wiz-video').value ? [document.getElementById('wiz-video').value] : []
    };

    try {
      // If editing a returned innovation, update it; otherwise create new
      let created;
      if (this.editingInnovationId) {
        const allInnos = storage.getInnovations();
        const idx = allInnos.findIndex(i => i.innovationId === this.editingInnovationId);
        if (idx !== -1) {
          allInnos[idx] = {
            ...allInnos[idx],
            ...data,
            status: 'submitted',
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('dicon_gith_innovations', JSON.stringify(allInnos));
          created = allInnos[idx];
          this.editingInnovationId = null;
        } else {
          created = storage.submitInnovation(data);
        }
      } else {
        created = storage.submitInnovation(data);
      }

      this.showToast(`Application Submitted! Ref: ${created.referenceNumber}`, 'success');

      // Reset wizard form and uploaded files
      document.getElementById('submission-wizard-form').reset();
      this.uploadedPhoto = null;
      this.uploadedDoc = null;
      document.getElementById('file-photo-status').textContent = '';
      document.getElementById('file-doc-status').textContent = '';
      this.goToWizardStep(1);

      // Refresh overview and list
      this.renderOverviewStats();
      this.renderInnovationsTable();

      // Navigate to tracking
      this.activeTrackingId = created.innovationId;
      window.location.hash = '#tracking';

    } catch (err) {
      this.showToast(`Submission error: ${err.message}`, 'error');
    }
  }

  // ---- SAVED DRAFTS VIEW ----
  renderDrafts() {
    const container = document.getElementById('drafts-container');
    if (!container) return;

    const user = this.currentUser;
    const draft = storage.getDraft(user ? user.uid : null);

    if (!draft || !draft.innovationName) {
      container.innerHTML = `
        <div style="text-align:center; padding:36px 20px; color:var(--muted-gray);">
          <div style="display:flex; justify-content:center; margin-bottom:12px; color:var(--muted-gray);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </div>
          <div style="font-size:16px; font-weight:700; color:var(--dark-ink);">No active drafts saved.</div>
          <p style="font-size:13px; margin-top:4px;">When you start an innovation submission and click 'Save Draft', it will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-alt);">
        <div>
          <div style="font-size:15px; font-weight:700;">${this.escapeHtml(draft.innovationName)}</div>
          <div style="font-size:12px; color:var(--muted-gray); margin-top:3px;">
            Category: ${this.escapeHtml(draft.category || 'Unassigned')} • Last saved: ${new Date(draft.updatedAt || Date.now()).toLocaleTimeString()}
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn-primary-action" style="padding:8px 16px; width:auto;" id="btn-resume-draft">Resume Application</button>
          <button class="btn-table-action" style="color:var(--status-rejected);" id="btn-delete-draft">Discard</button>
        </div>
      </div>
    `;

    document.getElementById('btn-resume-draft').addEventListener('click', () => {
      this.restoreExistingDraft();
      window.location.hash = '#submit';
    });

    document.getElementById('btn-delete-draft').addEventListener('click', () => {
      if (confirm("Are you sure you want to discard this saved draft?")) {
        storage.clearDraft(user ? user.uid : null);
        this.renderDrafts();
        this.renderOverviewStats();
        this.showToast('Draft discarded.');
      }
    });
  }

  // ---- APPLICATION TRACKING VIEW ----
  renderTracking() {
    const user = this.currentUser;
    if (!user) return;

    const innos = storage.getInnovations(user.uid);
    const selector = document.getElementById('tracking-app-selector');
    const container = document.getElementById('tracking-pipeline-container');

    if (!selector || !container) return;

    selector.innerHTML = '';

    if (innos.length === 0) {
      selector.innerHTML = '<option value="">No submitted applications</option>';
      container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--muted-gray);">Submit your first innovation to track its evaluation progress.</div>`;
      return;
    }

    innos.forEach((inno, idx) => {
      const opt = document.createElement('option');
      opt.value = inno.innovationId;
      opt.textContent = `${inno.referenceNumber} — ${inno.innovationName}`;
      if (idx === 0 && !this.activeTrackingId) {
        this.activeTrackingId = inno.innovationId;
      }
      selector.appendChild(opt);
    });

    selector.value = this.activeTrackingId || innos[0].innovationId;

    if (!this._trackingSelectorBound) {
      selector.addEventListener('change', (e) => {
        this.activeTrackingId = e.target.value;
        this.renderTrackingPipeline(storage.getInnovationById(this.activeTrackingId));
      });
      this._trackingSelectorBound = true;
    }

    this.renderTrackingPipeline(storage.getInnovationById(selector.value));
  }

  renderTrackingPipeline(inno) {
    const container = document.getElementById('tracking-pipeline-container');
    if (!container || !inno) return;

    const currentStatus = inno.status || 'submitted';
    const statusOrder = ['submitted', 'screening', 'verification', 'assessment', 'shortlisted', 'selected', 'mentorship', 'incubation'];
    const currentIdx = statusOrder.indexOf(currentStatus);

    let statusBannerHtml = '';
    if (currentStatus === 'returned') {
      statusBannerHtml = `
        <div style="background:#FFF7ED; border-left:4px solid #EA580C; padding:16px 20px; border-radius:6px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; color:#C2410C; font-size:14px; margin-bottom:4px;">Application Returned for Correction</div>
              <div style="font-size:13px; color:#431407;">Your submission requires minor revision or additional documentation per the technical review panel.</div>
            </div>
            <button class="btn-primary-action" id="btn-edit-returned" style="padding:8px 16px; width:auto; background:#EA580C; flex-shrink:0;">
              Edit & Resubmit
            </button>
          </div>
        </div>
      `;
    } else if (currentStatus === 'rejected') {
      statusBannerHtml = `
        <div style="background:#FEF2F2; border-left:4px solid #DC2626; padding:16px 20px; border-radius:6px; margin-bottom:20px;">
          <div style="font-weight:700; color:#991B1B; font-size:14px; margin-bottom:4px;">Application Not Selected for Current Cycle</div>
          <div style="font-size:13px; color:#450A0A;">This innovation was evaluated by the DICON technical panel and is not advancing in this cycle. You may submit new or refined prototypes in subsequent talent hunt cycles.</div>
        </div>
      `;
    }

    container.innerHTML = `
      ${statusBannerHtml}
      <div style="background:var(--surface-alt); padding:16px 20px; border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; font-weight:700; color:var(--muted-gray); text-transform:uppercase;">Application Reference</div>
          <div style="font-size:18px; font-weight:800; color:var(--deep-forest);">${inno.referenceNumber}</div>
        </div>
        <span class="status-pill pill-${inno.status}" style="font-size:13px; padding:6px 14px;">${inno.status}</span>
      </div>
    `;

    // Handle returned innovation edit button
    const editBtn = container.querySelector('#btn-edit-returned');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.editingInnovationId = inno.innovationId;
        document.getElementById('wiz-title').value = inno.innovationName || '';
        document.getElementById('wiz-category').value = inno.category || '';
        document.getElementById('wiz-stage').value = inno.developmentStage || '';
        document.getElementById('wiz-state').value = inno.state || '';
        document.getElementById('wiz-lga').value = inno.lga || '';
        document.getElementById('wiz-team').value = inno.teamName || '';
        document.getElementById('wiz-problem').value = inno.problemDescription || '';
        document.getElementById('wiz-target-users').value = inno.targetUsers || '';
        document.getElementById('wiz-importance').value = inno.problemImportance || '';
        document.getElementById('wiz-solution').value = inno.solutionDescription || '';
        document.getElementById('wiz-how-it-works').value = inno.howItWorks || '';
        document.getElementById('wiz-uniqueness').value = inno.uniqueness || '';
        document.getElementById('wiz-ip-status').value = inno.ipStatus || 'Not Yet';
        document.getElementById('wiz-ip-support').checked = !!inno.requiresIpSupport;

        this.goToWizardStep(1);
        window.location.hash = '#submit';
        this.showToast('Application details loaded for correction. Update and resubmit when ready.');
      });
    }

    // Render pipeline steps
    PIPELINE_STAGES.slice(1, 7).forEach((stage, idx) => {
      let isCompleted = false;
      let isCurrent = false;
      let isPending = true;

      if (currentStatus === 'returned' || currentStatus === 'rejected') {
        if (idx === 0) isCurrent = true;
      } else if (currentIdx !== -1) {
        if (currentIdx > idx) {
          isCompleted = true;
          isPending = false;
        } else if (currentIdx === idx) {
          isCurrent = true;
          isPending = false;
        }
      }

      let nodeClass = 'pipeline-node';
      if (isCompleted) nodeClass += ' completed';
      if (isCurrent) nodeClass += ' current';
      if (isPending) nodeClass += ' pending';

      const dateNote = isCompleted || isCurrent
        ? new Date(inno.updatedAt || inno.submittedAt).toLocaleDateString()
        : 'Pending previous phase';

      const nodeDiv = document.createElement('div');
      nodeDiv.className = nodeClass;
      nodeDiv.innerHTML = `
        <div class="pipeline-marker">${isCompleted ? '✓' : idx + 1}</div>
        <div class="pipeline-info">
          <div class="pipeline-title">${stage.label}</div>
          <div class="pipeline-desc">${stage.description}</div>
          <div class="pipeline-date">${dateNote}</div>
        </div>
      `;
      container.appendChild(nodeDiv);
    });
  }

  // ---- NOTIFICATIONS VIEW ----
  renderNotifications() {
    const container = document.getElementById('notifications-container');
    const badge = document.getElementById('badge-notif-count');
    const dot = document.getElementById('topbar-notif-dot');

    if (!container) return;

    const user = this.currentUser;
    const notifs = storage.getNotifications(user ? user.uid : null);
    const unread = storage.getUnreadCount(user ? user.uid : null);

    if (badge) badge.textContent = unread;
    if (dot) dot.style.display = unread > 0 ? 'block' : 'none';

    container.innerHTML = '';
    if (notifs.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:32px; color:var(--muted-gray);">No notifications right now.</div>`;
      return;
    }

    notifs.forEach(n => {
      const item = document.createElement('div');
      item.style.padding = '14px 18px';
      item.style.borderBottom = '1px solid var(--border)';
      item.style.background = n.isRead ? 'transparent' : 'var(--soft-pale-green)';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';

      item.innerHTML = `
        <div>
          <div style="font-size:14px; font-weight:700; color:var(--dark-ink);">${this.escapeHtml(n.title)}</div>
          <div style="font-size:13px; color:var(--muted-gray); margin-top:2px;">${this.escapeHtml(n.message)}</div>
          <div style="font-size:11px; color:var(--muted-light); margin-top:4px;">${new Date(n.createdAt).toLocaleDateString()}</div>
        </div>
        ${!n.isRead ? `<button class="btn-table-action" style="flex-shrink:0;">Mark read</button>` : ''}
      `;

      if (!n.isRead) {
        item.querySelector('button').addEventListener('click', () => {
          storage.markNotificationRead(n.notificationId);
          this.renderNotifications();
        });
      }

      container.appendChild(item);
    });
  }

  bindNotificationsEvents() {
    const markAllBtn = document.getElementById('btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        const user = this.currentUser;
        storage.markAllNotificationsRead(user ? user.uid : null);
        this.renderNotifications();
        this.showToast('All notifications marked as read.');
      });
    }
  }

  // ---- HELPER ----
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Instantiate dashboard on load
document.addEventListener('DOMContentLoaded', () => {
  new InnovatorDashboard();
});
