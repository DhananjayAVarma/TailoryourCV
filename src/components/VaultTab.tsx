import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  FolderUp,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  User,
  Briefcase,
  Code2,
  GraduationCap,
  Award,
  Wrench,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  MasterProfile,
  WorkExperienceItem,
  ProjectItem,
  EducationItem,
  CertificationItem,
  SkillCategory,
} from '../types/cv';
import {
  SAMPLE_MASTER_PROFILE,
  mergeMasterProfiles,
  normalizeMasterProfile,
} from '../utils/cvLogic';

interface VaultTabProps {
  profile: MasterProfile;
  onChangeProfile: (next: MasterProfile) => void;
  onProceedToStudio: () => void;
}

type SectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'skills';

export const VaultTab: React.FC<VaultTabProps> = ({
  profile,
  onChangeProfile,
  onProceedToStudio,
}) => {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    personal: true,
    summary: true,
    experience: true,
    projects: true,
    education: true,
    certifications: false,
    skills: true,
  });

  const [rawNotes, setRawNotes] = useState('');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isParsingText, setIsParsingText] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Pending parsed profile waiting for user decision: "Replace Current Profile" vs "Merge with Existing Profile"
  const [pendingExtractedProfile, setPendingExtractedProfile] = useState<{
    sourceLabel: string;
    data: MasterProfile;
  } | null>(null);

  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (profile.personalInfo.fullName || 'master-profile')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `tailorcv-${safeName}-backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusBanner({
      type: 'success',
      message: 'Exported Master Profile JSON backup.',
    });
  };

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const normalized = normalizeMasterProfile(parsed);
        onChangeProfile(normalized);
        setStatusBanner({
          type: 'success',
          message: `Imported Master Profile backup from "${file.name}".`,
        });
      } catch {
        setStatusBanner({
          type: 'error',
          message: 'Invalid JSON backup file. Please select a valid TailorCV JSON export.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load Sample Profile
  const handleLoadSample = () => {
    onChangeProfile(SAMPLE_MASTER_PROFILE);
    setStatusBanner({
      type: 'success',
      message: 'Loaded sample profile (Elena Vance — Senior Staff Product & Distributed Systems Engineer).',
    });
  };

  // Upload & Parse PDF Resume
  const processPdfFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setStatusBanner({
        type: 'error',
        message: 'Please select a valid .pdf resume file.',
      });
      return;
    }

    setIsParsingPdf(true);
    setStatusBanner({
      type: 'info',
      message: `Uploading "${file.name}" and extracting structured career sections with Gemini...`,
    });

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read PDF file.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64, fileName: file.name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF resume.');
      }

      const extracted = normalizeMasterProfile(data.profile);
      setPendingExtractedProfile({
        sourceLabel: `PDF Resume (${file.name})`,
        data: extracted,
      });
      setStatusBanner({
        type: 'success',
        message: `Extracted career details from "${file.name}". Choose below whether to Replace or Merge with your current profile.`,
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Error extracting data from PDF.',
      });
    } finally {
      setIsParsingPdf(false);
    }
  };

  // Paste Raw Text / Notes -> Auto-Organize with AI
  const handleAutoOrganizeText = async () => {
    if (!rawNotes.trim()) {
      setStatusBanner({
        type: 'error',
        message: 'Please paste LinkedIn text, old resume bullets, or project notes first.',
      });
      return;
    }

    setIsParsingText(true);
    setStatusBanner({
      type: 'info',
      message: 'Analyzing and structuring your raw career notes with Gemini AI...',
    });

    try {
      const response = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawNotes }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to organize text with AI.');
      }

      const extracted = normalizeMasterProfile(data.profile);
      setPendingExtractedProfile({
        sourceLabel: 'AI-Organized Raw Notes',
        data: extracted,
      });
      setStatusBanner({
        type: 'success',
        message:
          'Successfully structured your raw notes! Choose whether to Replace or Merge with your existing Master Profile below.',
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Could not organize raw notes.',
      });
    } finally {
      setIsParsingText(false);
    }
  };

  const handleConfirmPendingProfile = (mode: 'replace' | 'merge') => {
    if (!pendingExtractedProfile) return;
    if (mode === 'replace') {
      // Preserve existing photo if the new extracted profile doesn't have one
      const next = {
        ...pendingExtractedProfile.data,
        personalInfo: {
          ...pendingExtractedProfile.data.personalInfo,
          photoDataUrl:
            pendingExtractedProfile.data.personalInfo.photoDataUrl ||
            profile.personalInfo.photoDataUrl,
        },
      };
      onChangeProfile(next);
      setStatusBanner({
        type: 'success',
        message: `Replaced Master Profile with ${pendingExtractedProfile.sourceLabel}.`,
      });
    } else {
      const merged = mergeMasterProfiles(profile, pendingExtractedProfile.data);
      onChangeProfile(merged);
      setStatusBanner({
        type: 'success',
        message: `Merged ${pendingExtractedProfile.sourceLabel} into your Master Profile.`,
      });
    }
    setPendingExtractedProfile(null);
    setRawNotes('');
  };

  // Profile Photo Upload & Compression to Base64 Data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
          onChangeProfile({
            ...profile,
            personalInfo: {
              ...profile.personalInfo,
              photoDataUrl: compressedDataUrl,
            },
          });
          setStatusBanner({
            type: 'success',
            message: 'Profile photo uploaded and compressed for crisp A4 rendering.',
          });
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    onChangeProfile({
      ...profile,
      personalInfo: {
        ...profile.personalInfo,
        photoDataUrl: '',
      },
    });
  };

  // Helper to reorder array items
  const moveItem = <T,>(arr: T[], index: number, direction: 'up' | 'down'): T[] => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= arr.length) return arr;
    const copy = [...arr];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, removed);
    return copy;
  };

  // Work Experience CRUD
  const addWorkExperience = () => {
    const newItem: WorkExperienceItem = {
      id: `exp-${Date.now()}`,
      jobTitle: 'Senior Software Engineer',
      company: 'Organization Name',
      location: 'City, State',
      startDate: 'Jan 2023',
      endDate: 'Present',
      bullets: ['Delivered measurable impact by architecting scalable core services.'],
    };
    onChangeProfile({
      ...profile,
      workExperience: [newItem, ...profile.workExperience],
    });
    setOpenSections((prev) => ({ ...prev, experience: true }));
  };

  const updateWorkExperience = (idx: number, updated: Partial<WorkExperienceItem>) => {
    const next = profile.workExperience.map((item, i) =>
      i === idx ? { ...item, ...updated } : item
    );
    onChangeProfile({ ...profile, workExperience: next });
  };

  const deleteWorkExperience = (idx: number) => {
    onChangeProfile({
      ...profile,
      workExperience: profile.workExperience.filter((_, i) => i !== idx),
    });
  };

  // Projects CRUD
  const addProject = () => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: 'New Technical Project',
      roleOrTechStack: 'Lead Developer · TypeScript, React, Node.js',
      link: 'github.com/username/project',
      bullets: ['Designed and built end-to-end architecture with automated test coverage.'],
    };
    onChangeProfile({
      ...profile,
      projects: [newProj, ...profile.projects],
    });
    setOpenSections((prev) => ({ ...prev, projects: true }));
  };

  const updateProject = (idx: number, updated: Partial<ProjectItem>) => {
    const next = profile.projects.map((item, i) =>
      i === idx ? { ...item, ...updated } : item
    );
    onChangeProfile({ ...profile, projects: next });
  };

  const deleteProject = (idx: number) => {
    onChangeProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== idx),
    });
  };

  // Education CRUD
  const addEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: 'B.S. in Computer Science',
      institution: 'University Name',
      location: 'City, State',
      graduationYear: '2020',
      gpaOrHonors: 'Cum Laude',
    };
    onChangeProfile({
      ...profile,
      education: [...profile.education, newEdu],
    });
    setOpenSections((prev) => ({ ...prev, education: true }));
  };

  const updateEducation = (idx: number, updated: Partial<EducationItem>) => {
    const next = profile.education.map((item, i) =>
      i === idx ? { ...item, ...updated } : item
    );
    onChangeProfile({ ...profile, education: next });
  };

  const deleteEducation = (idx: number) => {
    onChangeProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== idx),
    });
  };

  // Certifications CRUD
  const addCertification = () => {
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: 'Professional Cloud Architect',
      issuer: 'Cloud Provider',
      year: '2024',
    };
    onChangeProfile({
      ...profile,
      certifications: [...profile.certifications, newCert],
    });
    setOpenSections((prev) => ({ ...prev, certifications: true }));
  };

  const updateCertification = (idx: number, updated: Partial<CertificationItem>) => {
    const next = profile.certifications.map((item, i) =>
      i === idx ? { ...item, ...updated } : item
    );
    onChangeProfile({ ...profile, certifications: next });
  };

  const deleteCertification = (idx: number) => {
    onChangeProfile({
      ...profile,
      certifications: profile.certifications.filter((_, i) => i !== idx),
    });
  };

  // Skills CRUD
  const addSkillCategory = () => {
    const newCat: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: 'Additional Competencies',
      skills: ['System Architecture', 'Cross-Functional Leadership'],
    };
    onChangeProfile({
      ...profile,
      skills: [...profile.skills, newCat],
    });
    setOpenSections((prev) => ({ ...prev, skills: true }));
  };

  const updateSkillCategory = (idx: number, updated: Partial<SkillCategory>) => {
    const next = profile.skills.map((item, i) =>
      i === idx ? { ...item, ...updated } : item
    );
    onChangeProfile({ ...profile, skills: next });
  };

  const deleteSkillCategory = (idx: number) => {
    onChangeProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== idx),
    });
  };

  const handleAddSkillTag = (catIdx: number, catId: string) => {
    const raw = (newSkillInputs[catId] || '').trim();
    if (!raw) return;
    const newTags = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const current = profile.skills[catIdx];
    const combined = Array.from(new Set([...current.skills, ...newTags]));
    updateSkillCategory(catIdx, { skills: combined });
    setNewSkillInputs((prev) => ({ ...prev, [catId]: '' }));
  };

  const inputClass =
    'glass-input w-full px-3.5 py-2 text-sm rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all';
  const labelClass =
    'block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Action Bar */}
      <div className="glass-panel flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 sm:p-5 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Master Profile Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200/85">
            Your career source of truth. Automatically saved in browser storage and strictly used to ground every tailored resume without fabrication.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleLoadSample}
            className="glass-tab-bar flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-100 hover:border-white/80 dark:hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Load Sample Profile</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="glass-tab-bar flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-100 hover:border-white/80 dark:hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export JSON Backup</span>
          </button>

          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJson}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="glass-tab-bar flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-100 hover:border-white/80 dark:hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderUp className="w-3.5 h-3.5 shrink-0" />
            <span>Import JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={onProceedToStudio}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Open Tailor Studio</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusBanner && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
            statusBanner.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
              : statusBanner.type === 'info'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : statusBanner.type === 'info' ? (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Replace vs Merge Confirmation Modal/Card when AI finishes extracting PDF or Raw Text */}
      {pendingExtractedProfile && (
        <div className="glass-panel p-6 rounded-2xl border-2 border-[#4F46E5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
                <span>AI Extraction Ready: {pendingExtractedProfile.sourceLabel}</span>
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                Found{' '}
                <span className="font-semibold tabular-nums">
                  {pendingExtractedProfile.data.workExperience.length} roles
                </span>
                {' · '}
                <span className="font-semibold tabular-nums">
                  {pendingExtractedProfile.data.projects.length} projects
                </span>
                {' · '}
                <span className="font-semibold tabular-nums">
                  {pendingExtractedProfile.data.education.length} education entries
                </span>
                {' · '}
                <span className="font-semibold tabular-nums">
                  {pendingExtractedProfile.data.skills.reduce((acc, s) => acc + s.skills.length, 0)} skills
                </span>
                . How would you like to apply this data?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleConfirmPendingProfile('replace')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Replace Current Profile
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPendingProfile('merge')}
                className="glass-tab-bar flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-100 hover:border-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#4F46E5] dark:text-cyan-300" />
                <span>Merge with Existing Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingExtractedProfile(null)}
                className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Methods 1 & 2 Grid: PDF Upload & Paste Raw Text / Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Upload Existing Resume PDF */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300 shrink-0" />
                <span>Method 1: Upload Existing Resume PDF</span>
              </h2>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Gemini PDF Parser
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200/85">
              Drag and drop your `.pdf` resume or browse files. Gemini reads the PDF document directly and extracts every section into structured fields.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) processPdfFile(file);
            }}
            onClick={() => pdfInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pdfInputRef.current?.click();
              }
            }}
            aria-label="Upload existing resume PDF file"
            className="glass-subpanel flex flex-col items-center justify-center p-7 border-2 border-dashed border-slate-400/50 dark:border-white/25 hover:border-[#4F46E5] dark:hover:border-cyan-300 rounded-xl transition-colors cursor-pointer text-center group"
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processPdfFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-full bg-indigo-500/15 dark:bg-cyan-400/15 text-[#4F46E5] dark:text-cyan-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {isParsingPdf ? 'Extracting PDF with Gemini AI...' : 'Click to select or drag & drop a .PDF resume'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Supports Replace or Merge after extraction
            </p>
          </div>
        </div>

        {/* Method 2: Paste Raw Text / Notes */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
                <span>Method 2: Paste Raw Text / LinkedIn Notes</span>
              </h2>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                AI Auto-Organizer
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200/85">
              Paste unformatted LinkedIn experience, old plain-text resumes, or rough project notes and click Auto-Organize.
            </p>
          </div>

          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            rows={4}
            placeholder="Paste unformatted LinkedIn text, accomplishment notes, or raw resume content here..."
            aria-label="Paste raw career text or notes"
            className={inputClass}
          />

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setRawNotes(
                  `Principal Cloud Architect at Horizon Data (2024 - Present, Austin TX)\n- Led migration of 40+ microservices to Kubernetes and Go, reducing cloud spend by 32% ($210K/yr).\n- Built real-time anomaly detection pipeline using Apache Kafka, Python, and ClickHouse.\nSkills: Go, TypeScript, Kubernetes, Terraform, ClickHouse, Kafka`
                )
              }
              className="text-xs font-medium text-indigo-700 dark:text-cyan-300 hover:underline cursor-pointer"
            >
              Insert sample notes to test
            </button>

            <button
              type="button"
              disabled={isParsingText}
              onClick={handleAutoOrganizeText}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 disabled:opacity-50 text-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isParsingText ? 'Auto-Organizing...' : 'Auto-Organize with AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Method 3: Structured Form Fields (Full CRUD Accordions) */}
      <div className="space-y-4">
        <div className="glass-panel px-5 py-3 rounded-2xl flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Method 3: Structured Master Profile Sections (Full CRUD)
          </h2>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            All changes auto-save to localStorage
          </span>
        </div>

        {/* 1. Personal Info & Photo */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('personal')}
            aria-expanded={openSections.personal}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/25 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Personal Info &amp; Profile Photo
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                · {profile.personalInfo.fullName || 'Unnamed Candidate'}
              </span>
            </div>
            {openSections.personal ? (
              <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            )}
          </button>

          {openSections.personal && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15 space-y-6">
              {/* Profile Photo Upload Bar */}
              <div className="glass-subpanel flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-indigo-500/30 shrink-0 flex items-center justify-center">
                  {profile.personalInfo.photoDataUrl ? (
                    <img
                      src={profile.personalInfo.photoDataUrl}
                      alt={profile.personalInfo.fullName || 'Candidate headshot'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Optional Profile Headshot
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically compressed to a local base64 data URL. You can toggle photo visibility anytime in the Tailor &amp; Export Studio.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    {profile.personalInfo.photoDataUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    value={profile.personalInfo.fullName}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, fullName: e.target.value },
                      })
                    }
                    placeholder="e.g. Elena Vance"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Target Headline / Base Role</label>
                  <input
                    type="text"
                    value={profile.personalInfo.targetHeadline}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, targetHeadline: e.target.value },
                      })
                    }
                    placeholder="e.g. Senior Staff Product & Distributed Systems Engineer"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    value={profile.personalInfo.email}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, email: e.target.value },
                      })
                    }
                    placeholder="name@domain.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="text"
                    value={profile.personalInfo.phone}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, phone: e.target.value },
                      })
                    }
                    placeholder="+1 (555) 000-0000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={profile.personalInfo.location}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, location: e.target.value },
                      })
                    }
                    placeholder="San Francisco, CA"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>LinkedIn URL</label>
                  <input
                    type="text"
                    value={profile.personalInfo.linkedinUrl}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, linkedinUrl: e.target.value },
                      })
                    }
                    placeholder="linkedin.com/in/username"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Portfolio / GitHub URL</label>
                  <input
                    type="text"
                    value={profile.personalInfo.portfolioUrl}
                    onChange={(e) =>
                      onChangeProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, portfolioUrl: e.target.value },
                      })
                    }
                    placeholder="github.com/username"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Master Professional Summary */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('summary')}
            aria-expanded={openSections.summary}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/25 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Master Professional Summary
              </span>
            </div>
            {openSections.summary ? (
              <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300" />
            )}
          </button>

          {openSections.summary && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15">
              <label className={labelClass}>
                Base Bio &amp; Career Overview (Tailored per job description during generation)
              </label>
              <textarea
                rows={4}
                value={profile.summary}
                onChange={(e) => onChangeProfile({ ...profile, summary: e.target.value })}
                placeholder="Write a comprehensive summary of your years of experience, core strengths, and headline achievements..."
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* 3. Work Experience */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-transparent">
            <button
              type="button"
              onClick={() => toggleSection('experience')}
              aria-expanded={openSections.experience}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Work Experience
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                · {profile.workExperience.length} roles
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addWorkExperience}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('experience')}
                aria-label="Toggle Work Experience section"
                className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                {openSections.experience ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {openSections.experience && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15 space-y-6">
              {profile.workExperience.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300 py-4 text-center">
                  No work experience entries yet. Click &ldquo;Add Role&rdquo; to add your career history.
                </p>
              ) : (
                profile.workExperience.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="glass-subpanel p-5 rounded-xl space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                        0{idx + 1}. {exp.jobTitle || 'Role'} @ {exp.company || 'Company'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            onChangeProfile({
                              ...profile,
                              workExperience: moveItem(profile.workExperience, idx, 'up'),
                            })
                          }
                          aria-label={`Move ${exp.jobTitle} up`}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === profile.workExperience.length - 1}
                          onClick={() =>
                            onChangeProfile({
                              ...profile,
                              workExperience: moveItem(profile.workExperience, idx, 'down'),
                            })
                          }
                          aria-label={`Move ${exp.jobTitle} down`}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWorkExperience(idx)}
                          aria-label={`Delete ${exp.jobTitle}`}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="lg:col-span-2">
                        <label className={labelClass}>Job Title</label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) => updateWorkExperience(idx, { jobTitle: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateWorkExperience(idx, { company: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateWorkExperience(idx, { location: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Start Date</label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) =>
                              updateWorkExperience(idx, { startDate: e.target.value })
                            }
                            placeholder="Jan 2023"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>End Date</label>
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) =>
                              updateWorkExperience(idx, { endDate: e.target.value })
                            }
                            placeholder="Present"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accomplishment Bullets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={labelClass}>
                          Accomplishment Bullet Points (Include metrics &amp; tools)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateWorkExperience(idx, {
                              bullets: [...exp.bullets, 'New measurable accomplishment...'],
                            })
                          }
                          className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>
                      {exp.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <span className="text-xs font-mono text-slate-400 pt-2.5 select-none">
                            •
                          </span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const nextBullets = exp.bullets.map((b, i) =>
                                i === bIdx ? e.target.value : b
                              );
                              updateWorkExperience(idx, { bullets: nextBullets });
                            }}
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextBullets = exp.bullets.filter((_, i) => i !== bIdx);
                              updateWorkExperience(idx, { bullets: nextBullets });
                            }}
                            aria-label={`Remove bullet ${bIdx + 1}`}
                            className="p-2 text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 4. Projects */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => toggleSection('projects')}
              aria-expanded={openSections.projects}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">Projects</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                · {profile.projects.length} projects
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addProject}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('projects')}
                aria-label="Toggle Projects section"
                className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                {openSections.projects ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {openSections.projects && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15 space-y-5">
              {profile.projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  className="glass-subpanel p-5 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                      0{idx + 1}. {proj.name || 'Project'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          onChangeProfile({
                            ...profile,
                            projects: moveItem(profile.projects, idx, 'up'),
                          })
                        }
                        aria-label={`Move ${proj.name} up`}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === profile.projects.length - 1}
                        onClick={() =>
                          onChangeProfile({
                            ...profile,
                            projects: moveItem(profile.projects, idx, 'down'),
                          })
                        }
                        aria-label={`Move ${proj.name} down`}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(idx)}
                        aria-label={`Delete ${proj.name}`}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Project Name</label>
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => updateProject(idx, { name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Role / Tech Stack</label>
                      <input
                        type="text"
                        value={proj.roleOrTechStack}
                        onChange={(e) => updateProject(idx, { roleOrTechStack: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Project Link / Repo</label>
                      <input
                        type="text"
                        value={proj.link}
                        onChange={(e) => updateProject(idx, { link: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Project Highlights</label>
                      <button
                        type="button"
                        onClick={() =>
                          updateProject(idx, {
                            bullets: [...proj.bullets, 'Key technical achievement...'],
                          })
                        }
                        className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bullet</span>
                      </button>
                    </div>
                    {proj.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2">
                        <span className="text-xs font-mono text-slate-400 pt-2.5 select-none">
                          •
                        </span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const nextBullets = proj.bullets.map((b, i) =>
                              i === bIdx ? e.target.value : b
                            );
                            updateProject(idx, { bullets: nextBullets });
                          }}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextBullets = proj.bullets.filter((_, i) => i !== bIdx);
                            updateProject(idx, { bullets: nextBullets });
                          }}
                          aria-label={`Remove project bullet ${bIdx + 1}`}
                          className="p-2 text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Education */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => toggleSection('education')}
              aria-expanded={openSections.education}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">Education</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                · {profile.education.length} degrees
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addEducation}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('education')}
                aria-label="Toggle Education section"
                className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                {openSections.education ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {openSections.education && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15 space-y-4">
              {profile.education.map((edu, idx) => (
                <div
                  key={edu.id}
                  className="glass-subpanel p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {edu.degree || 'Degree'} · {edu.institution || 'Institution'}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteEducation(idx)}
                      aria-label={`Delete ${edu.degree}`}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Degree / Program</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, { degree: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, { institution: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Graduation Year</label>
                      <input
                        type="text"
                        value={edu.graduationYear}
                        onChange={(e) => updateEducation(idx, { graduationYear: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GPA / Honors (Optional)</label>
                      <input
                        type="text"
                        value={edu.gpaOrHonors}
                        onChange={(e) => updateEducation(idx, { gpaOrHonors: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Certifications & Awards */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => toggleSection('certifications')}
              aria-expanded={openSections.certifications}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Certifications &amp; Awards
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                · {profile.certifications.length} items
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addCertification}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('certifications')}
                aria-label="Toggle Certifications section"
                className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                {openSections.certifications ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {openSections.certifications && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15 space-y-3">
              {profile.certifications.map((cert, idx) => (
                <div
                  key={cert.id}
                  className="glass-subpanel p-4 rounded-xl grid grid-cols-1 md:grid-cols-7 gap-3 items-end"
                >
                  <div className="md:col-span-3">
                    <label className={labelClass}>Certification / Award Name</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(idx, { name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Issuing Organization</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(idx, { issuer: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="text"
                      value={cert.year}
                      onChange={(e) => updateCertification(idx, { year: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteCertification(idx)}
                      aria-label={`Delete ${cert.name}`}
                      className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Categorized Skills */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              type="button"
              onClick={() => toggleSection('skills')}
              aria-expanded={openSections.skills}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Categorized Skills
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                · {profile.skills.length} categories
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addSkillCategory}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill Category</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('skills')}
                aria-label="Toggle Skills section"
                className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                {openSections.skills ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {openSections.skills && (
            <div className="px-6 pb-6 pt-2 border-t border-white/40 dark:border-white/15 space-y-4">
              {profile.skills.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="glass-subpanel p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => updateSkillCategory(idx, { category: e.target.value })}
                      aria-label="Skill category name"
                      className="glass-input px-3 py-1.5 text-sm font-bold rounded-lg text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => deleteSkillCategory(idx)}
                      aria-label={`Delete skill category ${cat.category}`}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={`${skill}-${sIdx}`}
                        className="glass-tab-bar inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-slate-800 dark:text-slate-100"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSkills = cat.skills.filter((_, i) => i !== sIdx);
                            updateSkillCategory(idx, { skills: nextSkills });
                          }}
                          aria-label={`Remove skill ${skill}`}
                          className="text-slate-500 dark:text-slate-300 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newSkillInputs[cat.id] || ''}
                      onChange={(e) =>
                        setNewSkillInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillTag(idx, cat.id);
                        }
                      }}
                      placeholder="Add skill(s), comma-separated..."
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkillTag(idx, cat.id)}
                      className="glass-tab-bar px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-100 hover:border-white/80 dark:hover:border-white/35 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Add Skill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
