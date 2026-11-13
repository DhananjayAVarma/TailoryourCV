import type {
  AtsAnalysis,
  DensityMode,
  ExecutiveColorSwatch,
  MasterProfile,
  StudioSettings,
  TailoredResumeData,
} from '../types/cv.ts';

export const EXECUTIVE_SWATCHES: ExecutiveColorSwatch[] = [
  { name: 'Executive Navy', hex: '#1E3A8A' },
  { name: 'Charcoal Slate', hex: '#1E293B' },
  { name: 'Forest Emerald', hex: '#065F46' },
  { name: 'Burgundy Wine', hex: '#881337' },
  { name: 'Royal Indigo', hex: '#4338CA' },
  { name: 'Deep Teal', hex: '#0F766E' },
];

// Clean SVG portrait encoded as a data URL so the sample profile has an immediate, crisp headshot
export const SAMPLE_PORTRAIT_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DBEAFE"/>
      <stop offset="100%" stop-color="#E0E7FF"/>
    </linearGradient>
    <linearGradient id="suit" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" fill="url(#bg)"/>
  <circle cx="120" cy="215" r="82" fill="url(#suit)"/>
  <path d="M98 145 L120 185 L142 145 Z" fill="#FFFFFF"/>
  <path d="M116 154 L124 154 L126 188 L120 195 L114 188 Z" fill="#1E3A8A"/>
  <rect x="103" y="114" width="34" height="36" rx="14" fill="#F1C27D"/>
  <circle cx="120" cy="92" r="40" fill="#F5CBA7"/>
  <path d="M80 86 C80 54, 160 50, 160 86 C154 68, 134 62, 114 64 C96 66, 84 74, 80 86 Z" fill="#1E293B"/>
  <circle cx="106" cy="92" r="3.5" fill="#1E293B"/>
  <circle cx="134" cy="92" r="3.5" fill="#1E293B"/>
  <path d="M108 110 Q120 118 132 110" stroke="#9A6B4C" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>
`.trim());

export const SAMPLE_MASTER_PROFILE: MasterProfile = {
  personalInfo: {
    fullName: 'Elena Vance',
    targetHeadline: 'Senior Staff Product & Distributed Systems Engineer',
    email: 'elena.vance@vance-engineering.dev',
    phone: '+1 (415) 890-4321',
    location: 'San Francisco, CA',
    linkedinUrl: 'linkedin.com/in/elenavance-eng',
    portfolioUrl: 'github.com/elenavance',
    photoDataUrl: SAMPLE_PORTRAIT_DATA_URL,
  },
  summary:
    'Senior Full-Stack & Distributed Systems Engineer with 8+ years of experience architecting high-throughput cloud platforms, real-time analytics pipelines, and AI-assisted developer workflows. Proven track record of reducing infrastructure latency by 42%, scaling multi-region Kubernetes clusters to 18,000+ RPS, and leading cross-functional engineering squads from system design to enterprise production.',
  workExperience: [
    {
      id: 'exp-1',
      jobTitle: 'Staff Software Engineer — Cloud Platform',
      company: 'StratosScale Technologies',
      location: 'San Francisco, CA',
      startDate: 'Jan 2023',
      endDate: 'Present',
      bullets: [
        'Architected a multi-region event streaming pipeline using TypeScript, Go, and Apache Kafka handling 18,500+ events/sec with 99.99% uptime SLA.',
        'Spearheaded migration from monolithic REST services to federated GraphQL and gRPC microservices, cutting p95 API latency by 42% (from 310ms to 180ms).',
        'Designed and shipped an automated observability and FinOps dashboard in React 19 and OpenTelemetry, saving $340K annually in AWS compute and egress costs.',
        'Mentored 12 engineers across 3 platform squads and established architecture review RFC standards adopted across a 90-person engineering org.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Senior Full-Stack Software Engineer',
      company: 'Veridian FinTech',
      location: 'New York, NY (Hybrid)',
      startDate: 'Mar 2020',
      endDate: 'Dec 2022',
      bullets: [
        'Built real-time institutional treasury and risk analytics dashboards in React, TypeScript, and PostgreSQL serving 1,400+ enterprise finance teams.',
        'Engineered idempotent payment reconciliation workers in Node.js and Redis, processing $2.4B in annualized transaction volume with zero double-spend incidents.',
        'Reduced CI/CD deployment cycle times by 58% (from 45 minutes to 19 minutes) by introducing parallelized Docker build caching and automated Playwright integration suites.',
        'Collaborated with security and compliance teams to achieve SOC 2 Type II certification ahead of schedule.',
      ],
    },
    {
      id: 'exp-3',
      jobTitle: 'Software Engineer II',
      company: 'PulseMetrics AI',
      location: 'Seattle, WA',
      startDate: 'Jun 2018',
      endDate: 'Feb 2020',
      bullets: [
        'Developed interactive data visualization components and custom query builders using React, D3.js, and Python FastAPI for 45,000+ monthly active analysts.',
        'Optimized PostgreSQL time-series indexing and materialized views, accelerating complex cohort queries by 3.6x.',
        'Implemented role-based access control (RBAC) and OAuth 2.0 / OIDC SSO integrations for enterprise customers.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'TracePulse Open-Source Telemetry SDK',
      roleOrTechStack: 'Creator & Lead Maintainer · TypeScript, OpenTelemetry, WebWorkers',
      link: 'github.com/elenavance/tracepulse-sdk',
      bullets: [
        'Created a zero-dependency browser & Node.js performance tracing library with 3,200+ GitHub stars and 85K weekly npm downloads.',
        'Engineered batched compression transport using WebWorkers to keep main-thread overhead under 0.8ms per frame.',
      ],
    },
    {
      id: 'proj-2',
      name: 'SchemaGuard Migration Validator',
      roleOrTechStack: 'Core Author · Go, PostgreSQL AST, GitHub Actions',
      link: 'github.com/elenavance/schemaguard',
      bullets: [
        'Built a static analysis CLI tool that detects lock-inducing PostgreSQL schema migrations in pull requests before deployment.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'M.S. in Computer Science (Distributed Systems Track)',
      institution: 'University of Washington',
      location: 'Seattle, WA',
      graduationYear: '2018',
      gpaOrHonors: 'GPA: 3.92 / 4.0',
    },
    {
      id: 'edu-2',
      degree: 'B.S. in Computer Engineering',
      institution: 'University of California, San Diego',
      location: 'La Jolla, CA',
      graduationYear: '2016',
      gpaOrHonors: 'Magna Cum Laude',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      year: '2024',
    },
    {
      id: 'cert-2',
      name: 'Certified Kubernetes Application Developer (CKAD)',
      issuer: 'Cloud Native Computing Foundation',
      year: '2023',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Languages & Core Stack',
      skills: ['TypeScript', 'JavaScript (ES2024)', 'Go', 'Python', 'SQL', 'HTML5/CSS3'],
    },
    {
      id: 'skill-2',
      category: 'Frontend & Architecture',
      skills: ['React 19', 'Next.js', 'Tailwind CSS', 'GraphQL', 'State Machines', 'D3.js', 'Playwright'],
    },
    {
      id: 'skill-3',
      category: 'Cloud, Data & Infrastructure',
      skills: ['AWS', 'Kubernetes', 'Docker', 'PostgreSQL', 'Apache Kafka', 'Redis', 'gRPC', 'OpenTelemetry', 'Terraform'],
    },
    {
      id: 'skill-4',
      category: 'Leadership & Practices',
      skills: ['System Design', 'Technical RFCs', 'FinOps Optimization', 'SOC 2 Compliance', 'Agile Mentorship'],
    },
  ],
};

export const SAMPLE_JOB_DESCRIPTION = `Staff Full-Stack & Platform Engineer — Meridian Cloud AI
We are seeking a Staff Full-Stack & Platform Engineer to lead our next-generation observability and cloud control plane.

Key Responsibilities:
- Architect and scale high-throughput distributed services using TypeScript, Go, Node.js, and GraphQL/gRPC.
- Build responsive, high-density enterprise dashboards using React, TypeScript, and Tailwind CSS.
- Optimize PostgreSQL, Redis, and Apache Kafka data pipelines for sub-200ms p95 latency and 99.99% availability.
- Drive cloud cost efficiency (FinOps), OpenTelemetry instrumentation, Kubernetes orchestration on AWS, and CI/CD automation.
- Partner with security teams on SOC 2 compliance and mentor senior engineers through technical RFCs.
- Bonus experience with Rust, ClickHouse, or WebAssembly.`;

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  activeDocument: 'resume',
  template: 'modern-minimal',
  density: 'normal',
  targetLength: '1-page',
  showPhoto: true,
  accentColor: '#1E3A8A',
  jobDescription: SAMPLE_JOB_DESCRIPTION,
  targetCompany: 'Meridian Cloud AI',
};

export function createInitialTailoredData(
  profile: MasterProfile = SAMPLE_MASTER_PROFILE,
  targetCompany: string = 'Meridian Cloud AI',
  jobDescription: string = SAMPLE_JOB_DESCRIPTION
): TailoredResumeData {
  const ats = computeLocalAtsAnalysis(profile, jobDescription);
  return {
    targetHeadline: profile.personalInfo.targetHeadline || 'Staff Full-Stack & Distributed Systems Engineer',
    summary:
      `Staff-level Full-Stack & Distributed Systems Engineer with 8+ years of experience building high-throughput cloud platforms in TypeScript, Go, React, and PostgreSQL. Proven track record delivering 42% p95 latency reductions, scaling Kafka and Kubernetes pipelines to 18,500+ RPS at 99.99% uptime, and driving $340K+ in annual AWS FinOps savings—directly aligned with ${targetCompany || 'your organization'}'s platform engineering mission.`,
    workExperience: profile.workExperience.map((item) => ({
      ...item,
      bullets: [...item.bullets],
    })),
    projects: profile.projects.map((proj) => ({
      ...proj,
      bullets: [...proj.bullets],
    })),
    education: profile.education.map((edu) => ({ ...edu })),
    certifications: profile.certifications.map((cert) => ({ ...cert })),
    skills: profile.skills.map((cat) => ({
      ...cat,
      skills: [...cat.skills],
    })),
    coverLetter: {
      recipientName: 'Hiring Committee',
      recipientTitle: 'Engineering Leadership Team',
      companyName: targetCompany || 'Meridian Cloud AI',
      companyAddress: 'San Francisco, CA',
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      subjectLine: `Application for ${profile.personalInfo.targetHeadline || 'Staff Software Engineer'}`,
      salutation: `Dear ${targetCompany || 'Meridian Cloud AI'} Engineering Team,`,
      openingParagraph: `I am writing to express my strong interest in the Staff Full-Stack & Platform Engineer role at ${targetCompany || 'Meridian Cloud AI'}. With over eight years of experience architecting distributed cloud backends and responsive React/TypeScript control planes, my background aligns closely with your focus on low-latency telemetry, Kubernetes scalability, and high-velocity developer workflows.`,
      bodyParagraphs: [
        `At StratosScale Technologies, I architected a multi-region event streaming platform using TypeScript, Go, and Apache Kafka capable of sustaining 18,500+ events per second at a 99.99% SLA. By spearheading the transition from monolithic REST endpoints to federated GraphQL and gRPC microservices, my team reduced p95 API latency by 42% (from 310ms to 180ms) while saving $340K annually in AWS infrastructure costs through custom OpenTelemetry FinOps instrumentation.`,
        `Previously at Veridian FinTech, I engineered real-time institutional analytics interfaces in React, TypeScript, and PostgreSQL alongside idempotent Node.js and Redis reconciliation workers processing $2.4B in annual volume. Beyond code execution, I take pride in elevating engineering standards—having mentored 12 engineers across three platform squads, cut CI/CD deployment times by 58%, and partnered directly on SOC 2 Type II compliance.`,
      ],
      closingParagraph: `I would welcome the opportunity to discuss how my experience scaling distributed systems, React observability interfaces, and cloud-native infrastructure can accelerate ${targetCompany || 'Meridian Cloud AI'}'s product roadmap. Thank you for your time and consideration.`,
      signOff: 'Sincerely,',
    },
    atsAnalysis: ats,
  };
}

export function validateHexColor(input: string): string {
  const cleaned = input.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  return '#1E3A8A';
}

export function hexToRgba(hex: string, alpha: number): string {
  const validHex = validateHexColor(hex).replace('#', '');
  const r = parseInt(validHex.substring(0, 2), 16);
  const g = parseInt(validHex.substring(2, 4), 16);
  const b = parseInt(validHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function sanitizeCoverLetterSignOff(
  signOff: string,
  fullName: string = ''
): string {
  let cleaned = (signOff || '').replace(/\r\n/g, '\n').trim();
  if (!cleaned) return 'Sincerely,';

  const trimmedName = (fullName || '').trim();
  if (trimmedName) {
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned
      .replace(new RegExp(`[\\s\\n]+${escapedName}\\s*$`, 'i'), '')
      .trim();
  }

  // If signOff still spans multiple lines (e.g. "Sincerely,\nCandidate Name"), keep only the closing phrase line
  if (cleaned.includes('\n')) {
    const firstLine = cleaned
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean);
    if (firstLine) {
      cleaned = firstLine;
    }
  }

  return cleaned || 'Sincerely,';
}

export interface DensityConfig {
  pagePaddingMm: string;
  baseFontSizePx: number;
  lineHeight: number;
  sectionGapPx: number;
  itemGapPx: number;
  headerBottomMarginPx: number;
  bulletSpacingPx: number;
}

export function getDensityStyles(density: DensityMode): DensityConfig {
  switch (density) {
    case 'compact':
      return {
        pagePaddingMm: '14mm',
        baseFontSizePx: 11.5,
        lineHeight: 1.35,
        sectionGapPx: 12,
        itemGapPx: 8,
        headerBottomMarginPx: 12,
        bulletSpacingPx: 2,
      };
    case 'relaxed':
      return {
        pagePaddingMm: '18mm',
        baseFontSizePx: 13.5,
        lineHeight: 1.58,
        sectionGapPx: 20,
        itemGapPx: 14,
        headerBottomMarginPx: 20,
        bulletSpacingPx: 5,
      };
    case 'normal':
    default:
      return {
        pagePaddingMm: '16mm',
        baseFontSizePx: 12.5,
        lineHeight: 1.46,
        sectionGapPx: 16,
        itemGapPx: 11,
        headerBottomMarginPx: 16,
        bulletSpacingPx: 3.5,
      };
  }
}

const KNOWN_TECH_AND_DOMAIN_KEYWORDS = [
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'Go',
  'Golang',
  'Python',
  'Rust',
  'Java',
  'C++',
  'C#',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'ClickHouse',
  'GraphQL',
  'gRPC',
  'REST',
  'Apache Kafka',
  'RabbitMQ',
  'AWS',
  'GCP',
  'Azure',
  'Kubernetes',
  'Docker',
  'Terraform',
  'OpenTelemetry',
  'Prometheus',
  'Grafana',
  'Datadog',
  'Tailwind CSS',
  'Playwright',
  'Cypress',
  'Jest',
  'CI/CD',
  'GitHub Actions',
  'Microservices',
  'Distributed Systems',
  'System Design',
  'FinOps',
  'SOC 2',
  'OAuth',
  'RBAC',
  'WebAssembly',
  'Machine Learning',
  'LLM',
  'D3.js',
  'FastAPI',
  'Express',
  'Linux',
];

export function flattenProfileText(profile: MasterProfile): string {
  const parts: string[] = [
    profile.personalInfo.fullName,
    profile.personalInfo.targetHeadline,
    profile.summary,
    ...profile.workExperience.flatMap((w) => [w.jobTitle, w.company, ...w.bullets]),
    ...profile.projects.flatMap((p) => [p.name, p.roleOrTechStack, ...p.bullets]),
    ...profile.education.flatMap((e) => [e.degree, e.institution, e.gpaOrHonors]),
    ...profile.certifications.flatMap((c) => [c.name, c.issuer]),
    ...profile.skills.flatMap((s) => [s.category, ...s.skills]),
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function computeLocalAtsAnalysis(
  profile: MasterProfile,
  jobDescription: string
): AtsAnalysis {
  const jdText = (jobDescription || '').trim();
  if (!jdText) {
    return {
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      tailoringNotes: 'Paste a target job description to analyze keyword alignment and skill gaps.',
    };
  }

  const profileCorpus = flattenProfileText(profile);
  const jdLower = jdText.toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of KNOWN_TECH_AND_DOMAIN_KEYWORDS) {
    const kwLower = kw.toLowerCase();
    // Check if keyword appears in JD with word boundary or substring for multi-word/special symbols
    const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(jdLower)) {
      if (regex.test(profileCorpus) || profileCorpus.includes(kwLower)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }
  }

  // Also extract capitalized technical terms or significant tokens from the JD if few standard keywords matched
  if (matched.length + missing.length < 5) {
    const tokens = Array.from(
      new Set(
        jdText
          .split(/[\s,.;:()/]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 4 && /^[A-Za-z][A-Za-z0-9+#.-]*$/.test(t))
      )
    );
    const stopWords = new Set([
      'with',
      'from',
      'that',
      'this',
      'your',
      'have',
      'will',
      'work',
      'team',
      'role',
      'looking',
      'seeking',
      'experience',
      'years',
      'bonus',
      'responsibilities',
      'requirements',
      'about',
    ]);
    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (stopWords.has(lower)) continue;
      if (matched.some((m) => m.toLowerCase() === lower) || missing.some((m) => m.toLowerCase() === lower)) {
        continue;
      }
      if (profileCorpus.includes(lower)) {
        matched.push(token);
      } else if (missing.length < 6) {
        missing.push(token);
      }
      if (matched.length + missing.length >= 14) break;
    }
  }

  const total = matched.length + missing.length;
  const rawScore = total > 0 ? Math.round((matched.length / total) * 100) : 75;
  const matchScore = Math.max(15, Math.min(99, rawScore));

  return {
    matchScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    tailoringNotes:
      missing.length > 0
        ? `Aligned ${matched.length} core keywords from your Master Profile. ${missing.length} JD keywords (${missing.slice(0, 4).join(', ')}) were not found in your vault and were strictly excluded to prevent fabrication.`
        : `Strong alignment across all ${matched.length} detected job description keywords using verified facts from your Master Profile.`,
  };
}

export function normalizeMasterProfile(raw: unknown): MasterProfile {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const pInfo = (obj.personalInfo && typeof obj.personalInfo === 'object' ? obj.personalInfo : {}) as Record<
    string,
    any
  >;

  const makeId = (prefix: string, idx: number) => `${prefix}-${Date.now()}-${idx}`;

  return {
    personalInfo: {
      fullName: typeof pInfo.fullName === 'string' ? pInfo.fullName : '',
      targetHeadline: typeof pInfo.targetHeadline === 'string' ? pInfo.targetHeadline : '',
      email: typeof pInfo.email === 'string' ? pInfo.email : '',
      phone: typeof pInfo.phone === 'string' ? pInfo.phone : '',
      location: typeof pInfo.location === 'string' ? pInfo.location : '',
      linkedinUrl: typeof pInfo.linkedinUrl === 'string' ? pInfo.linkedinUrl : '',
      portfolioUrl: typeof pInfo.portfolioUrl === 'string' ? pInfo.portfolioUrl : '',
      photoDataUrl: typeof pInfo.photoDataUrl === 'string' ? pInfo.photoDataUrl : '',
    },
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    workExperience: Array.isArray(obj.workExperience)
      ? obj.workExperience.map((w: any, idx: number) => ({
          id: typeof w?.id === 'string' && w.id ? w.id : makeId('exp', idx),
          jobTitle: typeof w?.jobTitle === 'string' ? w.jobTitle : '',
          company: typeof w?.company === 'string' ? w.company : '',
          location: typeof w?.location === 'string' ? w.location : '',
          startDate: typeof w?.startDate === 'string' ? w.startDate : '',
          endDate: typeof w?.endDate === 'string' ? w.endDate : '',
          bullets: Array.isArray(w?.bullets)
            ? w.bullets.map((b: any) => String(b || '').trim()).filter(Boolean)
            : [],
        }))
      : [],
    projects: Array.isArray(obj.projects)
      ? obj.projects.map((p: any, idx: number) => ({
          id: typeof p?.id === 'string' && p.id ? p.id : makeId('proj', idx),
          name: typeof p?.name === 'string' ? p.name : '',
          roleOrTechStack: typeof p?.roleOrTechStack === 'string' ? p.roleOrTechStack : '',
          link: typeof p?.link === 'string' ? p.link : '',
          bullets: Array.isArray(p?.bullets)
            ? p.bullets.map((b: any) => String(b || '').trim()).filter(Boolean)
            : [],
        }))
      : [],
    education: Array.isArray(obj.education)
      ? obj.education.map((e: any, idx: number) => ({
          id: typeof e?.id === 'string' && e.id ? e.id : makeId('edu', idx),
          degree: typeof e?.degree === 'string' ? e.degree : '',
          institution: typeof e?.institution === 'string' ? e.institution : '',
          location: typeof e?.location === 'string' ? e.location : '',
          graduationYear: typeof e?.graduationYear === 'string' ? e.graduationYear : '',
          gpaOrHonors: typeof e?.gpaOrHonors === 'string' ? e.gpaOrHonors : '',
        }))
      : [],
    certifications: Array.isArray(obj.certifications)
      ? obj.certifications.map((c: any, idx: number) => ({
          id: typeof c?.id === 'string' && c.id ? c.id : makeId('cert', idx),
          name: typeof c?.name === 'string' ? c.name : '',
          issuer: typeof c?.issuer === 'string' ? c.issuer : '',
          year: typeof c?.year === 'string' ? c.year : '',
        }))
      : [],
    skills: Array.isArray(obj.skills)
      ? obj.skills.map((s: any, idx: number) => ({
          id: typeof s?.id === 'string' && s.id ? s.id : makeId('skill', idx),
          category: typeof s?.category === 'string' && s.category ? s.category : 'Skills',
          skills: Array.isArray(s?.skills)
            ? s.skills.map((k: any) => String(k || '').trim()).filter(Boolean)
            : [],
        }))
      : [],
  };
}

export function mergeMasterProfiles(
  existing: MasterProfile,
  incomingRaw: unknown
): MasterProfile {
  const incoming = normalizeMasterProfile(incomingRaw);

  const mergedPersonalInfo = {
    fullName: incoming.personalInfo.fullName || existing.personalInfo.fullName,
    targetHeadline: incoming.personalInfo.targetHeadline || existing.personalInfo.targetHeadline,
    email: incoming.personalInfo.email || existing.personalInfo.email,
    phone: incoming.personalInfo.phone || existing.personalInfo.phone,
    location: incoming.personalInfo.location || existing.personalInfo.location,
    linkedinUrl: incoming.personalInfo.linkedinUrl || existing.personalInfo.linkedinUrl,
    portfolioUrl: incoming.personalInfo.portfolioUrl || existing.personalInfo.portfolioUrl,
    photoDataUrl: incoming.personalInfo.photoDataUrl || existing.personalInfo.photoDataUrl,
  };

  const mergedWork = [...existing.workExperience];
  for (const item of incoming.workExperience) {
    const dupIdx = mergedWork.findIndex(
      (w) =>
        w.company.toLowerCase() === item.company.toLowerCase() &&
        w.jobTitle.toLowerCase() === item.jobTitle.toLowerCase()
    );
    if (dupIdx >= 0) {
      const combinedBullets = Array.from(new Set([...mergedWork[dupIdx].bullets, ...item.bullets]));
      mergedWork[dupIdx] = {
        ...mergedWork[dupIdx],
        startDate: item.startDate || mergedWork[dupIdx].startDate,
        endDate: item.endDate || mergedWork[dupIdx].endDate,
        location: item.location || mergedWork[dupIdx].location,
        bullets: combinedBullets,
      };
    } else if (item.jobTitle || item.company) {
      mergedWork.push(item);
    }
  }

  const mergedProjects = [...existing.projects];
  for (const proj of incoming.projects) {
    const dupIdx = mergedProjects.findIndex(
      (p) => p.name.toLowerCase() === proj.name.toLowerCase()
    );
    if (dupIdx >= 0) {
      mergedProjects[dupIdx] = {
        ...mergedProjects[dupIdx],
        roleOrTechStack: proj.roleOrTechStack || mergedProjects[dupIdx].roleOrTechStack,
        link: proj.link || mergedProjects[dupIdx].link,
        bullets: Array.from(new Set([...mergedProjects[dupIdx].bullets, ...proj.bullets])),
      };
    } else if (proj.name) {
      mergedProjects.push(proj);
    }
  }

  const mergedEducation = [...existing.education];
  for (const edu of incoming.education) {
    const exists = mergedEducation.some(
      (e) =>
        e.institution.toLowerCase() === edu.institution.toLowerCase() &&
        e.degree.toLowerCase() === edu.degree.toLowerCase()
    );
    if (!exists && (edu.institution || edu.degree)) {
      mergedEducation.push(edu);
    }
  }

  const mergedCerts = [...existing.certifications];
  for (const cert of incoming.certifications) {
    const exists = mergedCerts.some(
      (c) => c.name.toLowerCase() === cert.name.toLowerCase()
    );
    if (!exists && cert.name) {
      mergedCerts.push(cert);
    }
  }

  const mergedSkills = existing.skills.map((s) => ({ ...s, skills: [...s.skills] }));
  for (const incCat of incoming.skills) {
    const matchIdx = mergedSkills.findIndex(
      (s) => s.category.toLowerCase() === incCat.category.toLowerCase()
    );
    if (matchIdx >= 0) {
      const existingLower = new Set(mergedSkills[matchIdx].skills.map((k) => k.toLowerCase()));
      for (const skill of incCat.skills) {
        if (!existingLower.has(skill.toLowerCase())) {
          mergedSkills[matchIdx].skills.push(skill);
          existingLower.add(skill.toLowerCase());
        }
      }
    } else if (incCat.skills.length > 0) {
      mergedSkills.push(incCat);
    }
  }

  return {
    personalInfo: mergedPersonalInfo,
    summary: incoming.summary || existing.summary,
    workExperience: mergedWork,
    projects: mergedProjects,
    education: mergedEducation,
    certifications: mergedCerts,
    skills: mergedSkills,
  };
}
