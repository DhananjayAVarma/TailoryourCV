import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import {
  ActiveDocument,
  DensityMode,
  PersonalInfo,
  TailoredResumeData,
  TargetLength,
  TemplateId,
} from '../types/cv';
import {
  DensityConfig,
  getDensityStyles,
  hexToRgba,
  sanitizeCoverLetterSignOff,
  validateHexColor,
} from '../utils/cvLogic';
import { EditableText } from './EditableText';

// 210mm x 297mm in CSS pixels at 96 DPI
const A4_WIDTH_PX = 793.7;
const A4_HEIGHT_PX = (297 * 96) / 25.4;

interface DocumentPreviewProps {
  personalInfo: PersonalInfo;
  onUpdatePersonalInfo: (updated: Partial<PersonalInfo>) => void;
  tailoredData: TailoredResumeData;
  onUpdateTailoredData: (next: TailoredResumeData) => void;
  activeDocument: ActiveDocument;
  template: TemplateId;
  density: DensityMode;
  targetLength: TargetLength;
  showPhoto: boolean;
  accentColor: string;
}

function getEffectiveDensity(
  density: DensityMode,
  targetLength: TargetLength,
  fitScale: number
): { config: DensityConfig; paddingMmNum: number } {
  const base = getDensityStyles(density);
  if (targetLength !== '1-page') {
    return {
      config: base,
      paddingMmNum: parseFloat(base.pagePaddingMm) || 16,
    };
  }

  const basePadMm =
    density === 'compact' ? 10 : density === 'relaxed' ? 13 : 11.5;
  const paddingMmNum = Math.max(
    8,
    Number((basePadMm * (0.55 + 0.45 * fitScale)).toFixed(2))
  );

  return {
    paddingMmNum,
    config: {
      pagePaddingMm: `${paddingMmNum}mm`,
      baseFontSizePx: Math.max(8, Number((base.baseFontSizePx * fitScale).toFixed(2))),
      lineHeight: Math.max(
        1.18,
        Number((base.lineHeight * (0.35 + 0.65 * fitScale)).toFixed(3))
      ),
      sectionGapPx: Math.max(6, Math.round(base.sectionGapPx * Math.pow(fitScale, 1.35))),
      itemGapPx: Math.max(4, Math.round(base.itemGapPx * Math.pow(fitScale, 1.35))),
      headerBottomMarginPx: Math.max(
        6,
        Math.round(base.headerBottomMarginPx * Math.pow(fitScale, 1.25))
      ),
      bulletSpacingPx: Math.max(1, Number((base.bulletSpacingPx * fitScale).toFixed(1))),
    },
  };
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  personalInfo,
  onUpdatePersonalInfo,
  tailoredData,
  onUpdateTailoredData,
  activeDocument,
  template,
  density,
  targetLength,
  showPhoto,
  accentColor,
}) => {
  const docRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [fitScale, setFitScale] = useState<number>(1);
  const [overflowZoom, setOverflowZoom] = useState<number>(1);
  const lastSignatureRef = useRef<string>('');
  const measurePassRef = useRef<number>(0);

  useEffect(() => {
    const el = docRef.current;
    const container = el?.parentElement;
    if (!container) return;

    const updateScale = () => {
      const style = window.getComputedStyle(container);
      const padLeft = parseFloat(style.paddingLeft) || 0;
      const padRight = parseFloat(style.paddingRight) || 0;
      const availableWidth = container.clientWidth - padLeft - padRight;

      if (availableWidth > 0 && availableWidth < A4_WIDTH_PX) {
        setPreviewZoom(Math.max(0.32, availableWidth / A4_WIDTH_PX));
      } else {
        setPreviewZoom(1);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const { config: densityConfig, paddingMmNum } = getEffectiveDensity(
    density,
    targetLength,
    fitScale
  );

  const contentSignature = JSON.stringify({
    targetLength,
    density,
    template,
    activeDocument,
    showPhoto: Boolean(showPhoto && personalInfo.photoDataUrl),
    personalInfo: { ...personalInfo, photoDataUrl: undefined },
    tailoredData,
  });

  useLayoutEffect(() => {
    if (targetLength !== '1-page') {
      if (fitScale !== 1) setFitScale(1);
      if (overflowZoom !== 1) setOverflowZoom(1);
      lastSignatureRef.current = contentSignature;
      measurePassRef.current = 0;
      return;
    }

    if (lastSignatureRef.current !== contentSignature) {
      lastSignatureRef.current = contentSignature;
      measurePassRef.current = 0;
      if (fitScale !== 1 || overflowZoom !== 1) {
        setFitScale(1);
        setOverflowZoom(1);
        return;
      }
    }

    const innerEl = innerRef.current;
    if (!innerEl) return;

    const padPx = (paddingMmNum * 96) / 25.4;
    const maxInnerHeight = A4_HEIGHT_PX - padPx * 2 - 6;
    const currentInnerHeight = innerEl.scrollHeight * overflowZoom;

    if (currentInnerHeight > maxInnerHeight && measurePassRef.current < 6) {
      measurePassRef.current += 1;
      if (fitScale > 0.64) {
        const ratio = maxInnerHeight / currentInnerHeight;
        const nextFit = Math.max(
          0.64,
          Number((fitScale * Math.min(0.97, Math.sqrt(ratio) * 0.99)).toFixed(3))
        );
        if (nextFit < fitScale) {
          setFitScale(nextFit);
          return;
        }
      }
      // Rare fallback if even minimum readable font still exceeds 1 A4 page
      const unzoomedHeight = innerEl.scrollHeight;
      if (unzoomedHeight > maxInnerHeight) {
        const nextZoom = Math.max(
          0.7,
          Number(((maxInnerHeight / unzoomedHeight) * 0.99).toFixed(3))
        );
        if (Math.abs(nextZoom - overflowZoom) > 0.005) {
          setOverflowZoom(nextZoom);
        }
      }
    }
  }, [contentSignature, targetLength, fitScale, overflowZoom, paddingMmNum]);

  const accent = validateHexColor(accentColor);
  const hasPhoto = Boolean(showPhoto && personalInfo.photoDataUrl);

  const updateWorkBullet = (roleIdx: number, bulletIdx: number, text: string) => {
    const nextWork = tailoredData.workExperience.map((role, rIdx) => {
      if (rIdx !== roleIdx) return role;
      const nextBullets = role.bullets.map((b, bIdx) => (bIdx === bulletIdx ? text : b));
      return { ...role, bullets: nextBullets };
    });
    onUpdateTailoredData({ ...tailoredData, workExperience: nextWork });
  };

  const updateWorkField = (
    roleIdx: number,
    field: 'jobTitle' | 'company' | 'location' | 'startDate' | 'endDate',
    val: string
  ) => {
    const nextWork = tailoredData.workExperience.map((role, rIdx) =>
      rIdx === roleIdx ? { ...role, [field]: val } : role
    );
    onUpdateTailoredData({ ...tailoredData, workExperience: nextWork });
  };

  const updateProjectField = (
    projIdx: number,
    field: 'name' | 'roleOrTechStack' | 'link',
    val: string
  ) => {
    const nextProjects = tailoredData.projects.map((p, idx) =>
      idx === projIdx ? { ...p, [field]: val } : p
    );
    onUpdateTailoredData({ ...tailoredData, projects: nextProjects });
  };

  const updateProjectBullet = (projIdx: number, bulletIdx: number, val: string) => {
    const nextProjects = tailoredData.projects.map((p, idx) => {
      if (idx !== projIdx) return p;
      const nextBullets = p.bullets.map((b, bIdx) => (bIdx === bulletIdx ? val : b));
      return { ...p, bullets: nextBullets };
    });
    onUpdateTailoredData({ ...tailoredData, projects: nextProjects });
  };

  const updateEducationField = (
    eduIdx: number,
    field: 'degree' | 'institution' | 'graduationYear' | 'gpaOrHonors',
    val: string
  ) => {
    const nextEdu = tailoredData.education.map((e, idx) =>
      idx === eduIdx ? { ...e, [field]: val } : e
    );
    onUpdateTailoredData({ ...tailoredData, education: nextEdu });
  };

  const updateCertField = (
    certIdx: number,
    field: 'name' | 'issuer' | 'year',
    val: string
  ) => {
    const nextCerts = tailoredData.certifications.map((c, idx) =>
      idx === certIdx ? { ...c, [field]: val } : c
    );
    onUpdateTailoredData({ ...tailoredData, certifications: nextCerts });
  };

  const updateSkillCategoryText = (catIdx: number, newSkillsListStr: string) => {
    const nextSkills = tailoredData.skills.map((cat, idx) =>
      idx === catIdx
        ? {
            ...cat,
            skills: newSkillsListStr
              .split(/[,·•]/)
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : cat
    );
    onUpdateTailoredData({ ...tailoredData, skills: nextSkills });
  };

  const ContactItems = ({ centered = false }: { centered?: boolean }) => (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[#374151] ${
        centered ? 'justify-center' : ''
      }`}
      style={{ fontSize: `${densityConfig.baseFontSizePx - 1.2}px` }}
    >
      {personalInfo.email && (
        <span className="inline-flex items-center gap-1">
          <Mail className="w-3 h-3 shrink-0" style={{ color: accent }} />
          <EditableText
            value={personalInfo.email}
            onChange={(val) => onUpdatePersonalInfo({ email: val })}
            ariaLabel="Email"
          />
        </span>
      )}
      {personalInfo.phone && (
        <span className="inline-flex items-center gap-1">
          <Phone className="w-3 h-3 shrink-0" style={{ color: accent }} />
          <EditableText
            value={personalInfo.phone}
            onChange={(val) => onUpdatePersonalInfo({ phone: val })}
            ariaLabel="Phone"
          />
        </span>
      )}
      {personalInfo.location && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" style={{ color: accent }} />
          <EditableText
            value={personalInfo.location}
            onChange={(val) => onUpdatePersonalInfo({ location: val })}
            ariaLabel="Location"
          />
        </span>
      )}
      {personalInfo.linkedinUrl && (
        <span className="inline-flex items-center gap-1">
          <Linkedin className="w-3 h-3 shrink-0" style={{ color: accent }} />
          <EditableText
            value={personalInfo.linkedinUrl}
            onChange={(val) => onUpdatePersonalInfo({ linkedinUrl: val })}
            ariaLabel="LinkedIn URL"
          />
        </span>
      )}
      {personalInfo.portfolioUrl && (
        <span className="inline-flex items-center gap-1">
          <Globe className="w-3 h-3 shrink-0" style={{ color: accent }} />
          <EditableText
            value={personalInfo.portfolioUrl}
            onChange={(val) => onUpdatePersonalInfo({ portfolioUrl: val })}
            ariaLabel="Portfolio URL"
          />
        </span>
      )}
    </div>
  );

  // Header Renderer shared between Resume & Cover Letter for each template
  const renderTemplateHeader = () => {
    if (template === 'modern-minimal') {
      // Modern Minimal: Bold left-aligned name & target title, thin accent bottom border, horizontal contact bar.
      // If photo enabled, 72px circular headshot on top-right; if disabled, expand full-width with no empty gap.
      return (
        <div
          className="font-inter pb-3.5"
          style={{
            borderBottom: `2px solid ${accent}`,
            marginBottom: `${densityConfig.headerBottomMarginPx}px`,
          }}
        >
          <div className="flex items-center justify-between gap-5">
            <div className="flex-1 min-w-0">
              <EditableText
                tagName="h1"
                value={personalInfo.fullName}
                onChange={(val) => onUpdatePersonalInfo({ fullName: val })}
                className="font-bold tracking-tight text-[#111827]"
                style={{ fontSize: `${densityConfig.baseFontSizePx + 13}px`, lineHeight: 1.15 }}
                ariaLabel="Candidate Full Name"
              />
              <EditableText
                tagName="div"
                value={tailoredData.targetHeadline}
                onChange={(val) =>
                  onUpdateTailoredData({ ...tailoredData, targetHeadline: val })
                }
                className="font-semibold mt-1"
                style={{
                  color: accent,
                  fontSize: `${densityConfig.baseFontSizePx + 2}px`,
                }}
                ariaLabel="Target Headline"
              />
              <div className="mt-2">
                <ContactItems />
              </div>
            </div>

            {hasPhoto && (
              <div
                className="shrink-0 rounded-full overflow-hidden border-2"
                style={{
                  width: '72px',
                  height: '72px',
                  borderColor: accent,
                }}
              >
                <img
                  src={personalInfo.photoDataUrl}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (template === 'executive-classic') {
      // Executive Classic: Merriweather serif headings with Inter body text.
      // If photo enabled: 76px rounded-square portrait on top-left beside name/contact block;
      // If disabled: center-align the entire header symmetrically.
      return (
        <div
          className="pb-3.5"
          style={{
            borderBottom: `1.5px solid ${accent}`,
            marginBottom: `${densityConfig.headerBottomMarginPx}px`,
          }}
        >
          {hasPhoto ? (
            <div className="flex items-center gap-5">
              <div
                className="shrink-0 rounded-xl overflow-hidden border"
                style={{
                  width: '76px',
                  height: '76px',
                  borderColor: accent,
                }}
              >
                <img
                  src={personalInfo.photoDataUrl}
                  alt={personalInfo.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <EditableText
                  tagName="h1"
                  value={personalInfo.fullName}
                  onChange={(val) => onUpdatePersonalInfo({ fullName: val })}
                  className="font-merriweather font-bold text-[#111827]"
                  style={{ fontSize: `${densityConfig.baseFontSizePx + 12}px`, lineHeight: 1.2 }}
                  ariaLabel="Candidate Full Name"
                />
                <EditableText
                  tagName="div"
                  value={tailoredData.targetHeadline}
                  onChange={(val) =>
                    onUpdateTailoredData({ ...tailoredData, targetHeadline: val })
                  }
                  className="font-inter font-medium mt-0.5"
                  style={{
                    color: accent,
                    fontSize: `${densityConfig.baseFontSizePx + 1.5}px`,
                  }}
                  ariaLabel="Target Headline"
                />
                <div className="mt-2 font-inter">
                  <ContactItems />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <EditableText
                tagName="h1"
                value={personalInfo.fullName}
                onChange={(val) => onUpdatePersonalInfo({ fullName: val })}
                className="font-merriweather font-bold text-[#111827]"
                style={{ fontSize: `${densityConfig.baseFontSizePx + 13}px`, lineHeight: 1.2 }}
                ariaLabel="Candidate Full Name"
              />
              <EditableText
                tagName="div"
                value={tailoredData.targetHeadline}
                onChange={(val) =>
                  onUpdateTailoredData({ ...tailoredData, targetHeadline: val })
                }
                className="font-inter font-semibold mt-1"
                style={{
                  color: accent,
                  fontSize: `${densityConfig.baseFontSizePx + 1.5}px`,
                }}
                ariaLabel="Target Headline"
              />
              <div className="mt-2 font-inter">
                <ContactItems centered />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Template 3: Two-Column Hybrid full-width top header banner
    return (
      <div
        className="font-inter pb-4"
        style={{
          borderBottom: `2px solid ${accent}`,
          marginBottom: `${densityConfig.headerBottomMarginPx}px`,
        }}
      >
        <div className="flex items-center gap-4">
          {hasPhoto && (
            <div
              className="shrink-0 rounded-full overflow-hidden border-2"
              style={{
                width: '72px',
                height: '72px',
                borderColor: accent,
              }}
            >
              <img
                src={personalInfo.photoDataUrl}
                alt={personalInfo.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <EditableText
              tagName="h1"
              value={personalInfo.fullName}
              onChange={(val) => onUpdatePersonalInfo({ fullName: val })}
              className="font-bold tracking-tight text-[#111827]"
              style={{ fontSize: `${densityConfig.baseFontSizePx + 12}px`, lineHeight: 1.15 }}
              ariaLabel="Candidate Full Name"
            />
            <EditableText
              tagName="div"
              value={tailoredData.targetHeadline}
              onChange={(val) =>
                onUpdateTailoredData({ ...tailoredData, targetHeadline: val })
              }
              className="font-semibold mt-0.5"
              style={{
                color: accent,
                fontSize: `${densityConfig.baseFontSizePx + 1.5}px`,
              }}
              ariaLabel="Target Headline"
            />
            <div className="mt-2">
              <ContactItems />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeading = ({ title }: { title: string }) => {
    const isClassic = template === 'executive-classic';
    return (
      <h2
        className={`${
          isClassic ? 'font-merriweather' : 'font-inter'
        } font-bold tracking-wide uppercase pb-1 mb-2`}
        style={{
          color: accent,
          fontSize: `${densityConfig.baseFontSizePx}px`,
          borderBottom: `1px solid ${hexToRgba(accent, 0.3)}`,
        }}
      >
        {title}
      </h2>
    );
  };

  // Render Cover Letter
  const renderCoverLetter = () => {
    const cl = tailoredData.coverLetter;
    const updateCl = (patch: Partial<typeof cl>) => {
      onUpdateTailoredData({
        ...tailoredData,
        coverLetter: { ...cl, ...patch },
      });
    };

    return (
      <div
        className="font-inter text-[#111827]"
        style={{
          fontSize: `${densityConfig.baseFontSizePx + 0.5}px`,
          lineHeight: densityConfig.lineHeight + 0.1,
        }}
      >
        {renderTemplateHeader()}

        <div className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-[#374151]">
            <div>
              <EditableText
                tagName="div"
                value={cl.recipientName}
                onChange={(val) => updateCl({ recipientName: val })}
                className="font-semibold text-[#111827]"
                ariaLabel="Recipient Name"
              />
              <EditableText
                tagName="div"
                value={cl.recipientTitle}
                onChange={(val) => updateCl({ recipientTitle: val })}
                ariaLabel="Recipient Title"
              />
              <EditableText
                tagName="div"
                value={cl.companyName}
                onChange={(val) => updateCl({ companyName: val })}
                className="font-medium"
                style={{ color: accent }}
                ariaLabel="Company Name"
              />
              {cl.companyAddress && (
                <EditableText
                  tagName="div"
                  value={cl.companyAddress}
                  onChange={(val) => updateCl({ companyAddress: val })}
                  ariaLabel="Company Address"
                />
              )}
            </div>

            <EditableText
              tagName="div"
              value={cl.date}
              onChange={(val) => updateCl({ date: val })}
              className="text-right font-medium text-[#4B5563]"
              ariaLabel="Cover Letter Date"
            />
          </div>

          <div
            className="font-semibold py-1.5 px-3 rounded-md"
            style={{
              backgroundColor: hexToRgba(accent, 0.06),
              color: accent,
            }}
          >
            <span>RE: </span>
            <EditableText
              value={cl.subjectLine}
              onChange={(val) => updateCl({ subjectLine: val })}
              ariaLabel="Cover Letter Subject Line"
            />
          </div>

          <EditableText
            tagName="div"
            value={cl.salutation}
            onChange={(val) => updateCl({ salutation: val })}
            className="font-semibold text-[#111827] pt-1"
            ariaLabel="Salutation"
          />

          <EditableText
            tagName="p"
            value={cl.openingParagraph}
            onChange={(val) => updateCl({ openingParagraph: val })}
            className="text-[#1F2937]"
            ariaLabel="Opening Paragraph"
          />

          {cl.bodyParagraphs.map((para, pIdx) => (
            <EditableText
              key={pIdx}
              tagName="p"
              value={para}
              onChange={(val) => {
                const nextBodies = cl.bodyParagraphs.map((b, i) => (i === pIdx ? val : b));
                updateCl({ bodyParagraphs: nextBodies });
              }}
              className="text-[#1F2937]"
              ariaLabel={`Body Paragraph ${pIdx + 1}`}
            />
          ))}

          <EditableText
            tagName="p"
            value={cl.closingParagraph}
            onChange={(val) => updateCl({ closingParagraph: val })}
            className="text-[#1F2937]"
            ariaLabel="Closing Paragraph"
          />

          <div className="pt-4">
            <EditableText
              tagName="div"
              value={sanitizeCoverLetterSignOff(cl.signOff, personalInfo.fullName)}
              onChange={(val) =>
                updateCl({
                  signOff: sanitizeCoverLetterSignOff(val, personalInfo.fullName),
                })
              }
              className="text-[#374151]"
              ariaLabel="Sign Off"
            />
            <EditableText
              tagName="div"
              value={personalInfo.fullName}
              onChange={(val) => onUpdatePersonalInfo({ fullName: val })}
              className={`${
                template === 'executive-classic' ? 'font-merriweather' : 'font-inter'
              } font-bold mt-2`}
              style={{ color: accent, fontSize: `${densityConfig.baseFontSizePx + 2}px` }}
              ariaLabel="Signature Name"
            />
          </div>
        </div>
      </div>
    );
  };

  // Shared sections for Resume
  const SummaryBlock = () =>
    tailoredData.summary ? (
      <section
        className="print-avoid-break"
        style={{ marginBottom: `${densityConfig.sectionGapPx}px` }}
      >
        <SectionHeading title="Professional Summary" />
        <EditableText
          tagName="p"
          value={tailoredData.summary}
          onChange={(val) => onUpdateTailoredData({ ...tailoredData, summary: val })}
          className="text-[#1F2937]"
          ariaLabel="Professional Summary"
        />
      </section>
    ) : null;

  const ExperienceBlock = () =>
    tailoredData.workExperience.length > 0 ? (
      <section style={{ marginBottom: `${densityConfig.sectionGapPx}px` }}>
        <SectionHeading title="Professional Experience" />
        <div
          className="flex flex-col"
          style={{ gap: `${densityConfig.itemGapPx}px` }}
        >
          {tailoredData.workExperience.map((role, rIdx) => (
            <div key={role.id || rIdx} className="print-avoid-break">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <EditableText
                    tagName="h3"
                    value={role.jobTitle}
                    onChange={(val) => updateWorkField(rIdx, 'jobTitle', val)}
                    className="font-bold text-[#111827]"
                    style={{ fontSize: `${densityConfig.baseFontSizePx + 0.8}px` }}
                    ariaLabel={`Role ${rIdx + 1} Title`}
                  />
                  <span className="text-[#6B7280]">·</span>
                  <EditableText
                    value={role.company}
                    onChange={(val) => updateWorkField(rIdx, 'company', val)}
                    className="font-semibold"
                    style={{ color: accent }}
                    ariaLabel={`Role ${rIdx + 1} Company`}
                  />
                </div>
                <div
                  className="text-[#4B5563] font-medium whitespace-nowrap shrink-0 tabular-nums"
                  style={{ fontSize: `${densityConfig.baseFontSizePx - 1}px` }}
                >
                  <EditableText
                    value={role.startDate}
                    onChange={(val) => updateWorkField(rIdx, 'startDate', val)}
                    ariaLabel="Start Date"
                  />
                  <span> – </span>
                  <EditableText
                    value={role.endDate}
                    onChange={(val) => updateWorkField(rIdx, 'endDate', val)}
                    ariaLabel="End Date"
                  />
                  {role.location && (
                    <>
                      <span> | </span>
                      <EditableText
                        value={role.location}
                        onChange={(val) => updateWorkField(rIdx, 'location', val)}
                        ariaLabel="Role Location"
                      />
                    </>
                  )}
                </div>
              </div>

              <ul
                className="list-disc pl-4 mt-1 text-[#1F2937]"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${densityConfig.bulletSpacingPx}px`,
                }}
              >
                {role.bullets.map((bullet, bIdx) => (
                  <EditableText
                    key={bIdx}
                    tagName="li"
                    value={bullet}
                    onChange={(val) => updateWorkBullet(rIdx, bIdx, val)}
                    ariaLabel={`Role ${rIdx + 1} Bullet ${bIdx + 1}`}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const ProjectsBlock = () =>
    tailoredData.projects.length > 0 ? (
      <section style={{ marginBottom: `${densityConfig.sectionGapPx}px` }}>
        <SectionHeading title="Key Projects & Open Source" />
        <div
          className="flex flex-col"
          style={{ gap: `${densityConfig.itemGapPx - 2}px` }}
        >
          {tailoredData.projects.map((proj, pIdx) => (
            <div key={proj.id || pIdx} className="print-avoid-break">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <EditableText
                    tagName="h3"
                    value={proj.name}
                    onChange={(val) => updateProjectField(pIdx, 'name', val)}
                    className="font-bold text-[#111827]"
                    ariaLabel={`Project ${pIdx + 1} Name`}
                  />
                  {proj.roleOrTechStack && (
                    <>
                      <span className="text-[#6B7280]">—</span>
                      <EditableText
                        value={proj.roleOrTechStack}
                        onChange={(val) =>
                          updateProjectField(pIdx, 'roleOrTechStack', val)
                        }
                        className="font-medium text-[#374151]"
                        style={{ fontSize: `${densityConfig.baseFontSizePx - 0.5}px` }}
                        ariaLabel={`Project ${pIdx + 1} Tech Stack`}
                      />
                    </>
                  )}
                </div>
                {proj.link && (
                  <EditableText
                    value={proj.link}
                    onChange={(val) => updateProjectField(pIdx, 'link', val)}
                    className="font-medium"
                    style={{
                      color: accent,
                      fontSize: `${densityConfig.baseFontSizePx - 1}px`,
                    }}
                    ariaLabel={`Project ${pIdx + 1} Link`}
                  />
                )}
              </div>
              <ul
                className="list-disc pl-4 mt-1 text-[#1F2937]"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${densityConfig.bulletSpacingPx}px`,
                }}
              >
                {proj.bullets.map((b, bIdx) => (
                  <EditableText
                    key={bIdx}
                    tagName="li"
                    value={b}
                    onChange={(val) => updateProjectBullet(pIdx, bIdx, val)}
                    ariaLabel={`Project ${pIdx + 1} Bullet ${bIdx + 1}`}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const SkillsBlock = ({ stacked = false }: { stacked?: boolean }) =>
    tailoredData.skills.length > 0 ? (
      <section
        className="print-avoid-break"
        style={{ marginBottom: `${densityConfig.sectionGapPx}px` }}
      >
        <SectionHeading title="Core Competencies & Skills" />
        <div className={stacked ? 'space-y-2.5' : 'space-y-1.5'}>
          {tailoredData.skills.map((cat, cIdx) => (
            <div
              key={cat.id || cIdx}
              className={stacked ? 'flex flex-col' : 'flex flex-wrap items-baseline gap-x-2'}
            >
              <EditableText
                value={`${cat.category}:`}
                onChange={(val) => {
                  const next = tailoredData.skills.map((s, idx) =>
                    idx === cIdx ? { ...s, category: val.replace(/:$/, '') } : s
                  );
                  onUpdateTailoredData({ ...tailoredData, skills: next });
                }}
                className="font-bold text-[#111827] shrink-0"
                ariaLabel={`Skill Category ${cIdx + 1}`}
              />
              <EditableText
                value={cat.skills.join(', ')}
                onChange={(val) => updateSkillCategoryText(cIdx, val)}
                className="text-[#1F2937]"
                ariaLabel={`Skills in ${cat.category}`}
              />
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const EducationBlock = ({ stacked = false }: { stacked?: boolean }) =>
    tailoredData.education.length > 0 ? (
      <section
        className="print-avoid-break"
        style={{ marginBottom: `${densityConfig.sectionGapPx}px` }}
      >
        <SectionHeading title="Education" />
        <div className="space-y-2">
          {tailoredData.education.map((edu, eIdx) => (
            <div
              key={edu.id || eIdx}
              className={
                stacked
                  ? 'flex flex-col'
                  : 'flex flex-wrap items-baseline justify-between gap-2'
              }
            >
              <div>
                <EditableText
                  value={edu.degree}
                  onChange={(val) => updateEducationField(eIdx, 'degree', val)}
                  className={`font-bold text-[#111827] ${
                    stacked ? 'block' : 'block sm:inline sm:mr-2'
                  }`}
                  ariaLabel={`Degree ${eIdx + 1}`}
                />
                <EditableText
                  value={edu.institution}
                  onChange={(val) => updateEducationField(eIdx, 'institution', val)}
                  className={`font-medium ${stacked ? 'block' : 'block sm:inline'}`}
                  style={{ color: accent }}
                  ariaLabel={`Institution ${eIdx + 1}`}
                />
              </div>
              <div
                className="text-[#4B5563] tabular-nums"
                style={{ fontSize: `${densityConfig.baseFontSizePx - 1}px` }}
              >
                <EditableText
                  value={edu.graduationYear}
                  onChange={(val) => updateEducationField(eIdx, 'graduationYear', val)}
                  ariaLabel="Graduation Year"
                />
                {edu.gpaOrHonors && (
                  <>
                    <span> · </span>
                    <EditableText
                      value={edu.gpaOrHonors}
                      onChange={(val) => updateEducationField(eIdx, 'gpaOrHonors', val)}
                      ariaLabel="GPA or Honors"
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const CertificationsBlock = () =>
    tailoredData.certifications.length > 0 ? (
      <section className="print-avoid-break">
        <SectionHeading title="Certifications & Awards" />
        <div className="space-y-1">
          {tailoredData.certifications.map((cert, cIdx) => (
            <div
              key={cert.id || cIdx}
              className="flex flex-wrap items-baseline justify-between gap-2"
            >
              <div>
                <EditableText
                  value={cert.name}
                  onChange={(val) => updateCertField(cIdx, 'name', val)}
                  className="font-semibold text-[#111827]"
                  ariaLabel={`Certification ${cIdx + 1} Name`}
                />
                <span className="text-[#6B7280] mx-1.5">—</span>
                <EditableText
                  value={cert.issuer}
                  onChange={(val) => updateCertField(cIdx, 'issuer', val)}
                  className="text-[#374151]"
                  ariaLabel={`Certification ${cIdx + 1} Issuer`}
                />
              </div>
              <EditableText
                value={cert.year}
                onChange={(val) => updateCertField(cIdx, 'year', val)}
                className="text-[#4B5563] tabular-nums"
                style={{ fontSize: `${densityConfig.baseFontSizePx - 1}px` }}
                ariaLabel={`Certification ${cIdx + 1} Year`}
              />
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const renderResume = () => {
    if (template === 'two-column-hybrid') {
      // Two-Column Hybrid: Full-width top header banner above asymmetric two-column body:
      // 32% left column (tinted with 5% opacity of accent color) containing Skills, Education, Certifications
      // 68% right column containing Summary, Work Experience, Projects
      return (
        <div
          className="font-inter text-[#111827]"
          style={{
            fontSize: `${densityConfig.baseFontSizePx}px`,
            lineHeight: densityConfig.lineHeight,
          }}
        >
          {renderTemplateHeader()}

          <div className="flex items-stretch gap-5">
            {/* 32% Left Column */}
            <div
              className="w-[32%] shrink-0 p-3.5 rounded-lg"
              style={{
                backgroundColor: hexToRgba(accent, 0.05),
              }}
            >
              <SkillsBlock stacked />
              <EducationBlock stacked />
              <CertificationsBlock />
            </div>

            {/* 68% Right Column */}
            <div className="w-[68%] flex-1 min-w-0">
              <SummaryBlock />
              <ExperienceBlock />
              <ProjectsBlock />
            </div>
          </div>
        </div>
      );
    }

    // Single-Column Layouts: Modern Minimal & Executive Classic
    return (
      <div
        className="font-inter text-[#111827]"
        style={{
          fontSize: `${densityConfig.baseFontSizePx}px`,
          lineHeight: densityConfig.lineHeight,
        }}
      >
        {renderTemplateHeader()}
        <SummaryBlock />
        <ExperienceBlock />
        <ProjectsBlock />
        <SkillsBlock />
        <EducationBlock />
        <CertificationsBlock />
      </div>
    );
  };

  return (
    <div
      ref={docRef}
      id="printable-document"
      data-target-length={targetLength}
      className="mx-auto shadow-2xl rounded-xs transition-all"
      style={{
        padding: densityConfig.pagePaddingMm,
        backgroundColor: '#FFFFFF',
        color: '#111827',
        zoom: previewZoom,
        ...(targetLength === '1-page'
          ? { height: '297mm', maxHeight: '297mm', overflow: 'hidden' }
          : {}),
      }}
    >
      <div
        ref={innerRef}
        data-doc-inner="true"
        data-overflow-zoom={overflowZoom}
        style={
          overflowZoom < 1
            ? { zoom: overflowZoom, width: `${100 / overflowZoom}%` }
            : undefined
        }
      >
        {activeDocument === 'resume' ? renderResume() : renderCoverLetter()}
      </div>

      {/* Non-printing dashed A4 Page 1 Boundary indicator at 297mm */}
      <div
        aria-hidden="true"
        className="no-print pointer-events-none absolute left-0 right-0 flex items-center justify-between px-4"
        style={{
          top: '297mm',
          borderTop: '1.5px dashed #94A3B8',
        }}
      >
        <span className="px-2 py-0.5 -mt-3 text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-800 text-white rounded-xs shadow-xs">
          Page 1 A4 Boundary (297mm)
        </span>
        <span
          className={`px-2 py-0.5 -mt-3 text-[10px] font-mono rounded-xs border ${
            targetLength === '1-page'
              ? 'text-emerald-800 bg-emerald-50 border-emerald-300 font-semibold'
              : 'text-slate-600 bg-slate-100 border-slate-300'
          }`}
        >
          {targetLength === '1-page'
            ? 'Fits cleanly on 1 A4 Page'
            : 'Content below prints on Page 2'}
        </span>
      </div>
    </div>
  );
};
