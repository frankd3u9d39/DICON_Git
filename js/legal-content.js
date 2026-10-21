/**
 * DICON GITH — Institutional Content & Legal Policies Management
 * Manages Privacy Policy, Terms & Conditions, and About GITH Charter.
 * Supports live editing from Admin Dashboard, Firestore cloud sync, and resilient local storage.
 */

import { firebaseService } from './firebase-config.js';

export const DEFAULT_PRIVACY_POLICY = `11. DATA SECURITY

We take the protection of personal information seriously.

Appropriate safeguards should be implemented to protect information against unauthorized access, disclosure, alteration, loss, or destruction.

These safeguards should include, as appropriate:

Firebase Authentication and secure account-management procedures.
Properly configured Firestore security rules.
Restricted access to uploaded documents.
Role-based access controls.
Secure administrative accounts.
Appropriate password and authentication practices.
Secure transmission of information.
Monitoring and logging of relevant administrative activities.
Regular review of permissions.
Secure backup and recovery procedures.
Procedures for responding to suspected data breaches.

Firebase provides security features such as encryption in transit and encryption at rest for supported services, but the security of the complete application also depends on how GITH is configured and operated.

No digital system can guarantee absolute security. Users should avoid sharing passwords or uploading unnecessary sensitive information.

12. DATA BREACHES

If a personal-data breach occurs, the responsible organization will assess the incident and take appropriate steps to contain, investigate, and remediate it.

Where notification is required, affected individuals and the relevant authorities will be notified in accordance with applicable legal requirements and timelines.

We may also take steps to:

Restrict unauthorized access.
Reset compromised credentials.
Secure affected records.
Preserve relevant evidence.
Investigate the cause.
Implement corrective measures.`;

export const DEFAULT_TERMS_AND_CONDITIONS = `20. INDEMNITY

To the extent permitted by applicable law, you may be responsible for losses or claims arising directly from your unlawful conduct, material misrepresentation, or infringement of another person's rights.

This provision does not automatically make you responsible for losses caused by the negligence, unlawful conduct, or independent obligations of GITH, DICON, or another party.

Any claim under this section must be assessed in accordance with applicable law.

21. COMPLAINTS AND DISPUTE RESOLUTION

If you have a complaint concerning your account, an innovation submission, an assessment, or the operation of the platform, please contact the official GITH support channel.

Where appropriate, we will attempt to resolve the matter through an administrative review or other reasonable process.

Nothing in these Terms prevents a user from exercising a statutory right or approaching a competent regulatory authority.

Any dispute that cannot be resolved informally will be handled in accordance with applicable Nigerian law and the jurisdiction of the competent courts, subject to any valid dispute-resolution agreement.

Governing Law: The laws of the Federal Republic of Nigeria.

Specific jurisdictional provisions should be confirmed by legal counsel before publication.

22. CHANGES TO THESE TERMS

We may update these Terms to reflect:

Changes in GITH's operations.
New platform features.
Changes in institutional arrangements.
Legal or regulatory developments.
Changes in technical or security requirements.
New programme procedures.

The revised Terms will display an updated revision date.

Where a change materially affects users' rights or obligations, appropriate notice will be provided where required.

Where fresh consent is legally required, we will obtain it before relying on that consent for the relevant activity.

Continued use of the platform after an effective update may constitute acceptance only to the extent permitted by applicable law and the circumstances of the change.

23. CONTACT INFORMATION

For questions concerning these Terms, contact:

DICON GITH APP — Programme Administration

Responsible Organization: Defence Industries Corporation of Nigeria (DICON)

Official Address: 45 Ahmadu Bello Way, Kaduna, Kaduna State, Nigeria

Support Email: support@dicon-gith.gov.ng

Telephone: +234 62 240 100 / +234 800 GITH DICON

For personal-data matters, contact the designated GITH Privacy Contact identified in the Privacy Policy.

24. FINAL PROVISIONS

If a provision of these Terms is found to be unlawful or unenforceable, the remaining provisions will continue to apply to the extent permitted by law.

A failure to enforce a provision immediately does not necessarily constitute a waiver of the relevant right.

These Terms should be read together with the Privacy Policy and any separate agreements applicable to particular programmes or development activities.

Where a separate written agreement expressly governs a particular matter, the relationship between that agreement and these Terms will be determined by its wording and applicable law.

Nothing in these Terms creates an employment relationship, partnership, agency, joint venture, or other legal relationship unless such a relationship is expressly established by a valid agreement.


DICON GITH APP

Grassroot Innovations Talent Hunt

Discovering Innovators. Developing Ideas. Creating Impact.

Identify a problem. Imagine a solution. Build it. Test it. Improve it. Deploy it.`;

export const DEFAULT_ABOUT_GITH = `ABOUT GITH

Grassroot Innovations Talent Hunt (GITH)

An initiative to discover, develop, and connect grassroots innovators with Nigeria’s wider innovation ecosystem.

1. Introduction

Grassroot Innovations Talent Hunt (GITH) is an innovation discovery and talent development initiative designed to identify, document, assess, nurture, and promote talented innovators, inventors, problem-solvers, developers, researchers, students, artisans, makers, and technology enthusiasts across Nigeria.

GITH is founded on the recognition that valuable ideas, technical skills, inventive abilities, and practical solutions exist in communities throughout the country. However, many innovators lack access to the institutional support, technical expertise, development facilities, mentorship, and networks required to advance their ideas.

GITH seeks to bridge this gap by establishing a structured pathway through which grassroots innovators can be discovered, their innovations documented, and promising solutions connected to opportunities for further development.

Through its institutional relationship with the Defence Industries Corporation of Nigeria (DICON), GITH is intended to provide a gateway through which identified talent and promising innovations can be considered for technical assessment, structured development, and appropriate opportunities within the broader innovation ecosystem.

2. DICON’s Institutional Role

DICON provides the institutional anchor for GITH, subject to its approved mandate and governance arrangements.

Within this framework, GITH serves as a grassroots innovation discovery and talent identification mechanism, while DICON provides the institutional context through which suitable innovations may be considered for further technical development and engagement with relevant expertise and facilities.

DICON’s role within the GITH framework is envisaged to include the following areas, as authorized and supported by its institutional mandate:

A. Institutional Direction and Coordination
Providing strategic direction for the initiative, establishing appropriate governance arrangements, and aligning GITH activities with approved institutional priorities.

B. Technical Assessment and Evaluation
Facilitating access to relevant technical expertise for the assessment of selected innovations, including their feasibility, functionality, development requirements, and potential applications.

C. Innovation Development Pathways
Establishing pathways through which promising innovations may be considered for prototyping, testing, technical refinement, research collaboration, and further development.

D. Technical Mentorship and Capacity Development
Supporting opportunities for innovators to receive relevant technical guidance, skills development, and mentorship through appropriately designated experts and partner institutions.

E. Innovation Infrastructure and Institutional Linkages
Where authorized and available, facilitating access to suitable laboratories, workshops, technical facilities, research resources, and institutional partnerships for approved innovation-development activities.

F. Technology Transfer and Application
Supporting the consideration of suitable innovations for technology transfer, pilot deployment, industrial application, commercialization, or other appropriate forms of utilization, subject to technical assessment, intellectual-property arrangements, institutional approvals, and applicable requirements.

G. Innovation Records and Institutional Learning
Supporting the systematic documentation of discovered talent, submitted innovations, assessment outcomes, and development progress to strengthen institutional understanding of grassroots innovation capabilities and opportunities.

DICON’s participation would provide an institutional framework through which grassroots innovation discovery can connect with structured technical development rather than ending at the point of talent identification.

3. The Relationship Between GITH and DICON

The relationship can be understood through a clear division of functions:

GITH discovers the talent.
It identifies innovators, captures their ideas, documents their inventions, and establishes an initial record of their capabilities and proposed solutions.

DICON provides the institutional pathway.
Within its approved mandate, DICON can facilitate the consideration of suitable innovations for technical assessment, development support, and engagement with relevant institutional resources.

The wider innovation ecosystem enables further opportunities.
Universities, research institutions, industry, technology hubs, investors, government agencies, and other partners may contribute complementary expertise, resources, partnerships, and opportunities where appropriate.

Together, these functions can establish a pathway from grassroots discovery to structured innovation development.

4. What GITH Does

GITH is designed to:
* Discover hidden innovation talent across Nigeria.
* Identify promising inventions, prototypes, ideas, and practical solutions.
* Establish a structured database of grassroots innovators and innovations.
* Encourage participation from communities, schools, technical institutions, workshops, and other environments.
* Provide a platform for innovators to document and present their work.
* Facilitate initial screening, verification, and assessment.
* Identify innovations that may warrant further technical investigation.
* Connect eligible innovators with relevant development opportunities.
* Create pathways to mentorship, prototyping, incubation, and testing.
* Encourage collaboration between grassroots innovators and appropriate institutions.
* Showcase promising innovations and their potential applications.
* Support the identification of opportunities for technology transfer, deployment, and commercialization.

5. Who Can Participate?

GITH is intended to accommodate innovators from diverse backgrounds, including:
* Students and young innovators.
* Inventors and independent developers.
* Engineers and technicians.
* Artisans, fabricators, and makers.
* Researchers and technology enthusiasts.
* Software and hardware developers.
* Entrepreneurs and innovation teams.
* Community-based problem-solvers.
* Schools, technical colleges, universities, and other educational institutions.

An innovation does not have to be a finished commercial product to be considered for submission.
Ideas, concepts, research outputs, experimental designs, prototypes, functional inventions, and existing solutions may be submitted for consideration under the applicable programme requirements.

6. The GITH Innovation Development Pathway

GITH is designed to establish a structured pathway from identifying talent to enabling further development.

DISCOVER → DOCUMENT → VERIFY → ASSESS → SELECT → DEVELOP → TEST → CONNECT → DEPLOY

Discover: Identify innovators and promising solutions in communities across Nigeria.
Document: Capture information about the innovator, the problem being addressed, the proposed solution, and the current development stage.
Verify: Review relevant information, supporting evidence, and the existence or status of the innovation.
Assess: Examine the innovation against defined technical, practical, and programme-specific criteria.
Select: Identify innovations suitable for particular development opportunities, subject to established selection procedures.
Develop: Connect selected innovators with appropriate technical guidance, resources, and development programmes.
Test: Where facilities and authorization permit, facilitate testing, validation, or refinement.
Connect: Identify suitable opportunities for collaboration with institutions, industry, and other ecosystem participants.
Deploy: Where appropriate, support pathways toward piloting, adoption, technology transfer, or commercialization.

Progression through these stages is not automatic. Each stage depends on the innovation’s readiness, assessment results, available resources, programme criteria, and relevant institutional approvals.

7. Our Vision

To establish a nationwide grassroots innovation discovery network that connects Nigeria’s untapped talent with institutional expertise and opportunities to transform promising ideas into practical solutions.

8. Our Mission

To systematically discover, document, assess, and nurture grassroots innovators across Nigeria while creating structured pathways through which promising innovations can access appropriate technical expertise, institutional support, mentorship, development opportunities, and wider innovation networks.

9. Our Guiding Philosophy

Innovation should be discovered wherever it exists, and promising talent should have a pathway to development.

GITH recognizes that an innovative solution may emerge from a school, a community workshop, a rural enterprise, a university laboratory, an independent inventor’s workspace, or an individual’s attempt to solve a practical problem.

The origin of an innovation should not, by itself, determine whether it receives consideration.

Instead, submissions should be assessed through transparent, appropriate criteria that take account of their technical characteristics, development stage, originality, potential applications, and the opportunities available for further investigation.

10. From Grassroots Discovery to Institutional Development

GITH is intended to serve as a bridge between grassroots innovators and structured innovation development.

Through its relationship with DICON, the initiative seeks to create a pathway for identifying promising talent beyond traditional innovation centres and connecting suitable innovations with relevant institutional processes and technical opportunities.

This approach can help build a clearer picture of the country’s grassroots innovation capabilities while creating opportunities for selected innovators to progress from early ideas to tested solutions and, where feasible, wider application.

By combining grassroots discovery with institutional coordination and appropriate technical development pathways, GITH can contribute to a more connected and accessible innovation ecosystem.

11. Our Commitment

GITH aims to promote an innovation-discovery process that is accessible, transparent, structured, and focused on practical problem-solving.

The initiative will seek to protect applicants’ information, respect intellectual-property considerations, establish clear assessment procedures, and communicate programme requirements and selection outcomes appropriately.

Participation or submission will not automatically guarantee selection, funding, access to facilities, intellectual-property protection, or commercialization.

GITH — Grassroot Innovations Talent Hunt

Discovering Innovators. Connecting Institutions. Developing Solutions. Creating Impact.`;

const STORAGE_PREFIX = 'dicon_gith_policy_v2_';

class LegalContentService {
  constructor() {
    this.defaults = {
      privacy: DEFAULT_PRIVACY_POLICY,
      terms: DEFAULT_TERMS_AND_CONDITIONS,
      about: DEFAULT_ABOUT_GITH
    };
    this.titles = {
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      about: 'About GITH Institutional Charter'
    };
  }

  /**
   * Retrieves current text for specified document type.
   * Checks Firestore first, then localStorage, then default.
   */
  async getPolicy(type) {
    if (!this.defaults[type]) type = 'privacy';

    // 1. Try Firestore setting doc
    try {
      const live = await firebaseService.getSetting(`policy_${type}`);
      if (live && live.content) {
        localStorage.setItem(`${STORAGE_PREFIX}${type}`, live.content);
        return {
          content: live.content,
          updatedAt: live.updatedAt || null,
          updatedBy: live.updatedBy || 'DICON Administration',
          source: 'firestore'
        };
      }
    } catch (e) {
      // Fall through to local
    }

    // 2. Try LocalStorage
    const local = localStorage.getItem(`${STORAGE_PREFIX}${type}`);
    if (local) {
      const meta = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${type}_meta`) || '{}');
      return {
        content: local,
        updatedAt: meta.updatedAt || null,
        updatedBy: meta.updatedBy || 'DICON Review Board',
        source: 'local'
      };
    }

    // 3. Fallback to default
    return {
      content: this.defaults[type],
      updatedAt: '2026-03-01T00:00:00Z',
      updatedBy: 'Institutional Default',
      source: 'default'
    };
  }

  /**
   * Saves updated policy text.
   * Updates Firestore if connected, and persists to localStorage.
   */
  async savePolicy(type, content, updatedBy = 'Admin Reviewer') {
    if (!this.defaults[type]) return false;

    const meta = {
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    // Store in localStorage immediately
    localStorage.setItem(`${STORAGE_PREFIX}${type}`, content);
    localStorage.setItem(`${STORAGE_PREFIX}${type}_meta`, JSON.stringify(meta));

    // Sync to Firestore
    try {
      await firebaseService.saveSetting(`policy_${type}`, {
        content,
        updatedBy,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn(`Firestore policy save notice: ${e.message}`);
    }

    // Dispatch a window event so all listeners on page can update
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('gith:policy-updated', { detail: { type, meta } }));
    }
    return true;
  }

  /**
   * Resets policy to official institutional default.
   */
  async resetPolicy(type) {
    if (!this.defaults[type]) return false;
    localStorage.removeItem(`${STORAGE_PREFIX}${type}`);
    localStorage.removeItem(`${STORAGE_PREFIX}${type}_meta`);

    try {
      await firebaseService.saveSetting(`policy_${type}`, {
        content: this.defaults[type],
        updatedBy: 'System Default Reset',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      // offline mode
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('gith:policy-updated', { detail: { type, isReset: true } }));
    }
    return this.defaults[type];
  }

  /**
   * Converts markdown-like structured text into elegant, styled HTML.
   */
  renderPolicyToHtml(rawText) {
    if (!rawText) return '';

    const lines = rawText.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      // Main Document Header
      if (i === 0 && line.toUpperCase().includes('DICON') || line.startsWith('ABOUT GITH')) {
        html += `<div class="legal-doc-banner">
          <div class="legal-doc-emblem">★</div>
          <div>
            <h1 class="legal-doc-main-title">${this.escapeHtml(line)}</h1>
            <div class="legal-doc-sub">Federal Republic of Nigeria • Defence Industries Corporation of Nigeria</div>
          </div>
        </div>`;
        continue;
      }

      // Pathway Banner (e.g., DISCOVER → DOCUMENT → ...)
      if (line.includes('→')) {
        const steps = line.split('→').map(s => s.trim());
        html += `<div class="legal-pathway-container">
          <div class="legal-pathway-title">GITH Talent Development Sequence</div>
          <div class="legal-pathway-flow">
            ${steps.map(s => `<span class="legal-pathway-step">${this.escapeHtml(s)}</span>`).join('<span class="legal-pathway-arrow">→</span>')}
          </div>
        </div>`;
        continue;
      }

      // Tagline Callout (Discovering Innovators...)
      if (line.includes('Discovering Innovators') || line.includes('Identify a problem.')) {
        html += `<div class="legal-quote-callout">
          <div class="legal-quote-accent">“</div>
          <p class="legal-quote-text">${this.escapeHtml(line)}</p>
        </div>`;
        continue;
      }

      // Main Section Headings (e.g. "1. Introduction", "11. DATA SECURITY", "20. INDEMNITY")
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (sectionMatch) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const num = sectionMatch[1];
        const title = sectionMatch[2];
        html += `<div class="legal-section-header">
          <span class="legal-section-num">${num}</span>
          <h2 class="legal-section-title">${this.escapeHtml(title)}</h2>
        </div>`;
        continue;
      }

      // Sub-section Headings (e.g. "A. Institutional Direction and Coordination")
      const subMatch = line.match(/^([A-G])\.\s+(.*)$/);
      if (subMatch) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<div class="legal-sub-header">
          <span class="legal-sub-badge">${subMatch[1]}</span>
          <h3 class="legal-sub-title">${this.escapeHtml(subMatch[2])}</h3>
        </div>`;
        continue;
      }

      // Bullet List Items (* or -)
      if (line.startsWith('* ') || line.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="legal-list">';
          inList = true;
        }
        const itemText = line.substring(2);
        html += `<li>${this.formatInline(itemText)}</li>`;
        continue;
      }

      // Standalone Bullet-like lines in Section 11 safeguards:
      if (line.endsWith('.') && line.length < 80 && (line.includes('Firebase') || line.includes('Firestore') || line.includes('Restricted') || line.includes('Role-based') || line.includes('Secure') || line.includes('Appropriate') || line.includes('Monitoring') || line.includes('Regular') || line.includes('Procedures') || line.includes('Reset') || line.includes('Preserve') || line.includes('Investigate') || line.includes('Implement'))) {
        if (!inList) {
          html += '<ul class="legal-list legal-safeguard-list">';
          inList = true;
        }
        html += `<li>${this.formatInline(line)}</li>`;
        continue;
      }

      // Standard Paragraph
      if (inList) {
        html += '</ul>';
        inList = false;
      }

      html += `<p class="legal-p">${this.formatInline(line)}</p>`;
    }

    if (inList) html += '</ul>';
    return html;
  }

  formatInline(text) {
    let out = this.escapeHtml(text);
    // Bold **text**
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return out;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Initializes and opens the Universal Legal & Institutional Modal
   */
  async openModal(initialTab = 'privacy') {
    let modalRoot = document.getElementById('gith-legal-modal');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'gith-legal-modal';
      modalRoot.className = 'gith-legal-modal-backdrop';
      modalRoot.innerHTML = `
        <div class="gith-legal-modal" role="dialog" aria-modal="true" aria-labelledby="gith-legal-modal-title">
          <div class="gith-legal-modal-header">
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="gith-legal-emblem-badge">★</div>
              <div>
                <h2 id="gith-legal-modal-title" class="gith-legal-header-title">Institutional Charter & Legal Policies</h2>
                <div class="gith-legal-header-sub">Defence Industries Corporation of Nigeria (DICON) • GITH Portal</div>
              </div>
            </div>
            <button id="gith-legal-modal-close" class="gith-legal-close-btn" aria-label="Close modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Tab Bar -->
          <div class="gith-legal-tabs">
            <button class="gith-legal-tab" data-tab="privacy">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Privacy Policy</span>
            </button>
            <button class="gith-legal-tab" data-tab="terms">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              <span>Terms & Conditions</span>
            </button>
            <button class="gith-legal-tab" data-tab="about">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>About GITH (11 Sections)</span>
            </button>
          </div>

          <!-- Document Meta Bar -->
          <div class="gith-legal-meta-bar" id="gith-legal-meta-bar">
            <span id="gith-legal-active-badge" class="gith-legal-status-pill">Official Policy Document</span>
            <span id="gith-legal-meta-info" style="font-size:12px; color:var(--text-secondary, #6B7280);">Authorized Institutional Version</span>
          </div>

          <!-- Body Content Area -->
          <div class="gith-legal-modal-body" id="gith-legal-modal-content">
            <div class="gith-legal-loading">Loading institutional document...</div>
          </div>

          <!-- Footer -->
          <div class="gith-legal-modal-footer">
            <div style="font-size:11px; color:#6B7280;">
              Governing Law: Laws of the Federal Republic of Nigeria
            </div>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn-gith-legal-print" id="btn-gith-legal-print">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print / Save PDF
              </button>
              <button type="button" class="btn-gith-legal-dismiss" id="btn-gith-legal-dismiss">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalRoot);

      // Event listeners
      modalRoot.querySelector('#gith-legal-modal-close').onclick = () => this.closeModal();
      modalRoot.querySelector('#btn-gith-legal-dismiss').onclick = () => this.closeModal();
      modalRoot.addEventListener('click', (e) => {
        if (e.target === modalRoot) this.closeModal();
      });

      modalRoot.querySelector('#btn-gith-legal-print').onclick = () => {
        window.print();
      };

      modalRoot.querySelectorAll('.gith-legal-tab').forEach(tabBtn => {
        tabBtn.onclick = () => {
          this.switchTab(tabBtn.getAttribute('data-tab'));
        };
      });
    }

    modalRoot.classList.add('active');
    document.body.style.overflow = 'hidden';

    await this.switchTab(initialTab);
  }

  async switchTab(tabType) {
    const modalRoot = document.getElementById('gith-legal-modal');
    if (!modalRoot) return;

    modalRoot.querySelectorAll('.gith-legal-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabType);
    });

    const contentArea = modalRoot.querySelector('#gith-legal-modal-content');
    contentArea.innerHTML = '<div class="gith-legal-loading">Loading institutional document...</div>';

    const policy = await this.getPolicy(tabType);
    contentArea.innerHTML = this.renderPolicyToHtml(policy.content);
    contentArea.scrollTop = 0;

    const metaInfo = modalRoot.querySelector('#gith-legal-meta-info');
    if (metaInfo) {
      const dateStr = policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Official';
      metaInfo.textContent = `Last Revised: ${dateStr} • Authenticated by ${policy.updatedBy || 'DICON Review Board'}`;
    }
  }

  closeModal() {
    const modalRoot = document.getElementById('gith-legal-modal');
    if (modalRoot) {
      modalRoot.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Automatically bind all click triggers on any page
   */
  initTriggers() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-legal], #link-reg-terms, #link-reg-privacy, #link-footer-privacy, #link-footer-terms, #link-footer-about, #set-terms, #set-privacy, #set-about');
      if (!target) return;

      e.preventDefault();

      let type = 'privacy';
      if (target.dataset && target.dataset.legal) {
        type = target.dataset.legal;
      } else if (target.id.includes('terms')) {
        type = 'terms';
      } else if (target.id.includes('about')) {
        type = 'about';
      } else if (target.id.includes('privacy')) {
        type = 'privacy';
      }

      this.openModal(type);
    });
  }
}

export const legalContentService = new LegalContentService();
