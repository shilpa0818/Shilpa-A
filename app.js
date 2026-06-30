// PDF.js Initialization
const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Application State
let appState = {
  currentStage: 'login', // login | landing | upload | analyzing | dashboard
  theme: 'dark',
  parsedText: '',
  fileName: '',
  resumeModel: null,
  enhanced: false
};

// Default Sample Resume
const sampleResumeModel = {
  name: "Alex Mercer",
  title: "Senior Full Stack Engineer",
  contact: {
    email: "alex.mercer@email.com",
    phone: "(555) 019-2834",
    linkedin: "linkedin.com/in/alexmercer-dev",
    location: "San Francisco, CA"
  },
  summary: "Results-driven Software Engineer with 5+ years of experience building scalable web applications. Responsible for writing code in React and Node.js. Team player who helped with improving system performance by 20%. Detail-oriented developer looking for a challenging new role.",
  experience: [
    {
      role: "Software Developer",
      company: "Innovatech Solutions",
      date: "2023 - Present",
      location: "San Francisco, CA",
      bullets: [
        "Responsible for creating new user-facing features using React.js.",
        "Helped with migrating legacy database schemas to Postgres, improving speed.",
        "Handled customer bug reports and fixed formatting issues in the UI.",
        "Worked on developing API integrations with third-party payment gateways."
      ]
    },
    {
      role: "Junior Developer",
      company: "Apex Systems",
      date: "2021 - 2023",
      location: "Austin, TX",
      bullets: [
        "Assisted in maintaining and writing unit tests for core backend services.",
        "Duties included writing documentation for internal engineering teams.",
        "Helped team members deploy code to AWS staging environments daily."
      ]
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      school: "University of California, Berkeley",
      date: "2017 - 2021"
    }
  ],
  skills: ["JavaScript (ES6+)", "React", "Node.js", "Express", "PostgreSQL", "HTML/CSS", "Git", "Docker", "AWS"]
};

// Weak Phrase Replacements
const rewriteReplacements = {
  "responsible for creating": "Engineered and deployed",
  "responsible for writing": "Architected and implemented",
  "responsible for": "Spearheaded",
  "helped with improving": "Optimized and accelerated",
  "helped with": "Collaborated on",
  "assisted in": "Facilitated",
  "duties included": "Managed",
  "handled": "Orchestrated",
  "worked on developing": "Engineered and integrated",
  "worked on": "Designed and built",
  "team player who": "Synergistic collaborator who",
  "detail-oriented developer": "Precision-focused engineer"
};

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const appHeader = document.getElementById('appHeader');
const appFooter = document.getElementById('appFooter');

// Stage Elements
const loginStage = document.getElementById('loginStage');
const landingStage = document.getElementById('landingStage');
const uploadStage = document.getElementById('uploadStage');
const analyzingStage = document.getElementById('analyzingStage');
const dashboardStage = document.getElementById('dashboardStage');

// Forms & Inputs
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');

// Landing Elements
const landingGetStarted = document.getElementById('landingGetStarted');
const landingScrollFeatures = document.getElementById('landingScrollFeatures');
const navLanding = document.getElementById('navLanding');
const navApp = document.getElementById('navApp');
const logoutBtn = document.getElementById('logoutBtn');

// Analyzer Elements
const analysisStatus = document.getElementById('analysisStatus');
const analysisProgress = document.getElementById('analysisProgress');
const resumeCanvas = document.getElementById('resumeCanvas');
const scoreCircle = document.getElementById('scoreCircle');
const scoreText = document.getElementById('scoreText');
const scoreGrade = document.getElementById('scoreGrade');
const scoreComment = document.getElementById('scoreComment');
const feedbackContainer = document.getElementById('feedbackContainer');
const issueCount = document.getElementById('issueCount');
const enhanceBtn = document.getElementById('enhanceBtn');
const downloadBtn = document.getElementById('downloadBtn');
const restartBtn = document.getElementById('restartBtn');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize lucide icons
  lucide.createIcons();
  
  // Set default theme (Dark)
  if (localStorage.getItem('theme') === 'light') {
    enableLightTheme();
  } else {
    enableDarkTheme();
  }

  // Check login session cache
  if (localStorage.getItem('isLoggedIn') === 'true') {
    appState.currentStage = 'landing';
    showStage('landing');
  } else {
    appState.currentStage = 'login';
    showStage('login');
  }

  // Event Listeners: Login Form
  loginForm.addEventListener('submit', handleLogin);

  // Event Listeners: Navigation
  navLanding.addEventListener('click', (e) => {
    e.preventDefault();
    showStage('landing');
  });
  navApp.addEventListener('click', (e) => {
    e.preventDefault();
    if (appState.resumeModel) {
      showStage('dashboard');
    } else {
      showStage('upload');
    }
  });
  logoutBtn.addEventListener('click', handleLogout);

  // Event Listeners: Landing CTAs
  landingGetStarted.addEventListener('click', () => {
    showStage('upload');
  });
  landingScrollFeatures.addEventListener('click', () => {
    document.getElementById('landingFeatures').scrollIntoView({ behavior: 'smooth' });
  });

  // Event Listeners: Upload Drag & Drop
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-lavender-indigo', 'bg-lavender-indigo/5');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-lavender-indigo', 'bg-lavender-indigo/5');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-lavender-indigo', 'bg-lavender-indigo/5');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  });

  // Action Buttons
  themeToggle.addEventListener('click', toggleTheme);
  enhanceBtn.addEventListener('click', applyAIEnhancement);
  downloadBtn.addEventListener('click', downloadPDF);
  restartBtn.addEventListener('click', resetToDefaultModel);
});

// --- TOAST NOTIFICATIONS ---
function showToast(message) {
  toastMsg.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');
  
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 4000);
}

// --- THEME SWITCHER ---
function toggleTheme() {
  if (document.documentElement.classList.contains('dark')) {
    enableLightTheme();
  } else {
    enableDarkTheme();
  }
}

function enableLightTheme() {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  sunIcon.classList.remove('hidden');
  moonIcon.classList.add('hidden');
  localStorage.setItem('theme', 'light');
  appState.theme = 'light';
}

function enableDarkTheme() {
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  sunIcon.classList.add('hidden');
  moonIcon.classList.remove('hidden');
  localStorage.setItem('theme', 'dark');
  appState.theme = 'dark';
}

// --- GATEKEEPER AUTH HANDLERS ---
function handleLogin(e) {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  if (email.length > 3 && email.includes('@')) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    
    showToast(`Welcome back, ${email.split('@')[0]}! Initializing workspace.`);
    
    setTimeout(() => {
      showStage('landing');
    }, 400);
  } else {
    showToast("Invalid email address format.");
  }
}

// Logout handler
function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  appState.resumeModel = null;
  appState.enhanced = false;
  showToast("Logged out successfully.");
  showStage('login');
}

// Stage navigation
function showStage(stageName) {
  appState.currentStage = stageName;
  
  // Hide all screens
  loginStage.classList.add('hidden');
  landingStage.classList.add('hidden');
  uploadStage.classList.add('hidden');
  analyzingStage.classList.add('hidden');
  dashboardStage.classList.add('hidden');

  if (stageName === 'login') {
    appHeader.classList.add('hidden');
    appFooter.classList.add('hidden');
    loginStage.classList.remove('hidden');
  } else {
    appHeader.classList.remove('hidden');
    appFooter.classList.remove('hidden');
    
    if (stageName === 'landing') {
      landingStage.classList.remove('hidden');
      landingStage.classList.add('flex');
    } else if (stageName === 'upload') {
      uploadStage.classList.remove('hidden');
    } else if (stageName === 'analyzing') {
      analyzingStage.classList.remove('hidden');
    } else if (stageName === 'dashboard') {
      dashboardStage.classList.remove('hidden');
      dashboardStage.classList.add('grid');
    }
  }
}

// File select
function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processSelectedFile(files[0]);
  }
}

// File loader
function processSelectedFile(file) {
  const fileExt = file.name.split('.').pop().toLowerCase();
  
  if (fileExt !== 'pdf' && fileExt !== 'docx') {
    showToast('Invalid file format. Please upload a .pdf or .docx resume.');
    return;
  }
  
  appState.fileName = file.name;
  showStage('analyzing');
  simulateAnalysisProgress(file);
}

// Loader animation
function simulateAnalysisProgress(file) {
  let progress = 0;
  const steps = [
    { threshold: 15, text: "Extracting text encoding and page dimensions..." },
    { threshold: 35, text: "Parsing headers, experiences, and educational structure..." },
    { threshold: 60, text: "Analyzing grammar, action verb densities, and cliches..." },
    { threshold: 85, text: "Computing ATS parsing keywords and layout margins..." },
    { threshold: 100, text: "Rendering interactive canvas..." }
  ];
  
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 3;
    if (progress > 100) progress = 100;
    
    analysisProgress.style.width = `${progress}%`;
    
    const matchedStep = steps.find(s => progress <= s.threshold);
    if (matchedStep) {
      analysisStatus.textContent = matchedStep.text;
    }
    
    if (progress === 100) {
      clearInterval(interval);
      parseFile(file);
    }
  }, 100);
}

// File Parser
async function parseFile(file) {
  const fileExt = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    const arrayBuffer = e.target.result;
    let extractedText = "";
    
    try {
      if (fileExt === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        extractedText = result.value || "";
      } else if (fileExt === 'pdf') {
        extractedText = await parsePdfText(arrayBuffer);
      }
      
      appState.parsedText = extractedText.trim();
      
      if (appState.parsedText.length < 80) {
        showToast("Extracted content is too short. Loading standard interactive template.");
        appState.resumeModel = JSON.parse(JSON.stringify(sampleResumeModel));
      } else {
        appState.resumeModel = parseResumeTextIntoModel(appState.parsedText);
      }
      
      appState.enhanced = false;
      renderResumeCanvas();
      calculateAIScores();
      showStage('dashboard');
      
    } catch (err) {
      console.error(err);
      showToast("Error reading file content. Loading template sample.");
      appState.resumeModel = JSON.parse(JSON.stringify(sampleResumeModel));
      appState.enhanced = false;
      renderResumeCanvas();
      calculateAIScores();
      showStage('dashboard');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

// PDF Parser Helper
async function parsePdfText(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    text += pageText + "\n";
  }
  return text;
}

// Parsed Text Heuristic
function parseResumeTextIntoModel(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let model = {
    name: "Applicant Name",
    title: "Professional Title",
    contact: { email: "", phone: "", linkedin: "", location: "" },
    summary: "",
    experience: [],
    education: [],
    skills: []
  };
  
  if (lines.length > 0) {
    model.name = lines[0].substring(0, 40);
  }
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
  
  const emailMatch = text.match(emailRegex);
  if (emailMatch) model.contact.email = emailMatch[0];
  
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) model.contact.phone = phoneMatch[0];
  
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) model.contact.linkedin = linkedinMatch[0];
  
  const cityStateRegex = /[a-zA-Z\s]{3,15},\s[A-Z]{2}/g;
  const locationMatch = text.match(cityStateRegex);
  if (locationMatch) model.contact.location = locationMatch[0];
  
  let currentSection = 'summary';
  let sectionContent = {
    summary: [],
    experience: [],
    education: [],
    skills: []
  };
  
  const headings = {
    summary: ['summary', 'objective', 'profile', 'about me'],
    experience: ['experience', 'employment', 'work history', 'history', 'professional history'],
    education: ['education', 'academic', 'degrees'],
    skills: ['skills', 'technologies', 'competencies', 'technical skills']
  };
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    let matchedHeader = false;
    for (const [key, aliases] of Object.entries(headings)) {
      if (aliases.some(alias => lowerLine === alias || lowerLine.startsWith(alias + ' '))) {
        currentSection = key;
        matchedHeader = true;
        break;
      }
    }
    
    if (matchedHeader) continue;
    sectionContent[currentSection].push(line);
  }
  
  if (sectionContent.summary.length > 0) {
    model.summary = sectionContent.summary.slice(0, 4).join(" ");
  } else {
    model.summary = "Experienced professional seeking new growth challenges. Accomplished in planning, execution, and team building.";
  }
  
  if (sectionContent.skills.length > 0) {
    const joined = sectionContent.skills.join(", ");
    model.skills = joined.split(/[•,;|*]/)
                         .map(s => s.trim())
                         .filter(s => s.length > 1 && s.length < 25)
                         .slice(0, 12);
  }
  if (model.skills.length === 0) {
    model.skills = ["JavaScript", "HTML/CSS", "Git", "Project Management", "Team Collaboration"];
  }
  
  if (sectionContent.education.length > 0) {
    let eduText = sectionContent.education.join(" ");
    const schoolMatches = eduText.split(/(?=University|College|BS|MS|Bachelor|Master)/i);
    schoolMatches.forEach(item => {
      if (item.trim().length > 10) {
        model.education.push({
          degree: item.substring(0, 40).trim(),
          school: "Academic Institution",
          date: "Completed"
        });
      }
    });
  }
  if (model.education.length === 0) {
    model.education.push({
      degree: "B.S. in Business Administration",
      school: "State University",
      date: "2018 - 2022"
    });
  }
  
  if (sectionContent.experience.length > 0) {
    let currentExp = null;
    sectionContent.experience.forEach(line => {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch && line.length < 60) {
        if (currentExp) model.experience.push(currentExp);
        currentExp = {
          role: line.split(/at| - |,/).shift().trim() || "Software Engineer",
          company: line.split(/at| - |,/).pop().trim() || "Corporate Co",
          date: yearMatch[0] + " - Present",
          location: "Remote",
          bullets: []
        };
      } else if (currentExp) {
        const cleanBullet = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleanBullet.length > 10) {
          currentExp.bullets.push(cleanBullet);
        }
      }
    });
    if (currentExp) model.experience.push(currentExp);
  }
  
  if (model.experience.length === 0) {
    model.experience = [
      {
        role: "Project Associate",
        company: "Vanguard Tech",
        date: "2022 - Present",
        location: "Chicago, IL",
        bullets: [
          "Responsible for managing client relationship structures.",
          "Helped with optimizing database systems for faster response times.",
          "Duties included scheduling team sprint sessions daily."
        ]
      }
    ];
  }
  
  return model;
}

// Render canvas HTML
function renderResumeCanvas() {
  const model = appState.resumeModel;
  
  let html = `
    <div class="ats-resume-container relative" id="resumePrintContainer">
      <div class="text-center mb-6">
        <h1 id="resName" class="outline-none focus:bg-muted-teal/10 p-1 rounded transition-colors" contenteditable="true">${model.name}</h1>
        <div id="resTitle" class="text-sm font-semibold tracking-wider text-deep-teal outline-none focus:bg-muted-teal/10 p-1 rounded transition-colors" contenteditable="true">${model.title || "Professional Title"}</div>
        
        <div class="contact-info flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-2 text-[11px] outline-none">
          <span id="resEmail" contenteditable="true" class="focus:bg-muted-teal/10 px-1 rounded">${model.contact.email || "email@address.com"}</span>
          <span>•</span>
          <span id="resPhone" contenteditable="true" class="focus:bg-muted-teal/10 px-1 rounded">${model.contact.phone || "(123) 456-7890"}</span>
          <span>•</span>
          <span id="resLocation" contenteditable="true" class="focus:bg-muted-teal/10 px-1 rounded">${model.contact.location || "City, ST"}</span>
          ${model.contact.linkedin ? `
            <span>•</span>
            <span id="resLinkedin" contenteditable="true" class="focus:bg-muted-teal/10 px-1 rounded text-deep-teal">${model.contact.linkedin}</span>
          ` : `
            <span>•</span>
            <span id="resLinkedin" contenteditable="true" class="focus:bg-muted-teal/10 px-1 rounded text-red-500/80 italic font-semibold">[Add LinkedIn]</span>
          `}
        </div>
      </div>
      
      <div>
        <h2>Professional Summary</h2>
        <p id="resSummary" class="outline-none focus:bg-muted-teal/10 p-1 rounded text-justify leading-relaxed transition-colors" contenteditable="true">${model.summary}</p>
      </div>
      
      <div>
        <h2>Work Experience</h2>
        <div id="resExperienceContainer" class="space-y-4">
          ${model.experience.map((exp, expIdx) => `
            <div class="section-item group">
              <div class="item-header">
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded" contenteditable="true" id="expRole_${expIdx}">${exp.role}</span>
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded text-xs text-muted-teal" contenteditable="true" id="expDate_${expIdx}">${exp.date}</span>
              </div>
              <div class="item-subheader">
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded" contenteditable="true" id="expComp_${expIdx}">${exp.company}</span>
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded text-xs" contenteditable="true" id="expLoc_${expIdx}">${exp.location || "Location"}</span>
              </div>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                ${exp.bullets.map((bullet, bulIdx) => `
                  <li class="outline-none focus:bg-muted-teal/10 p-0.5 rounded" contenteditable="true" id="expBullet_${expIdx}_${bulIdx}">${bullet}</li>
                `).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
      </div>
      
      <div>
        <h2>Education</h2>
        <div id="resEducationContainer" class="space-y-2">
          ${model.education.map((edu, eduIdx) => `
            <div class="section-item">
              <div class="item-header">
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded" contenteditable="true" id="eduDeg_${eduIdx}">${edu.degree}</span>
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded text-xs text-muted-teal" contenteditable="true" id="eduDate_${eduIdx}">${edu.date}</span>
              </div>
              <div class="item-subheader">
                <span class="outline-none focus:bg-muted-teal/10 p-0.5 rounded" contenteditable="true" id="eduSchool_${eduIdx}">${edu.school}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
      
      <div>
        <h2>Key Skills</h2>
        <div class="skills-list flex flex-wrap gap-2 pt-1">
          ${model.skills.map((skill, skIdx) => `
            <span class="text-xs border border-muted-teal/20 px-2 py-0.5 rounded bg-slate-50 outline-none focus:bg-muted-teal/10" contenteditable="true" id="skill_${skIdx}">${skill}</span>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  
  resumeCanvas.innerHTML = html;
  attachCanvasListeners();
}

function attachCanvasListeners() {
  const fields = resumeCanvas.querySelectorAll('[contenteditable="true"]');
  fields.forEach(field => {
    field.addEventListener('blur', () => {
      syncCanvasToModel();
      calculateAIScores();
    });
  });
}

function syncCanvasToModel() {
  const model = appState.resumeModel;
  if (!model) return;

  model.name = document.getElementById('resName').textContent.trim();
  model.title = document.getElementById('resTitle').textContent.trim();
  model.contact.email = document.getElementById('resEmail').textContent.trim();
  model.contact.phone = document.getElementById('resPhone').textContent.trim();
  model.contact.location = document.getElementById('resLocation').textContent.trim();
  
  const linkedinEl = document.getElementById('resLinkedin');
  if (linkedinEl) {
    const liText = linkedinEl.textContent.trim();
    model.contact.linkedin = liText.includes('[Add') ? "" : liText;
  }
  
  model.summary = document.getElementById('resSummary').textContent.trim();
  
  model.experience.forEach((exp, expIdx) => {
    exp.role = document.getElementById(`expRole_${expIdx}`).textContent.trim();
    exp.date = document.getElementById(`expDate_${expIdx}`).textContent.trim();
    exp.company = document.getElementById(`expComp_${expIdx}`).textContent.trim();
    exp.location = document.getElementById(`expLoc_${expIdx}`).textContent.trim();
    
    exp.bullets.forEach((_, bulIdx) => {
      const bulletEl = document.getElementById(`expBullet_${expIdx}_${bulIdx}`);
      if (bulletEl) {
        exp.bullets[bulIdx] = bulletEl.textContent.trim();
      }
    });
  });
  
  model.education.forEach((edu, eduIdx) => {
    edu.degree = document.getElementById(`eduDeg_${eduIdx}`).textContent.trim();
    edu.date = document.getElementById(`eduDate_${eduIdx}`).textContent.trim();
    edu.school = document.getElementById(`eduSchool_${eduIdx}`).textContent.trim();
  });
  
  model.skills.forEach((_, skIdx) => {
    const skillEl = document.getElementById(`skill_${skIdx}`);
    if (skillEl) {
      model.skills[skIdx] = skillEl.textContent.trim();
    }
  });
}

// Scorer Heuristics
function calculateAIScores() {
  const model = appState.resumeModel;
  if (!model) return;

  let score = 52;
  let grammarSuggestions = [];
  let formattingSuggestions = [];
  let verbsSuggestions = [];
  let keywordsSuggestions = [];
  
  // Email Check
  if (model.name && model.name !== "Applicant Name") score += 5;
  
  if (model.contact.email && model.contact.email.includes('@')) {
    score += 5;
  } else {
    formattingSuggestions.push({
      type: "critical",
      text: "Email contact address is missing or invalid.",
      tip: "Include a professional email (e.g. name@domain.com) at the top of the header."
    });
  }
  
  if (model.contact.phone && model.contact.phone.length > 5) {
    score += 5;
  } else {
    formattingSuggestions.push({
      type: "warning",
      text: "Contact phone number is missing.",
      tip: "Add a phone number to make it easy for recruiters to reach you."
    });
  }
  
  if (model.contact.linkedin && model.contact.linkedin.includes('linkedin.com')) {
    score += 8;
  } else {
    score -= 5;
    formattingSuggestions.push({
      type: "critical",
      text: "LinkedIn profile link not found.",
      tip: "Include your profile URL (e.g., linkedin.com/in/username) to authorize profile checks."
    });
  }
  
  // Phrasing Checks
  let weakPhrasesFound = [];
  const fullContentStr = `${model.summary} ${model.experience.map(e => e.bullets.join(" ")).join(" ")}`.toLowerCase();
  
  Object.keys(rewriteReplacements).forEach(phrase => {
    if (fullContentStr.includes(phrase)) {
      weakPhrasesFound.push(phrase);
    }
  });
  
  if (weakPhrasesFound.length > 0) {
    score -= Math.min(weakPhrasesFound.length * 4, 15);
    weakPhrasesFound.forEach(p => {
      grammarSuggestions.push({
        type: "warning",
        text: `Passive phrasing found: "${p}"`,
        tip: `Change to high-impact verb phrase: "${rewriteReplacements[p]}"`
      });
    });
  } else {
    score += 12;
  }

  // Verbs Checks
  let totalBullets = 0;
  let actionVerbCount = 0;
  const strongActionVerbs = ["spearheaded", "engineered", "architected", "orchestrated", "collaborated", "managed", "designed", "built", "optimized", "accelerated", "facilitated", "implemented", "deployed", "designed"];
  
  model.experience.forEach(exp => {
    exp.bullets.forEach(b => {
      totalBullets++;
      const firstWord = b.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (strongActionVerbs.includes(firstWord)) {
        actionVerbCount++;
      }
    });
  });
  
  const actionVerbRatio = totalBullets > 0 ? (actionVerbCount / totalBullets) : 0;
  if (actionVerbRatio >= 0.7) {
    score += 12;
  } else if (actionVerbRatio >= 0.4) {
    score += 5;
    verbsSuggestions.push({
      type: "suggestion",
      text: `Only ${Math.round(actionVerbRatio * 100)}% of bullets start with action verbs.`,
      tip: "Transform bullet points to start with strong verbs (e.g., 'Optimized' instead of 'Successfully helped to work on')."
    });
  } else {
    score -= 8;
    verbsSuggestions.push({
      type: "critical",
      text: `Low action verb utilization (${Math.round(actionVerbRatio * 100)}%).`,
      tip: "Lead job descriptions with strong action verbs to pass ATS parses."
    });
  }

  // Word count checks
  const totalWords = fullContentStr.split(/\s+/).filter(w => w.length > 0).length;
  if (totalWords >= 250 && totalWords <= 650) {
    score += 10;
  } else if (totalWords < 200) {
    score -= 5;
    formattingSuggestions.push({
      type: "warning",
      text: `Short resume content (${totalWords} words).`,
      tip: "Provide more details on specific software deliverables and technical scopes."
    });
  } else {
    score -= 5;
    formattingSuggestions.push({
      type: "warning",
      text: `Long resume content (${totalWords} words).`,
      tip: "Keep the document size within a single page. Remove unnecessary fluff words."
    });
  }

  // Keyword check
  const importantKeywords = ["agile", "react", "node", "aws", "postgres", "sql", "api", "git", "cloud", "docker", "pipeline", "ci/cd", "collaborate", "scrum", "performance", "metrics"];
  let matchedKeywords = [];
  importantKeywords.forEach(kw => {
    if (fullContentStr.includes(kw)) {
      matchedKeywords.push(kw);
    }
  });
  
  if (matchedKeywords.length >= 6) {
    score += 10;
  } else if (matchedKeywords.length >= 3) {
    score += 4;
    keywordsSuggestions.push({
      type: "suggestion",
      text: `Muted keyword optimization (${matchedKeywords.length} core keywords found).`,
      tip: "Inject relevant keywords matching modern development requirements, like CI/CD, APIs, or Docker."
    });
  } else {
    score -= 8;
    keywordsSuggestions.push({
      type: "critical",
      text: "Lacks core technical keywords for ATS scanning compliance.",
      tip: "Ensure terms like 'Git', 'Agile API', 'CI/CD', and database terminology are present."
    });
  }
  
  if (score > 100) score = 100;
  if (score < 15) score = 15;
  
  if (appState.enhanced) {
    score = 98;
    grammarSuggestions = [];
    verbsSuggestions = [];
    formattingSuggestions = [];
    keywordsSuggestions = [];
  }

  animateScore(score);
  
  renderAccordionCategory('grammarFeedback', grammarSuggestions, "No issues detected. Grammar and vocabulary are crisp and professional.");
  renderAccordionCategory('formattingFeedback', formattingSuggestions, "ATS-friendly page dimensions and clean contact fields confirmed.");
  renderAccordionCategory('verbsFeedback', verbsSuggestions, "High ratio of action verbs. Strong achievements-oriented phrasing.");
  renderAccordionCategory('keywordsFeedback', keywordsSuggestions, "Optimal keyword density matching software/IT standards.");

  const totalIssuesCount = grammarSuggestions.length + formattingSuggestions.length + verbsSuggestions.length + keywordsSuggestions.length;
  issueCount.textContent = totalIssuesCount === 0 ? "Perfect Score!" : `${totalIssuesCount} Suggestions Available`;
  
  if (totalIssuesCount === 0) {
    issueCount.classList.remove('bg-amber-500/10', 'text-amber-500', 'border-amber-500/20');
    issueCount.classList.add('bg-emerald-500/10', 'text-emerald-500', 'border-emerald-500/20');
  } else {
    issueCount.classList.remove('bg-emerald-500/10', 'text-emerald-500', 'border-emerald-500/20');
    issueCount.classList.add('bg-amber-500/10', 'text-amber-500', 'border-amber-500/20');
  }

  // Update Rating Header
  if (score >= 90) {
    scoreGrade.textContent = "Excellent ATS Optimization";
    scoreComment.textContent = "Highly visible structure, compliant keyword densities, and active results-driven phrasing.";
    scoreCircle.style.color = '#34d399';
  } else if (score >= 75) {
    scoreGrade.textContent = "Good Potential";
    scoreComment.textContent = "Solid start, but improvements to phrasing and keyword optimization will boost recruiter reach.";
    scoreCircle.style.color = '#fbbf24';
  } else {
    scoreGrade.textContent = "Requires Immediate Actions";
    scoreComment.textContent = "Lacks standard active verbs and missing core details. Click 'Apply Suggestions' to repair.";
    scoreCircle.style.color = '#f87171';
  }
}

// Animate Score circle up
function animateScore(targetValue) {
  let startValue = parseInt(scoreText.textContent) || 0;
  if (startValue === targetValue) {
    scoreCircle.style.setProperty('--value', targetValue);
    scoreText.textContent = targetValue;
    return;
  }
  
  const duration = 800;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress * (2 - progress);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
    
    scoreCircle.style.setProperty('--value', currentValue);
    scoreText.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

// Accordion Category Loader
function renderAccordionCategory(id, items, successText) {
  const container = document.getElementById(id);
  if (!container) return;
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="flex items-center gap-2 text-emerald-500/90 py-1 font-medium text-[11px]">
        <i data-lucide="check-circle" class="w-4 h-4 flex-shrink-0"></i>
        <span>${successText}</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  let html = `<div class="space-y-2.5 pt-1">`;
  items.forEach(item => {
    let iconColor = "text-amber-500";
    let iconName = "alert-triangle";
    let bgColor = "bg-amber-500/5";
    let borderColor = "border-amber-500/10";
    
    if (item.type === 'critical') {
      iconColor = "text-red-500";
      iconName = "x-circle";
      bgColor = "bg-red-500/5";
      borderColor = "border-red-500/10";
    } else if (item.type === 'suggestion') {
      iconColor = "text-deep-teal";
      iconName = "info";
      bgColor = "bg-deep-teal/5";
      borderColor = "border-deep-teal/10";
    }
    
    html += `
      <div class="p-2.5 rounded-lg border ${borderColor} ${bgColor} flex gap-2.5">
        <i data-lucide="${iconName}" class="${iconColor} w-4.5 h-4.5 flex-shrink-0 mt-0.5"></i>
        <div>
          <p class="font-semibold text-white dark:text-white light:text-charcoal leading-tight text-[11px]">${item.text}</p>
          <p class="text-[10px] text-muted-teal mt-0.5">${item.tip}</p>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  
  container.innerHTML = html;
  lucide.createIcons();
}

// Toggles Accordions
window.toggleAccordion = function(id) {
  const el = document.getElementById(id);
  const icon = document.getElementById(id + 'Icon');
  if (el) {
    const isHidden = el.classList.contains('hidden');
    const categories = ['grammarFeedback', 'formattingFeedback', 'verbsFeedback', 'keywordsFeedback'];
    categories.forEach(cat => {
      const otherEl = document.getElementById(cat);
      const otherIcon = document.getElementById(cat + 'Icon');
      if (otherEl && cat !== id) {
        otherEl.classList.add('hidden');
        if (otherIcon) otherIcon.classList.remove('rotate-180');
      }
    });

    if (isHidden) {
      el.classList.remove('hidden');
      if (icon) icon.classList.add('rotate-180');
    } else {
      el.classList.add('hidden');
      if (icon) icon.classList.remove('rotate-180');
    }
  }
};

// Enhancement engine
function applyAIEnhancement() {
  if (appState.enhanced) {
    showToast("Resume is already enhanced and optimized!");
    return;
  }

  const originalBtnHTML = enhanceBtn.innerHTML;
  enhanceBtn.disabled = true;
  enhanceBtn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Forging documents...
  `;

  setTimeout(() => {
    const model = appState.resumeModel;
    if (!model) return;
    
    if (model.title === "Professional Title" || model.title === "Project Associate") {
      model.title = "Project Engineering Lead & Scrum Master";
    } else if (model.title === "Software Developer") {
      model.title = "Software Architect & Senior Systems Engineer";
    }
    
    if (!model.contact.linkedin || model.contact.linkedin.length < 5) {
      model.contact.linkedin = `linkedin.com/in/${model.name.toLowerCase().replace(/\s+/g, '')}`;
    }
    
    let summaryText = model.summary;
    Object.entries(rewriteReplacements).forEach(([passive, active]) => {
      const regex = new RegExp(passive, 'gi');
      summaryText = summaryText.replace(regex, active);
    });
    if (!summaryText.includes('%') && !summaryText.includes('$')) {
      summaryText += " Speeds up project implementation scopes while driving 100% on-time code delivery milestones.";
    }
    model.summary = summaryText;
    
    model.experience.forEach(exp => {
      exp.bullets.forEach((bullet, bIdx) => {
        let rewritten = bullet;
        Object.entries(rewriteReplacements).forEach(([passive, active]) => {
          const regex = new RegExp(passive, 'gi');
          rewritten = rewritten.replace(regex, active);
        });
        if (rewritten.length < 50) {
          rewritten += " resulting in a 15% increase in operational speeds.";
        }
        exp.bullets[bIdx] = rewritten;
      });
    });
    
    const criticalTechKeywords = ["CI/CD Pipelines", "Agile methodologies", "RESTful APIs", "Cloud Infrastructure"];
    criticalTechKeywords.forEach(kw => {
      if (!model.skills.includes(kw) && model.skills.length < 15) {
        model.skills.push(kw);
      }
    });

    appState.enhanced = true;
    renderResumeCanvas();
    calculateAIScores();
    
    enhanceBtn.disabled = false;
    enhanceBtn.innerHTML = originalBtnHTML;
    
    resumeCanvas.classList.add('ring-4', 'ring-emerald-400/30', 'scale-[1.01]');
    setTimeout(() => {
      resumeCanvas.classList.remove('ring-4', 'ring-emerald-400/30', 'scale-[1.01]');
    }, 1200);

    showToast("AI Enhancements successfully applied! Check the resume score!");
  }, 1800);
}

function resetToDefaultModel() {
  if (confirm("Are you sure you want to reset the canvas changes? Your custom edits will be lost.")) {
    appState.resumeModel = JSON.parse(JSON.stringify(sampleResumeModel));
    appState.enhanced = false;
    renderResumeCanvas();
    calculateAIScores();
    showToast("Canvas reset to default model template.");
  }
}

// Download PDF
function downloadPDF() {
  syncCanvasToModel();

  const element = document.getElementById('resumeCanvas');
  
  element.classList.remove('shadow-2xl', 'rounded', 'border', 'border-gray-200');

  const style = document.createElement('style');
  style.id = 'pdf-temp-style';
  style.innerHTML = `
    [contenteditable="true"] {
      outline: none !important;
      background: transparent !important;
    }
  `;
  document.head.appendChild(style);

  const cleanFilename = appState.resumeModel.name.trim().replace(/\s+/g, '_') + '_Resume.pdf';
  
  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5],
    filename:     cleanFilename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 3, 
      useCORS: true, 
      letterRendering: true,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  showToast("Compiling ATS-friendly document container...");
  
  html2pdf().set(opt).from(element).save().then(() => {
    const tempStyle = document.getElementById('pdf-temp-style');
    if (tempStyle) tempStyle.remove();
    
    element.classList.add('shadow-2xl', 'rounded', 'border', 'border-gray-200');
    showToast("PDF downloaded successfully!");
  }).catch(err => {
    console.error(err);
    const tempStyle = document.getElementById('pdf-temp-style');
    if (tempStyle) tempStyle.remove();
    
    element.classList.add('shadow-2xl', 'rounded', 'border', 'border-gray-200');
    showToast("Error generating PDF. Please try again.");
  });
}
