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

    this.init();
  }

  async init() {
    // 1. Auth Guard
    if (!authService.requireAuth(['innovator', 'admin', 'super_admin'])) {
      return;
    }

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
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
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
    document.getElementById('sidebar-user-state').textContent = `${user.state || 'Nigeria'} (${user.lga || 'National'})`;
    document.getElementById('welcome-user-heading').textContent = `Welcome back, ${(user.fullName || '').split(' ')[0] || 'Innovator'}`;

    if (user.photoUrl) {
      document.getElementById('sidebar-user-avatar').src = user.photoUrl;
      document.getElementById('topbar-user-avatar').src = user.photoUrl;
      document.getElementById('profile-photo-preview').src = user.photoUrl;
      document.getElementById('profile-photo-url').value = user.photoUrl;
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
    }
  }

  bindProfileEvents() {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

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
    const draft = storage.getDraft();

    const submittedCount = allInnos.filter(i => i.status !== 'draft').length;
    const reviewCount = allInnos.filter(i => ['submitted', 'screening', 'verification', 'assessment'].includes(i.status)).length;
    const draftsCount = draft ? 1 : 0;

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
            <button class="btn-table-action" onclick="window.location.hash='#tracking'">Track</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Populate Recent Activity
    const actList = document.getElementById('overview-activity-list');
    actList.innerHTML = '';
    const activities = [
      { title: "Profile Verified", desc: "Your basic contact details were confirmed.", time: "1 day ago" },
      { title: "Innovation Stored", desc: allInnos[0] ? `'${allInnos[0].innovationName}' registered with DICON.` : "Prototype registered.", time: "2 days ago" },
      { title: "GITH Account Created", desc: "Welcome to the national grassroots hunt.", time: "Initial sign up" }
    ];

    activities.forEach(act => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `
        <div class="activity-dot"></div>
        <div class="activity-title">${act.title}</div>
        <div class="activity-desc">${act.desc}</div>
        <div class="activity-time">${act.time}</div>
      `;
      actList.appendChild(li);
    });
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
          <button class="btn-table-action" onclick="window.location.hash='#tracking'">Track</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Bind event listeners for search/filter inputs once
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

    // File Upload Zone Mock/Real Triggers
    const photoZone = document.getElementById('zone-photo');
    const photoInput = document.getElementById('file-photo');
    if (photoZone && photoInput) {
      photoZone.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', () => {
        if (photoInput.files.length > 0) {
          document.getElementById('file-photo-status').textContent = `✓ Selected: ${photoInput.files[0].name}`;
        }
      });
    }

    const docZone = document.getElementById('zone-doc');
    const docInput = document.getElementById('file-doc');
    if (docZone && docInput) {
      docZone.addEventListener('click', () => docInput.click());
      docInput.addEventListener('change', () => {
        if (docInput.files.length > 0) {
          document.getElementById('file-doc-status').textContent = `✓ Selected: ${docInput.files[0].name}`;
        }
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
      const title = document.getElementById('wiz-title').value.trim();
      const cat = document.getElementById('wiz-category').value;
      const stage = document.getElementById('wiz-stage').value;
      const state = document.getElementById('wiz-state').value;
      const lga = document.getElementById('wiz-lga').value.trim();

      if (!title || !cat || !stage || !state || !lga) {
        alert("Please complete all required fields marked with * in Step 1.");
        return false;
      }
    } else if (step === 2) {
      const prob = document.getElementById('wiz-problem').value.trim();
      const target = document.getElementById('wiz-target-users').value.trim();
      const imp = document.getElementById('wiz-importance').value.trim();
      if (!prob || !target || !imp) {
        alert("Please complete all problem details in Step 2.");
        return false;
      }
    } else if (step === 3) {
      const sol = document.getElementById('wiz-solution').value.trim();
      const how = document.getElementById('wiz-how-it-works').value.trim();
      const uniq = document.getElementById('wiz-uniqueness').value.trim();
      if (!sol || !how || !uniq) {
        alert("Please describe your solution in Step 3.");
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
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
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
    `;
  }

  saveCurrentDraft() {
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
      requiresIpSupport: document.getElementById('wiz-ip-support').checked
    };

    storage.saveDraft(draftData);
    this.showToast('Draft saved successfully! You can resume anytime.');
    this.renderOverviewStats();
  }

  restoreExistingDraft() {
    const draft = storage.getDraft();
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
  }

  submitFinalInnovation() {
    const declaration = document.getElementById('wiz-declaration');
    if (!declaration.checked) {
      alert("Please confirm the legal declaration before final submission.");
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
      videoUrls: document.getElementById('wiz-video').value ? [document.getElementById('wiz-video').value] : []
    };

    try {
      const created = storage.submitInnovation(data);
      this.showToast(`Application Submitted! Ref: ${created.referenceNumber}`, 'success');

      // Reset wizard form
      document.getElementById('submission-wizard-form').reset();
      this.goToWizardStep(1);

      // Refresh overview and list
      this.renderOverviewStats();
      this.renderInnovationsTable();

      // Navigate to tracking
      window.location.hash = '#tracking';

    } catch (err) {
      alert(`Submission error: ${err.message}`);
    }
  }

  // ---- SAVED DRAFTS VIEW ----
  renderDrafts() {
    const container = document.getElementById('drafts-container');
    if (!container) return;

    const draft = storage.getDraft();
    if (!draft || !draft.innovationName) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--muted-gray);">
          <div style="font-size:36px; margin-bottom:12px;">📝</div>
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
            Category: ${this.escapeHtml(draft.category || 'Unassigned')} • Last saved: ${new Date(draft.updatedAt).toLocaleTimeString()}
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn-primary-action" style="padding:8px 16px; width:auto;" onclick="window.location.hash='#submit'">Resume Application</button>
          <button class="btn-table-action" style="color:var(--status-rejected);" id="btn-delete-draft">Discard</button>
        </div>
      </div>
    `;

    document.getElementById('btn-delete-draft').addEventListener('click', () => {
      if (confirm("Are you sure you want to discard this saved draft?")) {
        storage.clearDraft();
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

    selector.addEventListener('change', (e) => {
      this.activeTrackingId = e.target.value;
      this.renderTrackingPipeline(storage.getInnovationById(this.activeTrackingId));
    });

    this.renderTrackingPipeline(storage.getInnovationById(selector.value));
  }

  renderTrackingPipeline(inno) {
    const container = document.getElementById('tracking-pipeline-container');
    if (!container || !inno) return;

    const currentStatus = inno.status || 'submitted';
    const statusOrder = ['submitted', 'screening', 'verification', 'assessment', 'shortlisted', 'selected'];
    const currentIdx = statusOrder.indexOf(currentStatus);

    container.innerHTML = `
      <div style="background:var(--surface-alt); padding:16px 20px; border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; font-weight:700; color:var(--muted-gray); text-transform:uppercase;">Application Reference</div>
          <div style="font-size:18px; font-weight:800; color:var(--deep-forest);">${inno.referenceNumber}</div>
        </div>
        <span class="status-pill pill-${inno.status}" style="font-size:13px; padding:6px 14px;">${inno.status}</span>
      </div>
    `;

    PIPELINE_STAGES.slice(1, 7).forEach((stage, idx) => {
      const isCompleted = currentIdx > idx;
      const isCurrent = currentIdx === idx;
      const isPending = currentIdx < idx;

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

    const notifs = storage.getNotifications();
    const unread = storage.getUnreadCount();

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
        storage.markAllNotificationsRead();
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
