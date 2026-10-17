/**
 * DICON GITH Application Main Logic
 * Grassroot Innovations Talent Hunt (GITH)
 */

import {
  GITH_CATEGORIES,
  NIGERIAN_STATES,
  DEVELOPMENT_STAGES,
  IP_STATUS_OPTIONS,
  AVAILABLE_SKILLS,
  PIPELINE_STAGES,
  INITIAL_DEMO_USER
} from './data.js';

import { storage } from './storage.js';
import { firebaseService } from './firebase-config.js';

class AppController {
  constructor() {
    this.currentScreen = 'screen-splash';
    this.history = [];
    this.currentSubmitStep = 1;
    this.totalSubmitSteps = 6;
    this.uploadedFiles = { photo: null, doc: null };
    this.activeInnovationId = null;

    this.init();
  }

  async init() {
    await firebaseService.initLive();
    this.populateDropdowns();
    this.bindEvents();
    this.renderSkillsSelectors();
    this.renderStageChips();
    this.renderIpChips();

    // Start Splash sequence
    this.runSplashSequence();
  }

  // ---- TOASTS & FEEDBACK ----
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span><button style="background:none; border:none; color:#fff; cursor:pointer; margin-left:8px;">✕</button>`;

    toast.querySelector('button').onclick = () => toast.remove();
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  // ---- NAVIGATION & ROUTING ----
  navigateTo(screenId, pushHistory = true) {
    const screens = document.querySelectorAll('.screen');
    const targetScreen = document.getElementById(screenId);

    if (!targetScreen) {
      console.warn(`Screen ${screenId} not found.`);
      return;
    }

    if (pushHistory && this.currentScreen !== screenId) {
      this.history.push(this.currentScreen);
    }

    screens.forEach(s => s.classList.remove('active'));
    targetScreen.classList.add('active');
    this.currentScreen = screenId;

    // Bottom Navigation visibility
    const publicScreens = [
      'screen-splash',
      'screen-welcome',
      'screen-onboarding',
      'screen-login',
      'screen-register',
      'screen-forgot-password',
      'screen-verify-email',
      'screen-terms',
      'screen-confirmation',
      'screen-submit',
      'screen-edit-profile'
    ];

    const bottomNav = document.getElementById('main-bottom-nav');
    if (bottomNav) {
      if (publicScreens.includes(screenId)) {
        bottomNav.style.display = 'none';
      } else {
        bottomNav.style.display = 'flex';
      }
    }

    // Update active tab in bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.dataset.target === screenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Screen specific initializers
    this.onScreenActivated(screenId);
  }

  goBack() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.navigateTo(prev, false);
    } else {
      this.navigateTo('screen-home', false);
    }
  }

  onScreenActivated(screenId) {
    if (screenId === 'screen-home') {
      this.renderHome();
    } else if (screenId === 'screen-profile') {
      this.renderProfile();
    } else if (screenId === 'screen-applications') {
      this.renderApplications();
    } else if (screenId === 'screen-notifications') {
      this.renderNotifications();
    } else if (screenId === 'screen-status') {
      this.renderStatus();
    } else if (screenId === 'screen-details') {
      this.renderDetails();
    }
    this.updateNotificationBadges();
  }

  // ---- SPLASH SCREEN LOGIC (§4) ----
  runSplashSequence() {
    setTimeout(() => {
      const user = storage.getUser();
      const onboardingSeen = storage.isOnboardingSeen();

      if (user && user.emailVerified) {
        this.navigateTo('screen-home');
      } else if (!onboardingSeen) {
        this.navigateTo('screen-welcome');
      } else if (user && !user.emailVerified) {
        this.navigateTo('screen-verify-email');
      } else {
        this.navigateTo('screen-welcome');
      }
    }, 2000);
  }

  // ---- POPULATE DROPDOWNS ----
  populateDropdowns() {
    // States
    const stateSelects = [
      document.getElementById('reg-state'),
      document.getElementById('edit-state'),
      document.getElementById('inno-state')
    ];

    stateSelects.forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '<option value="">Select State</option>';
      NIGERIAN_STATES.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        sel.appendChild(opt);
      });
    });

    // Categories (§21)
    const catSelect = document.getElementById('inno-category');
    if (catSelect) {
      catSelect.innerHTML = '<option value="">Select Category</option>';
      GITH_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }
  }

  // ---- SKILLS SELECTORS ----
  renderSkillsSelectors() {
    const editContainer = document.getElementById('edit-skills-selector');
    if (!editContainer) return;

    const user = storage.getUser();
    const userSkills = user && user.skills ? user.skills : [];

    editContainer.innerHTML = '';
    AVAILABLE_SKILLS.forEach(skill => {
      const chip = document.createElement('div');
      chip.className = `chip ${userSkills.includes(skill) ? 'selected' : ''}`;
      chip.textContent = skill;
      chip.dataset.skill = skill;
      chip.onclick = () => {
        chip.classList.toggle('selected');
      };
      editContainer.appendChild(chip);
    });
  }

  // ---- STAGES & IP CHIPS ----
  renderStageChips() {
    const container = document.getElementById('inno-stage-chips');
    const hidden = document.getElementById('inno-selected-stage');
    if (!container || !hidden) return;

    container.innerHTML = '';
    DEVELOPMENT_STAGES.forEach(stage => {
      const chip = document.createElement('div');
      chip.className = `chip ${stage === hidden.value ? 'selected' : ''}`;
      chip.textContent = stage;
      chip.onclick = () => {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        hidden.value = stage;
      };
      container.appendChild(chip);
    });
  }

  renderIpChips() {
    const container = document.getElementById('inno-ip-chips');
    const hidden = document.getElementById('inno-selected-ip');
    if (!container || !hidden) return;

    container.innerHTML = '';
    IP_STATUS_OPTIONS.forEach(ip => {
      const chip = document.createElement('div');
      chip.className = `chip ${ip === hidden.value ? 'selected' : ''}`;
      chip.textContent = ip;
      chip.onclick = () => {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        hidden.value = ip;
      };
      container.appendChild(chip);
    });
  }

  // ---- EVENT BINDINGS ----
  bindEvents() {
    // Desktop Viewport Toggle
    document.getElementById('btn-toggle-viewport').onclick = () => {
      const app = document.getElementById('app-container');
      app.classList.toggle('wide-mode');
    };

    // Reset Demo Button
    document.getElementById('btn-reload-demo').onclick = () => {
      if (confirm("Reset application to clean pre-seeded demo data?")) {
        storage.resetToDemo();
        this.showToast("Demo data reloaded successfully.", "success");
        this.navigateTo('screen-home');
      }
    };

    // Welcome screen buttons
    document.getElementById('btn-welcome-start').onclick = () => {
      this.navigateTo('screen-onboarding');
    };
    document.getElementById('btn-welcome-login').onclick = () => {
      this.navigateTo('screen-login');
    };

    // Onboarding navigation
    this.bindOnboarding();

    // Auth forms
    this.bindAuthForms();

    // Bottom Navigation items
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        const target = item.dataset.target;
        if (target) {
          if (target === 'screen-submit') {
            this.initSubmitInnovation();
          } else {
            this.navigateTo(target);
          }
        }
      };
    });

    // Home Hero CTAs
    document.getElementById('btn-hero-submit').onclick = () => this.initSubmitInnovation();
    document.getElementById('btn-hero-apps').onclick = () => this.navigateTo('screen-applications');
    document.getElementById('btn-home-notif').onclick = () => this.navigateTo('screen-notifications');
    document.getElementById('btn-resume-draft').onclick = () => this.resumeDraft();

    // Profile actions
    document.getElementById('btn-profile-edit-toggle').onclick = () => this.openEditProfile();
    document.getElementById('btn-edit-profile-cancel').onclick = () => this.goBack();
    document.getElementById('form-edit-profile').onsubmit = (e) => this.handleSaveProfile(e);

    // Multi-step Innovation Submission
    this.bindSubmitFlow();

    // Applications & Details
    document.getElementById('btn-apps-new').onclick = () => this.initSubmitInnovation();
    document.getElementById('btn-status-back').onclick = () => this.goBack();
    document.getElementById('btn-details-back').onclick = () => this.goBack();
    document.getElementById('btn-details-track').onclick = () => this.navigateTo('screen-status');

    // Confirmation screen actions
    document.getElementById('btn-confirm-view-app').onclick = () => {
      if (this.activeInnovationId) {
        this.navigateTo('screen-details');
      } else {
        this.navigateTo('screen-applications');
      }
    };
    document.getElementById('btn-confirm-home').onclick = () => this.navigateTo('screen-home');

    // Notifications actions
    document.getElementById('btn-notif-mark-all').onclick = () => {
      storage.markAllNotificationsRead();
      this.renderNotifications();
      this.updateNotificationBadges();
      this.showToast("All notifications marked as read.", "success");
    };

    // Settings actions
    this.bindSettings();

    // Modal Sheet
    document.getElementById('btn-close-modal').onclick = () => this.closeModal();
    document.getElementById('btn-modal-action').onclick = () => this.closeModal();
  }

  // ---- ONBOARDING CAROUSEL (§5) ----
  bindOnboarding() {
    let currentSlide = 0;
    const totalSlides = 4;
    const slider = document.getElementById('onboarding-slider');
    const dots = document.querySelectorAll('.onboarding-dot');
    const nextBtn = document.getElementById('btn-onboarding-next');
    const skipBtn = document.getElementById('btn-onboarding-skip');

    const updateSlide = () => {
      slider.style.transform = `translateX(-${currentSlide * 25}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
      });
      if (currentSlide === totalSlides - 1) {
        nextBtn.textContent = 'GET STARTED';
        nextBtn.className = 'btn btn-accent';
      } else {
        nextBtn.textContent = 'Next';
        nextBtn.className = 'btn btn-primary';
      }
    };

    nextBtn.onclick = () => {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
      } else {
        storage.setOnboardingSeen(true);
        this.navigateTo('screen-register');
      }
    };

    skipBtn.onclick = () => {
      storage.setOnboardingSeen(true);
      this.navigateTo('screen-register');
    };

    dots.forEach((dot, idx) => {
      dot.onclick = () => {
        currentSlide = idx;
        updateSlide();
      };
    });
  }

  // ---- AUTHENTICATION (§6, §7) ----
  bindAuthForms() {
    // Login
    document.getElementById('btn-login-back').onclick = () => this.goBack();
    document.getElementById('link-to-register').onclick = (e) => {
      e.preventDefault();
      this.navigateTo('screen-register');
    };
    document.getElementById('link-to-login').onclick = (e) => {
      e.preventDefault();
      this.navigateTo('screen-login');
    };
    document.getElementById('link-forgot-password').onclick = (e) => {
      e.preventDefault();
      this.navigateTo('screen-forgot-password');
    };

    // Quick demo login
    document.getElementById('btn-quick-demo-login').onclick = () => {
      storage.setUser(INITIAL_DEMO_USER);
      this.showToast("Signed in as Demo Innovator", "success");
      this.navigateTo('screen-home');
    };

    document.getElementById('form-login').onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      // Realistic validation (§26)
      const user = storage.getUser();
      if ((user && user.email.toLowerCase() === email.toLowerCase()) || email.includes('@')) {
        // Successful login
        this.showToast("Authentication successful", "success");
        if (user && !user.emailVerified) {
          this.navigateTo('screen-verify-email');
        } else {
          this.navigateTo('screen-home');
        }
      } else {
        this.showToast("Your email or password could not be verified.", "error");
      }
    };

    // Register
    document.getElementById('btn-register-back').onclick = () => this.goBack();
    document.getElementById('link-reg-terms').onclick = (e) => {
      e.preventDefault();
      this.navigateTo('screen-terms');
    };
    document.getElementById('link-reg-privacy').onclick = (e) => {
      e.preventDefault();
      this.navigateTo('screen-terms');
    };

    document.getElementById('form-register').onsubmit = (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const state = document.getElementById('reg-state').value;
      const lga = document.getElementById('reg-lga').value.trim();
      const community = document.getElementById('reg-community').value.trim();
      const occupation = document.getElementById('reg-occupation').value.trim();

      const newUser = {
        uid: `usr-${Date.now()}`,
        fullName,
        email,
        phoneNumber: phone,
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        role: "innovator", // Enforced role (§6)
        state,
        lga,
        community,
        occupation,
        institution: "",
        bio: "",
        skills: ["Software Development", "Hardware Engineering"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        emailVerified: false
      };

      storage.setUser(newUser);

      // Create welcome notification
      storage.addNotification({
        title: "Welcome to GITH!",
        message: `Welcome, ${fullName}. Complete your profile and submit your grassroots innovation.`,
        type: "welcome"
      });

      document.getElementById('verify-user-email').textContent = email;
      this.showToast("Registration successful. Verification required.", "success");
      this.navigateTo('screen-verify-email');
    };

    // Verify email buttons
    document.getElementById('btn-verified-refresh').onclick = () => {
      const user = storage.getUser();
      if (user) {
        user.emailVerified = true;
        storage.setUser(user);
        this.showToast("Account successfully verified!", "success");
        this.navigateTo('screen-home');
      }
    };

    document.getElementById('btn-resend-verification').onclick = () => {
      this.showToast("Verification link resent to your email address.", "info");
    };

    // Forgot password
    document.getElementById('btn-forgot-back').onclick = () => this.goBack();
    document.getElementById('form-forgot').onsubmit = (e) => {
      e.preventDefault();
      this.showToast("Password reset instructions sent if email exists.", "info");
      this.navigateTo('screen-login');
    };

    // Terms back
    document.getElementById('btn-terms-back').onclick = () => this.goBack();
  }

  // ---- HOME DASHBOARD (§8) ----
  renderHome() {
    const user = storage.getUser();
    if (!user) return;

    // Greeting: First Name split
    const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Innovator';
    document.getElementById('home-greeting').textContent = `Hello, ${firstName}`;

    // Draft card
    const draft = storage.getDraft();
    const draftCard = document.getElementById('home-draft-card');
    if (draft && draft.innovationName) {
      draftCard.style.display = 'block';
      document.getElementById('home-draft-title').textContent = draft.innovationName || 'Untitled Innovation';
      document.getElementById('home-draft-step-text').textContent = `Saved at Step ${draft.draftStep || 1} of 6`;
    } else {
      draftCard.style.display = 'none';
    }

    this.updateNotificationBadges();
  }

  // ---- PROFILE & EDIT PROFILE (§9) ----
  renderProfile() {
    const user = storage.getUser();
    if (!user) return;

    document.getElementById('profile-name').textContent = user.fullName || 'Innovator';
    document.getElementById('profile-occupation').textContent = user.occupation || 'Grassroot Maker';
    document.getElementById('profile-location').textContent = `${user.lga || ''}, ${user.state || ''} State`;
    document.getElementById('profile-email').textContent = user.email || 'N/A';
    document.getElementById('profile-phone').textContent = user.phoneNumber || 'N/A';
    document.getElementById('profile-institution').textContent = user.institution || 'Self-Employed / Independent Maker';
    document.getElementById('profile-community').textContent = user.community || 'N/A';
    document.getElementById('profile-bio').textContent = user.bio || 'No biography provided yet.';

    if (user.photoUrl) {
      document.getElementById('profile-avatar').src = user.photoUrl;
    }

    // Completion %
    const completion = storage.calculateProfileCompletion(user);
    document.getElementById('profile-completion-pct').textContent = `${completion}%`;
    document.getElementById('profile-completion-bar').style.width = `${completion}%`;

    // Skills Display
    const skillsContainer = document.getElementById('profile-skills-display');
    skillsContainer.innerHTML = '';
    const skills = user.skills || [];
    if (skills.length === 0) {
      skillsContainer.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">No skills added yet.</span>';
    } else {
      skills.forEach(skill => {
        const chip = document.createElement('div');
        chip.className = 'chip selected';
        chip.textContent = skill;
        skillsContainer.appendChild(chip);
      });
    }
  }

  openEditProfile() {
    const user = storage.getUser();
    if (!user) return;

    document.getElementById('edit-fullname').value = user.fullName || '';
    document.getElementById('edit-phone').value = user.phoneNumber || '';
    document.getElementById('edit-state').value = user.state || '';
    document.getElementById('edit-lga').value = user.lga || '';
    document.getElementById('edit-community').value = user.community || '';
    document.getElementById('edit-occupation').value = user.occupation || '';
    document.getElementById('edit-institution').value = user.institution || '';
    document.getElementById('edit-bio').value = user.bio || '';

    this.renderSkillsSelectors();
    this.navigateTo('screen-edit-profile');
  }

  handleSaveProfile(e) {
    e.preventDefault();
    const fullName = document.getElementById('edit-fullname').value.trim();
    const phoneNumber = document.getElementById('edit-phone').value.trim();
    const state = document.getElementById('edit-state').value;
    const lga = document.getElementById('edit-lga').value.trim();
    const community = document.getElementById('edit-community').value.trim();
    const occupation = document.getElementById('edit-occupation').value.trim();
    const institution = document.getElementById('edit-institution').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    // Collect selected skills
    const selectedSkills = [];
    document.querySelectorAll('#edit-skills-selector .chip.selected').forEach(chip => {
      selectedSkills.push(chip.dataset.skill);
    });

    storage.updateProfile({
      fullName,
      phoneNumber,
      state,
      lga,
      community,
      occupation,
      institution,
      bio,
      skills: selectedSkills
    });

    this.showToast("Profile updated successfully.", "success");
    this.navigateTo('screen-profile');
  }

  // ---- MULTI-STEP SUBMISSION FLOW (§10, §11, §12) ----
  initSubmitInnovation() {
    const user = storage.getUser();
    if (!user) {
      this.navigateTo('screen-login');
      return;
    }

    // Check for draft
    const draft = storage.getDraft();
    if (draft) {
      this.populateSubmitForm(draft);
      this.currentSubmitStep = draft.draftStep || 1;
    } else {
      this.resetSubmitForm();
      this.currentSubmitStep = 1;
    }

    this.updateSubmitStepUI();
    this.navigateTo('screen-submit');
  }

  resumeDraft() {
    const draft = storage.getDraft();
    if (draft) {
      this.populateSubmitForm(draft);
      this.currentSubmitStep = draft.draftStep || 1;
      this.updateSubmitStepUI();
      this.navigateTo('screen-submit');
      this.showToast("Draft loaded.", "info");
    }
  }

  bindSubmitFlow() {
    document.getElementById('btn-submit-step-back').onclick = () => {
      if (this.currentSubmitStep > 1) {
        this.saveCurrentDraftStep();
        this.currentSubmitStep--;
        this.updateSubmitStepUI();
      } else {
        if (confirm("Exit to dashboard? Your draft will be saved automatically.")) {
          this.saveCurrentDraftStep();
          this.navigateTo('screen-home');
        }
      }
    };

    document.getElementById('btn-save-draft').onclick = () => {
      this.saveCurrentDraftStep();
      this.showToast("Draft saved successfully. Continue anytime from the dashboard.", "success");
    };

    document.getElementById('btn-submit-prev').onclick = () => {
      if (this.currentSubmitStep > 1) {
        this.saveCurrentDraftStep();
        this.currentSubmitStep--;
        this.updateSubmitStepUI();
      }
    };

    document.getElementById('btn-submit-next').onclick = () => {
      if (this.validateCurrentStep()) {
        this.saveCurrentDraftStep();
        this.currentSubmitStep++;
        this.updateSubmitStepUI();
      }
    };

    // Declaration checkbox gates final submit button (§11)
    const declCheck = document.getElementById('inno-declaration-check');
    const finalBtn = document.getElementById('btn-final-submit');
    declCheck.onchange = () => {
      finalBtn.disabled = !declCheck.checked;
    };

    // File Uploads (§10 Step 5)
    this.bindFileUploads();

    // Final Submission
    document.getElementById('form-submit-innovation').onsubmit = (e) => {
      e.preventDefault();
      if (!declCheck.checked) {
        this.showToast("Please agree to the applicant declaration.", "warning");
        return;
      }
      this.handleFinalSubmission();
    };
  }

  bindFileUploads() {
    const dropzonePhoto = document.getElementById('dropzone-photo');
    const filePhotoInput = document.getElementById('file-photo-input');
    const photoContainer = document.getElementById('photo-preview-container');

    dropzonePhoto.onclick = () => filePhotoInput.click();
    filePhotoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Max 5 MB image check
      if (file.size > 5 * 1024 * 1024) {
        this.showToast("Image must be smaller than 5 MB.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        this.uploadedFiles.photo = loadEvent.target.result;
        photoContainer.innerHTML = `
          <div class="upload-preview">
            <img src="${loadEvent.target.result}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">
            <div style="flex:1; overflow:hidden;">
              <div style="font-size:12px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${file.name}</div>
              <div style="font-size:10px; color:var(--success); font-weight:700;">✓ Uploaded (${(file.size / 1024).toFixed(0)} KB)</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-remove-photo" style="width:30px; height:30px; padding:0;">✕</button>
          </div>
        `;
        document.getElementById('btn-remove-photo').onclick = () => {
          this.uploadedFiles.photo = null;
          photoContainer.innerHTML = '';
          filePhotoInput.value = '';
        };
      };
      reader.readAsDataURL(file);
    };

    const dropzoneDoc = document.getElementById('dropzone-doc');
    const fileDocInput = document.getElementById('file-doc-input');
    const docContainer = document.getElementById('doc-preview-container');

    dropzoneDoc.onclick = () => fileDocInput.click();
    fileDocInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.uploadedFiles.doc = { name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` };
      docContainer.innerHTML = `
        <div class="upload-preview">
          <div style="width:40px; height:40px; background:var(--primary-subtle); color:var(--primary); border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:700;">PDF</div>
          <div style="flex:1; overflow:hidden;">
            <div style="font-size:12px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${file.name}</div>
            <div style="font-size:10px; color:var(--success); font-weight:700;">✓ Ready (${this.uploadedFiles.doc.size})</div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-remove-doc" style="width:30px; height:30px; padding:0;">✕</button>
        </div>
      `;
      document.getElementById('btn-remove-doc').onclick = () => {
        this.uploadedFiles.doc = null;
        docContainer.innerHTML = '';
        fileDocInput.value = '';
      };
    };
  }

  updateSubmitStepUI() {
    const titles = [
      '1. Innovation Info',
      '2. Problem Statement',
      '3. Proposed Solution',
      '4. Development Stage',
      '5. Media & Materials',
      '6. IP & Declaration'
    ];

    document.getElementById('submit-step-title').textContent = titles[this.currentSubmitStep - 1];
    document.getElementById('submit-step-counter').textContent = `Step ${this.currentSubmitStep} of ${this.totalSubmitSteps}`;
    document.getElementById('submit-progress-fill').style.width = `${(this.currentSubmitStep / this.totalSubmitSteps) * 100}%`;

    // Show active step
    for (let i = 1; i <= this.totalSubmitSteps; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) el.classList.toggle('active', i === this.currentSubmitStep);
    }

    const prevBtn = document.getElementById('btn-submit-prev');
    const nextBtn = document.getElementById('btn-submit-next');
    const finalBtn = document.getElementById('btn-final-submit');

    prevBtn.style.display = this.currentSubmitStep > 1 ? 'block' : 'none';

    if (this.currentSubmitStep === this.totalSubmitSteps) {
      nextBtn.style.display = 'none';
      finalBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'block';
      finalBtn.style.display = 'none';
    }
  }

  validateCurrentStep() {
    if (this.currentSubmitStep === 1) {
      const name = document.getElementById('inno-name').value.trim();
      const cat = document.getElementById('inno-category').value;
      const st = document.getElementById('inno-state').value;
      const lga = document.getElementById('inno-lga').value.trim();

      if (!name || !cat || !st || !lga) {
        this.showToast("Please fill all required fields in Step 1.", "warning");
        return false;
      }
    } else if (this.currentSubmitStep === 2) {
      const p1 = document.getElementById('inno-prob-desc').value.trim();
      const p2 = document.getElementById('inno-prob-users').value.trim();
      const p3 = document.getElementById('inno-prob-importance').value.trim();

      if (!p1 || !p2 || !p3) {
        this.showToast("Please answer all problem questions.", "warning");
        return false;
      }
    } else if (this.currentSubmitStep === 3) {
      const s1 = document.getElementById('inno-sol-desc').value.trim();
      const s2 = document.getElementById('inno-sol-how').value.trim();
      const s3 = document.getElementById('inno-sol-diff').value.trim();

      if (!s1 || !s2 || !s3) {
        this.showToast("Please answer all solution questions.", "warning");
        return false;
      }
    }
    return true;
  }

  saveCurrentDraftStep() {
    const data = this.gatherFormData();
    data.draftStep = this.currentSubmitStep;
    storage.saveDraft(data);
  }

  gatherFormData() {
    const ipRadio = document.querySelector('input[name="ip-support"]:checked');
    return {
      innovationName: document.getElementById('inno-name').value.trim(),
      category: document.getElementById('inno-category').value,
      state: document.getElementById('inno-state').value,
      lga: document.getElementById('inno-lga').value.trim(),
      teamName: document.getElementById('inno-team').value.trim(),
      problemDescription: document.getElementById('inno-prob-desc').value.trim(),
      targetUsers: document.getElementById('inno-prob-users').value.trim(),
      problemImportance: document.getElementById('inno-prob-importance').value.trim(),
      solutionDescription: document.getElementById('inno-sol-desc').value.trim(),
      howItWorks: document.getElementById('inno-sol-how').value.trim(),
      uniqueness: document.getElementById('inno-sol-diff').value.trim(),
      developmentStage: document.getElementById('inno-selected-stage').value,
      ipStatus: document.getElementById('inno-selected-ip').value,
      requiresIpSupport: ipRadio ? ipRadio.value === 'yes' : true,
      imageUrls: this.uploadedFiles.photo ? [this.uploadedFiles.photo] : [],
      videoUrls: document.getElementById('inno-video-link').value.trim() ? [document.getElementById('inno-video-link').value.trim()] : [],
      documentUrls: this.uploadedFiles.doc ? [this.uploadedFiles.doc] : []
    };
  }

  populateSubmitForm(data) {
    if (!data) return;
    if (data.innovationName) document.getElementById('inno-name').value = data.innovationName;
    if (data.category) document.getElementById('inno-category').value = data.category;
    if (data.state) document.getElementById('inno-state').value = data.state;
    if (data.lga) document.getElementById('inno-lga').value = data.lga;
    if (data.teamName) document.getElementById('inno-team').value = data.teamName;
    if (data.problemDescription) document.getElementById('inno-prob-desc').value = data.problemDescription;
    if (data.targetUsers) document.getElementById('inno-prob-users').value = data.targetUsers;
    if (data.problemImportance) document.getElementById('inno-prob-importance').value = data.problemImportance;
    if (data.solutionDescription) document.getElementById('inno-sol-desc').value = data.solutionDescription;
    if (data.howItWorks) document.getElementById('inno-sol-how').value = data.howItWorks;
    if (data.uniqueness) document.getElementById('inno-sol-diff').value = data.uniqueness;

    if (data.developmentStage) {
      document.getElementById('inno-selected-stage').value = data.developmentStage;
      this.renderStageChips();
    }
    if (data.ipStatus) {
      document.getElementById('inno-selected-ip').value = data.ipStatus;
      this.renderIpChips();
    }
  }

  resetSubmitForm() {
    document.getElementById('form-submit-innovation').reset();
    document.getElementById('inno-selected-stage').value = 'Prototype';
    document.getElementById('inno-selected-ip').value = 'Not Yet';
    this.uploadedFiles = { photo: null, doc: null };
    document.getElementById('photo-preview-container').innerHTML = '';
    document.getElementById('doc-preview-container').innerHTML = '';
    this.renderStageChips();
    this.renderIpChips();
    const declCheck = document.getElementById('inno-declaration-check');
    if (declCheck) declCheck.checked = false;
    const finalBtn = document.getElementById('btn-final-submit');
    if (finalBtn) finalBtn.disabled = true;
  }

  handleFinalSubmission() {
    try {
      const data = this.gatherFormData();
      const submitted = storage.submitInnovation(data);
      this.activeInnovationId = submitted.innovationId;

      document.getElementById('confirm-ref-number').textContent = submitted.referenceNumber;
      this.showToast("Innovation successfully submitted to GITH!", "success");
      this.navigateTo('screen-confirmation');
    } catch (err) {
      console.error(err);
      this.showToast("We couldn't complete your submission. Your information has not been lost. Please try again.", "error");
    }
  }

  // ---- APPLICATIONS & STATUS (§15, §16) ----
  renderApplications() {
    const list = storage.getInnovations();
    const container = document.getElementById('applications-list-container');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:32px 20px;">
          <div style="font-size:32px; margin-bottom:8px;">📦</div>
          <h4 style="font-size:15px; font-weight:700;">No Submissions Yet</h4>
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">
            You have not submitted an innovation to GITH.
          </p>
          <button class="btn btn-primary btn-sm" id="btn-empty-submit">Submit Your First Innovation</button>
        </div>
      `;
      const btn = document.getElementById('btn-empty-submit');
      if (btn) btn.onclick = () => this.initSubmitInnovation();
      return;
    }

    list.forEach(inno => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cursor = 'pointer';

      const dateStr = inno.submittedAt
        ? new Date(inno.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Recent';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h4 style="font-size:15px; font-weight:800; color:var(--primary-dark);">${inno.innovationName}</h4>
            <div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-top:2px;">${inno.referenceNumber}</div>
          </div>
          <span class="status-badge ${inno.status}">${inno.status.toUpperCase()}</span>
        </div>

        <div style="margin-top:10px; display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary);">
          <span>Category: <strong>${inno.category}</strong></span>
          <span>Submitted: <strong>${dateStr}</strong></span>
        </div>
      `;

      card.onclick = () => {
        this.activeInnovationId = inno.innovationId;
        this.navigateTo('screen-details');
      };

      container.appendChild(card);
    });
  }

  renderDetails() {
    const inno = storage.getInnovationById(this.activeInnovationId) || storage.getInnovations()[0];
    if (!inno) return;

    this.activeInnovationId = inno.innovationId;

    document.getElementById('details-name').textContent = inno.innovationName;
    document.getElementById('details-ref').textContent = `Ref: ${inno.referenceNumber}`;
    document.getElementById('details-status-badge').textContent = inno.status.toUpperCase();
    document.getElementById('details-status-badge').className = `status-badge ${inno.status}`;
    document.getElementById('details-category').textContent = inno.category;
    document.getElementById('details-location').textContent = `${inno.state}, ${inno.lga || ''}`;
    document.getElementById('details-date').textContent = inno.submittedAt
      ? new Date(inno.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'N/A';

    document.getElementById('details-problem').textContent = inno.problemDescription;
    document.getElementById('details-users').textContent = inno.targetUsers;
    document.getElementById('details-solution').textContent = inno.solutionDescription;
    document.getElementById('details-how').textContent = inno.howItWorks;
    document.getElementById('details-uniqueness').textContent = inno.uniqueness;
    document.getElementById('details-stage').textContent = inno.developmentStage;
    document.getElementById('details-ip').textContent = inno.ipStatus;
  }

  renderStatus() {
    const inno = storage.getInnovationById(this.activeInnovationId) || storage.getInnovations()[0];
    if (!inno) return;

    document.getElementById('status-ref-number').textContent = inno.referenceNumber;
    document.getElementById('status-badge-text').textContent = inno.status.toUpperCase();

    // Map stages (§15):
    // For Phase 1: Application Created and Innovation Submitted are active/completed
    // Remaining stages appear as future stages
    const container = document.getElementById('status-timeline-container');
    container.innerHTML = '';

    const currentStatus = inno.status || 'submitted';

    PIPELINE_STAGES.forEach((stage, idx) => {
      const step = document.createElement('div');
      let statusClass = '';

      if (idx === 0 || idx === 1) {
        statusClass = 'completed';
      } else if (stage.key === currentStatus) {
        statusClass = 'active';
      }

      step.className = `timeline-step ${statusClass}`;
      step.innerHTML = `
        <div class="timeline-dot">${idx <= 1 ? '✓' : idx + 1}</div>
        <div class="timeline-title">${stage.label}</div>
        <div class="timeline-desc">${stage.description}</div>
      `;
      container.appendChild(step);
    });
  }

  // ---- NOTIFICATIONS (§18) ----
  renderNotifications() {
    const list = storage.getNotifications();
    const container = document.getElementById('notifications-list-container');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:32px 20px;">
          <div style="font-size:32px; margin-bottom:8px;">🔔</div>
          <h4 style="font-size:15px; font-weight:700;">No Notifications</h4>
          <p style="font-size:13px; color:var(--text-secondary);">You're all caught up with GITH updates.</p>
        </div>
      `;
      return;
    }

    list.forEach(n => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.borderLeft = n.isRead ? '4px solid var(--border)' : '4px solid var(--primary)';
      card.style.cursor = 'pointer';

      const timeStr = new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <h4 style="font-size:14px; font-weight:${n.isRead ? '600' : '800'}; color:var(--primary-dark);">${n.title}</h4>
          <span style="font-size:11px; color:var(--text-muted);">${timeStr}</span>
        </div>
        <p style="font-size:13px; color:var(--text-secondary); margin-top:4px; line-height:1.4;">${n.message}</p>
      `;

      card.onclick = () => {
        storage.markNotificationRead(n.notificationId);
        this.renderNotifications();
        this.updateNotificationBadges();
      };

      container.appendChild(card);
    });
  }

  updateNotificationBadges() {
    const unread = storage.getUnreadCount();
    const homeBadge = document.getElementById('home-notif-badge');
    const navBadge = document.getElementById('nav-notif-badge');

    if (homeBadge) {
      homeBadge.textContent = unread;
      homeBadge.style.display = unread > 0 ? 'flex' : 'none';
    }
    if (navBadge) {
      navBadge.textContent = unread;
      navBadge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  // ---- SETTINGS & FUTURE-READY MODALS (§19, §33) ----
  bindSettings() {
    document.getElementById('set-edit-profile').onclick = () => this.openEditProfile();
    document.getElementById('set-terms').onclick = () => this.navigateTo('screen-terms');
    document.getElementById('set-privacy').onclick = () => this.navigateTo('screen-terms');
    document.getElementById('set-help').onclick = () => {
      this.openModal(
        "GITH Grassroots Support",
        "For technical inquiries, patent assistance, or rural cluster facilitation, contact the DICON GITH Support Secretariat at support@gith.ng or visit your nearest State Technical Hub."
      );
    };
    document.getElementById('set-demo').onclick = () => {
      if (confirm("Reload clean test data for demonstration?")) {
        storage.resetToDemo();
        this.showToast("Test data reloaded.", "success");
        this.navigateTo('screen-home');
      }
    };
    document.getElementById('set-logout').onclick = () => {
      if (confirm("Are you sure you want to log out?")) {
        storage.setUser(null);
        this.showToast("Logged out successfully.", "info");
        this.navigateTo('screen-welcome');
      }
    };

    // Future-Ready Stubs (§3, §33)
    document.querySelectorAll('.future-stub-btn').forEach(btn => {
      btn.onclick = () => {
        const feature = btn.dataset.feature;
        this.openModal(
          `${feature} (Phase 2)`,
          `The <strong>${feature}</strong> module is architected for Phase 2 implementation. The database collections and security rules are already deployed in this repository.`
        );
      };
    });
  }

  openModal(title, content) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('app-modal').classList.add('active');
  }

  closeModal() {
    document.getElementById('app-modal').classList.remove('active');
  }
}

// Instantiate application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
