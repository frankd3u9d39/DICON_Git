/**
 * DICON GITH Application Master Reference Data
 * Grassroot Innovations Talent Hunt (GITH)
 */

export const GITH_CATEGORIES = [
  "Artificial Intelligence",
  "Software",
  "Hardware",
  "Robotics",
  "Agriculture",
  "Renewable Energy",
  "Manufacturing",
  "Defence & Security Technology",
  "Transportation",
  "Healthcare",
  "Education",
  "Environment",
  "FinTech",
  "Telecommunications",
  "Construction",
  "Water & Sanitation",
  "Industrial Technology",
  "Smart Cities",
  "Other"
];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export const DEVELOPMENT_STAGES = [
  "Idea",
  "Concept",
  "Research",
  "Prototype",
  "Functional Prototype",
  "Pilot",
  "Market Ready",
  "Commercialized"
];

export const IP_STATUS_OPTIONS = [
  "Patent",
  "Copyright",
  "Industrial Design",
  "Trademark",
  "Not Yet",
  "Not Applicable",
  "Prefer Not to Say"
];

export const AVAILABLE_SKILLS = [
  "Software Development",
  "Hardware Engineering",
  "Electronics & Circuitry",
  "Robotics & Automation",
  "Artificial Intelligence & ML",
  "Agriculture & Agritech",
  "Renewable Energy & Solar",
  "Manufacturing & 3D Printing",
  "Defence & Security Tech",
  "Product Design & CAD",
  "Scientific Research",
  "Embedded Systems",
  "Data Analytics",
  "Biotechnology",
  "Other"
];

export const PIPELINE_STAGES = [
  { key: "created", label: "Application Created", description: "Form initiated and registered" },
  { key: "submitted", label: "Innovation Submitted", description: "Verified & stored in GITH registry" },
  { key: "screening", label: "Screening", description: "Completeness and originality check" },
  { key: "verification", label: "Verification", description: "Grassroot identity and site verification" },
  { key: "assessment", label: "Assessment", description: "Evaluation by DICON technical panel" },
  { key: "shortlisted", label: "Shortlisted", description: "Selected among top grassroots innovators" },
  { key: "selected", label: "Selected", description: "Approved for GITH funding & national showcase" },
  { key: "mentorship", label: "Mentorship", description: "Paired with industry specialists" },
  { key: "incubation", label: "Incubation", description: "DICON R&D and manufacturing support" }
];

export const INITIAL_DEMO_INNOVATION = {
  innovationId: "demo-innovation-001",
  referenceNumber: "GITH-2026-004281",
  userId: "demo-user-uid",
  innovatorName: "Engr. Aminu Bello",
  innovationName: "Smart Community Energy Monitor",
  category: "Renewable Energy",
  state: "Kaduna",
  lga: "Kaduna North",
  community: "Unguwan Rimi",
  teamName: "K-Tech Energy Labs",
  problemDescription: "Over 60% of rural and peri-urban micro-grids in Northern Nigeria suffer frequent inverter burnouts and power theft due to lack of real-time decentralized monitoring.",
  targetUsers: "Rural cooperative societies, agricultural processing hubs, and community mini-grid operators.",
  problemImportance: "Prevents millions in agricultural produce spoilage and triples the operational lifespan of community solar installations.",
  solutionDescription: "A solar-powered IoT hardware gateway utilizing low-cost GSM and LoRa mesh telemetry to monitor current loads, detect phase imbalances, and alert technicians via SMS.",
  howItWorks: "Split-core current transformers measure live power flow. An onboard microcontroller runs edge-detection algorithms and transmits alerts to an offline dashboard.",
  uniqueness: "Engineered specifically for harsh sub-Saharan environmental conditions using locally sourced enclosure materials and operates with zero recurring cloud subscription.",
  developmentStage: "Prototype",
  ipStatus: "Not Yet",
  requiresIpSupport: true,
  imageUrls: [
    "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80"
  ],
  videoUrls: [],
  documentUrls: [
    { name: "Technical_Specifications_v1.pdf", size: "1.4 MB" }
  ],
  status: "submitted",
  isDemo: true,
  submittedAt: "2026-02-14T10:30:00Z",
  createdAt: "2026-02-14T09:15:00Z",
  updatedAt: "2026-02-14T10:30:00Z"
};

export const INITIAL_DEMO_USER = {
  uid: "demo-user-uid",
  fullName: "Engr. Aminu Bello",
  email: "aminu.bello@gith.ng",
  phoneNumber: "+234 803 123 4567",
  photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  role: "innovator",
  state: "Kaduna",
  lga: "Kaduna North",
  community: "Unguwan Rimi",
  occupation: "Hardware Systems Engineer",
  institution: "Ahmadu Bello University (Alumni)",
  bio: "Passionate embedded systems engineer focused on affordable, resilient renewable energy infrastructure for Nigerian rural communities.",
  skills: [
    "Hardware Engineering",
    "Electronics & Circuitry",
    "Renewable Energy & Solar",
    "Embedded Systems",
    "Product Design & CAD"
  ],
  createdAt: "2026-01-10T08:00:00Z",
  updatedAt: "2026-02-14T10:30:00Z",
  isActive: true,
  emailVerified: true
};

export const INITIAL_NOTIFICATIONS = [
  {
    notificationId: "notif-001",
    userId: "demo-user-uid",
    title: "Welcome to GITH!",
    message: "Welcome to the Grassroot Innovations Talent Hunt. Complete your profile and submit your first groundbreaking innovation.",
    type: "welcome",
    isRead: true,
    createdAt: "2026-01-10T08:01:00Z"
  },
  {
    notificationId: "notif-002",
    userId: "demo-user-uid",
    title: "Innovation Submitted Successfully",
    message: "Your application for 'Smart Community Energy Monitor' was submitted with Reference ID: GITH-2026-004281.",
    type: "submission_success",
    isRead: false,
    createdAt: "2026-02-14T10:30:00Z"
  },
  {
    notificationId: "notif-003",
    userId: "demo-user-uid",
    title: "Important GITH Announcement",
    message: "DICON R&D Directorate announces technical grant allocations for top renewable energy innovations.",
    type: "announcement",
    isRead: false,
    createdAt: "2026-02-15T09:00:00Z"
  }
];
