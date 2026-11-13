import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Download,
  FileText,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sliders,
  Building2,
  Briefcase,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import {
  DensityMode,
  MasterProfile,
  StudioSettings,
  TailoredResumeData,
  TargetLength,
  TemplateId,
} from '../types/cv';
import {
  EXECUTIVE_SWATCHES,
  validateHexColor,
} from '../utils/cvLogic';
import { buildPdfFilename, exportDocumentToA4Pdf } from '../utils/pdfExport';
import { DocumentPreview } from './DocumentPreview';

interface StudioTabProps {
  profile: MasterProfile;
  onChangeProfile: (next: MasterProfile) => void;
  tailoredData: TailoredResumeData;
  onChangeTailoredData: (next: TailoredResumeData) => void;
  settings: StudioSettings;
  onChangeSettings: (patch: Partial<StudioSettings>) => void;
}

export const StudioTab: React.FC<StudioTabProps> = ({
  profile,
  onChangeProfile,
  tailoredData,
  onChangeTailoredData,
  settings,
  onChangeSettings,
}) => {
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customHexInput, setCustomHexInput] = useState(settings.accentColor);
  const jobTitleInputRef = useRef<HTMLInputElement | null>(null);

  const hasPhotoInVault = Boolean(profile.personalInfo.photoDataUrl);

  const handleGenerateJd = async () => {
    const trimmedTitle = jobTitleInput.trim();
    if (!trimmedTitle) {
      setErrorMsg('Please enter a job title to generate a Job Description.');
      jobTitleInputRef.current?.focus();
      return;
    }

    setErrorMsg(null);
    setIsGeneratingJd(true);

    try {
      const response = await fetch('/api/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: trimmedTitle,
          targetCompany: settings.targetCompany,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate Job Description.');
      }

      if (data.jobDescription) {
        onChangeSettings({ jobDescription: data.jobDescription });
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'An error occurred while generating the Job Description.'
      );
    } finally {
      setIsGeneratingJd(false);
    }
  };

  const handleGenerateTailored = async () => {
    if (!settings.jobDescription.trim()) {
      setErrorMsg('Please paste a target Job Description before generating.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          jobDescription: settings.jobDescription,
          targetCompany: settings.targetCompany,
          targetLength: settings.targetLength,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tailored resume.');
      }

      if (data.tailoredData) {
        onChangeTailoredData(data.tailoredData);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'An error occurred while tailoring your resume and cover letter.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    const docEl = document.getElementById('printable-document');
    if (!docEl || isDownloadingPdf) return;

    setErrorMsg(null);
    setIsDownloadingPdf(true);

    try {
      const filename = buildPdfFilename(
        profile.personalInfo.fullName,
        settings.activeDocument
      );
      await exportDocumentToA4Pdf({
        sourceElement: docEl,
        filename,
        targetLength: settings.targetLength,
      });
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Unable to generate A4 PDF. Please try again.'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const ats = tailoredData.atsAnalysis;

  return (
    <div
      id="studio-workspace"
      className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]"
    >
      {/* 40% Left Control Panel */}
      <aside className="no-print w-full lg:w-[40%] shrink-0 border-b lg:border-b-0 lg:border-r border-white/35 dark:border-white/15 bg-white/10 dark:bg-slate-950/15 backdrop-blur-md p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto lg:max-h-[calc(100vh-65px)]">
        {/* Card 1: Job Description & Target Controls */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap shrink-0">
              <Briefcase className="w-4 h-4 text-[#4F46E5] dark:text-cyan-300 shrink-0" />
              <span>Target Job &amp; Generation Controls</span>
            </h2>
            <div className="flex items-center gap-2 w-full">
              <input
                ref={jobTitleInputRef}
                id="job-title-jd-input"
                type="text"
                aria-label="Job Title to auto-fill JD"
                value={jobTitleInput}
                onChange={(e) => {
                  setJobTitleInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isGeneratingJd) {
                      handleGenerateJd();
                    }
                  }
                }}
                placeholder="Enter any job title (e.g. Senior Data Engineer)..."
                className="glass-input flex-1 min-w-0 min-h-[40px] px-3 py-2 text-xs sm:text-sm rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
              <button
                type="button"
                disabled={isGeneratingJd}
                onClick={handleGenerateJd}
                className="min-h-[40px] px-3.5 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 disabled:opacity-60 text-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isGeneratingJd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Filling JD...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Fill JD</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Target Company Name */}
          <div>
            <label
              htmlFor="target-company-input"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Target Company Name (Optional)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                id="target-company-input"
                type="text"
                value={settings.targetCompany}
                onChange={(e) => onChangeSettings({ targetCompany: e.target.value })}
                placeholder="e.g. Meridian Cloud AI, Stripe, Anthropic..."
                className="glass-input w-full pl-9 pr-3.5 py-2 text-sm rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>
          </div>

          {/* Target Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="jd-textarea"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Target Job Description (JD)
              </label>
              <button
                type="button"
                onClick={() => onChangeSettings({ jobDescription: '' })}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Clear JD
              </button>
            </div>
            <textarea
              id="jd-textarea"
              rows={7}
              value={settings.jobDescription}
              onChange={(e) => {
                onChangeSettings({ jobDescription: e.target.value });
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Paste the full job description, responsibilities, and qualifications here..."
              className="glass-input w-full px-3.5 py-2.5 text-sm rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          {/* Target Length & Layout Density Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Length Toggle */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Target Length
              </span>
              <div className="glass-tab-bar grid grid-cols-2 gap-1 p-1 rounded-xl">
                {(
                  [
                    { id: '1-page', label: '1 Page' },
                    { id: '2-pages', label: '2 Pages' },
                  ] as { id: TargetLength; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeSettings({ targetLength: opt.id })}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      settings.targetLength === opt.id
                        ? 'glass-tab-active'
                        : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Density Toggle */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Layout Density (Live)
              </span>
              <div className="glass-tab-bar grid grid-cols-3 gap-1 p-1 rounded-xl">
                {(
                  [
                    { id: 'compact', label: 'Compact' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'relaxed', label: 'Relaxed' },
                  ] as { id: DensityMode; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeSettings({ density: opt.id })}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      settings.density === opt.id
                        ? 'glass-tab-active'
                        : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-200"
            >
              {errorMsg}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateTailored}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Tailoring Resume &amp; Cover Letter with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored Resume &amp; Cover Letter</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: ATS Keyword Match & Gap Analyzer Card */}
        <div className="glass-panel p-5 rounded-2xl space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ATS Keyword Match &amp; Gap Analyzer
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Grounded strictly in your Master Profile Vault
              </p>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-2xl font-bold font-mono tabular-nums text-[#4F46E5] dark:text-cyan-300">
                {ats.matchScore}%
              </span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                ATS Match Score
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full glass-tab-bar overflow-hidden">
            <div
              className="h-full rounded-full bg-[#4F46E5] transition-all duration-300"
              style={{ width: `${Math.max(5, Math.min(100, ats.matchScore))}%` }}
            />
          </div>

          {ats.tailoringNotes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {ats.tailoringNotes}
            </p>
          )}

          {/* Matched Keywords (Green Pills) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Matched Keywords ({ats.matchedKeywords.length})</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified in Master Profile
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ats.matchedKeywords.length > 0 ? (
                ats.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300"
                  >
                    {kw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No matched keywords detected yet.
                </span>
              )}
            </div>
          </div>

          {/* Missing Keywords / Skill Gaps (Amber Pills) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missing Keywords / Skill Gaps ({ats.missingKeywords.length})</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Never fabricated on resume
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ats.missingKeywords.length > 0 ? (
                ats.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300"
                  >
                    {kw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Zero missing keywords—your profile covers all detected JD requirements!
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 60% Right Live Document Canvas */}
      <section
        id="document-canvas-wrapper"
        className="w-full lg:w-[60%] flex-1 flex flex-col bg-transparent lg:max-h-[calc(100vh-65px)] overflow-hidden"
      >
        {/* Floating Glassmorphism Customization Toolbar */}
        <div className="no-print glass-header md:sticky md:top-0 z-20 px-4 sm:px-5 py-3 border-b space-y-2.5">
          {/* Top Row: Document Switcher + Template Switcher + Download A4 PDF */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Document Switcher */}
              <div
                role="group"
                aria-label="Document Switcher"
                className="glass-tab-bar grid grid-cols-2 sm:flex items-center p-1 w-full sm:w-auto rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => onChangeSettings({ activeDocument: 'resume' })}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    settings.activeDocument === 'resume'
                      ? 'glass-tab-active'
                      : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSettings({ activeDocument: 'cover-letter' })}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    settings.activeDocument === 'cover-letter'
                      ? 'glass-tab-active'
                      : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Cover Letter</span>
                </button>
              </div>

              {/* Template Switcher (Instant Live Swap) */}
              <div
                role="group"
                aria-label="Template Switcher"
                className="glass-tab-bar grid grid-cols-3 sm:flex items-center p-1 w-full sm:w-auto rounded-xl"
              >
                {(
                  [
                    { id: 'modern-minimal', label: 'Modern Minimal' },
                    { id: 'executive-classic', label: 'Executive Classic' },
                    { id: 'two-column-hybrid', label: 'Two-Column Hybrid' },
                  ] as { id: TemplateId; label: string }[]
                ).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onChangeSettings({ template: tpl.id })}
                    className={`px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 truncate cursor-pointer ${
                      settings.template === tpl.id
                        ? 'glass-tab-active'
                        : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Export Button */}
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#4F46E5] hover:bg-indigo-500 disabled:opacity-60 text-white shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download A4 PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Row: Show/Hide Profile Photo Toggle + 6 Executive Accent Swatches + Custom Hex */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/40 dark:border-white/15">
            {/* Show/Hide Profile Photo Toggle */}
            <button
              type="button"
              disabled={!hasPhotoInVault}
              onClick={() => onChangeSettings({ showPhoto: !settings.showPhoto })}
              title={
                hasPhotoInVault
                  ? 'Toggle profile photo on document'
                  : 'Upload a profile photo in the Master Profile Vault first'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                settings.showPhoto && hasPhotoInVault
                  ? 'glass-tab-active'
                  : 'glass-tab-bar text-slate-700 dark:text-slate-200'
              }`}
            >
              {settings.showPhoto && hasPhotoInVault ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Profile Photo: Shown</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Profile Photo: Hidden</span>
                </>
              )}
            </button>

            {/* 6 Executive Swatches + Custom Hex Picker */}
            <div className="flex items-center gap-2" role="group" aria-label="Accent Color Swatches">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Accent:
              </span>
              <div className="flex items-center gap-1.5">
                {EXECUTIVE_SWATCHES.map((swatch) => {
                  const isSelected =
                    settings.accentColor.toUpperCase() === swatch.hex.toUpperCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => {
                        onChangeSettings({ accentColor: swatch.hex });
                        setCustomHexInput(swatch.hex);
                      }}
                      title={`${swatch.name} (${swatch.hex})`}
                      aria-label={`Select accent color ${swatch.name}`}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        isSelected
                          ? 'scale-110 border-slate-900 dark:border-white ring-2 ring-indigo-500/40'
                          : 'border-white/80 dark:border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/40 dark:border-white/20">
                <input
                  type="color"
                  aria-label="Custom accent color picker"
                  value={validateHexColor(settings.accentColor)}
                  onChange={(e) => {
                    const hex = e.target.value.toUpperCase();
                    onChangeSettings({ accentColor: hex });
                    setCustomHexInput(hex);
                  }}
                  className="w-5 h-5 rounded-sm cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  aria-label="Custom accent hex code"
                  value={customHexInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomHexInput(val);
                    if (/^#?[0-9A-Fa-f]{6}$/.test(val.trim())) {
                      onChangeSettings({ accentColor: validateHexColor(val) });
                    }
                  }}
                  placeholder="#1E3A8A"
                  className="glass-input w-20 px-2 py-1 text-xs font-mono rounded-md text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Interactive A4 Paper Preview Scroll Container */}
        <div
          id="document-scroll-container"
          className="flex-1 overflow-y-auto overflow-x-hidden sm:overflow-x-auto p-3 sm:p-6 lg:p-10"
        >
          <div className="no-print glass-panel max-w-[210mm] mx-auto mb-3 px-3.5 py-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-800 dark:text-slate-100">
            <span className="flex items-start sm:items-center gap-1.5 font-medium">
              <Sliders className="w-3.5 h-3.5 mt-0.5 sm:mt-0 shrink-0 text-[#4F46E5] dark:text-cyan-300" />
              <span>
                Click any heading, bullet point, or paragraph directly on the A4 sheet to edit inline before exporting.
              </span>
            </span>
            <span className="font-mono text-[11px] tabular-nums whitespace-nowrap shrink-0">
              210mm × 297mm (A4 Portrait)
            </span>
          </div>

          <DocumentPreview
            personalInfo={profile.personalInfo}
            onUpdatePersonalInfo={(patch) =>
              onChangeProfile({
                ...profile,
                personalInfo: { ...profile.personalInfo, ...patch },
              })
            }
            tailoredData={tailoredData}
            onUpdateTailoredData={onChangeTailoredData}
            activeDocument={settings.activeDocument}
            template={settings.template}
            density={settings.density}
            targetLength={settings.targetLength}
            showPhoto={settings.showPhoto}
            accentColor={settings.accentColor}
          />
        </div>
      </section>
    </div>
  );
};
