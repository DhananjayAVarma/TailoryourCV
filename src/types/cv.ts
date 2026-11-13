export interface PersonalInfo {
  fullName: string;
  targetHeadline: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  photoDataUrl: string;
}

export interface WorkExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  roleOrTechStack: string;
  link: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationYear: string;
  gpaOrHonors: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string[];
}

export interface MasterProfile {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: SkillCategory[];
}

export interface AtsAnalysis {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tailoringNotes: string;
}

export interface CoverLetterData {
  recipientName: string;
  recipientTitle: string;
  companyName: string;
  companyAddress: string;
  date: string;
  subjectLine: string;
  salutation: string;
  openingParagraph: string;
  bodyParagraphs: string[];
  closingParagraph: string;
  signOff: string;
}

export interface TailoredResumeData {
  targetHeadline: string;
  summary: string;
  workExperience: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: SkillCategory[];
  coverLetter: CoverLetterData;
  atsAnalysis: AtsAnalysis;
}

export type TemplateId = 'modern-minimal' | 'executive-classic' | 'two-column-hybrid';
export type DensityMode = 'compact' | 'normal' | 'relaxed';
export type TargetLength = '1-page' | '2-pages';
export type ActiveDocument = 'resume' | 'cover-letter';

export interface StudioSettings {
  activeDocument: ActiveDocument;
  template: TemplateId;
  density: DensityMode;
  targetLength: TargetLength;
  showPhoto: boolean;
  accentColor: string;
  jobDescription: string;
  targetCompany: string;
}

export interface ExecutiveColorSwatch {
  name: string;
  hex: string;
}
