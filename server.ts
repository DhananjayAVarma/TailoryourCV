import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  MasterProfile,
  TailoredResumeData,
  TargetLength,
} from './src/types/cv.ts';
import {
  computeLocalAtsAnalysis,
  createInitialTailoredData,
  normalizeMasterProfile,
  sanitizeCoverLetterSignOff,
} from './src/utils/cvLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    apiVersion: 'v1beta',
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MASTER_PROFILE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        targetHeadline: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        linkedinUrl: { type: Type.STRING },
        portfolioUrl: { type: Type.STRING },
      },
      required: [
        'fullName',
        'targetHeadline',
        'email',
        'phone',
        'location',
        'linkedinUrl',
        'portfolioUrl',
      ],
    },
    summary: { type: Type.STRING },
    workExperience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING },
          company: { type: Type.STRING },
          location: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['jobTitle', 'company', 'location', 'startDate', 'endDate', 'bullets'],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          roleOrTechStack: { type: Type.STRING },
          link: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['name', 'roleOrTechStack', 'link', 'bullets'],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          location: { type: Type.STRING },
          graduationYear: { type: Type.STRING },
          gpaOrHonors: { type: Type.STRING },
        },
        required: ['degree', 'institution', 'location', 'graduationYear', 'gpaOrHonors'],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          year: { type: Type.STRING },
        },
        required: ['name', 'issuer', 'year'],
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['category', 'skills'],
      },
    },
  },
  required: [
    'personalInfo',
    'summary',
    'workExperience',
    'projects',
    'education',
    'certifications',
    'skills',
  ],
};

const TAILORED_RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    targetHeadline: { type: Type.STRING },
    summary: { type: Type.STRING },
    workExperience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          jobTitle: { type: Type.STRING },
          company: { type: Type.STRING },
          location: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['jobTitle', 'company', 'location', 'startDate', 'endDate', 'bullets'],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          roleOrTechStack: { type: Type.STRING },
          link: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['name', 'roleOrTechStack', 'link', 'bullets'],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          location: { type: Type.STRING },
          graduationYear: { type: Type.STRING },
          gpaOrHonors: { type: Type.STRING },
        },
        required: ['degree', 'institution', 'location', 'graduationYear', 'gpaOrHonors'],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          year: { type: Type.STRING },
        },
        required: ['name', 'issuer', 'year'],
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['category', 'skills'],
      },
    },
    coverLetter: {
      type: Type.OBJECT,
      properties: {
        recipientName: { type: Type.STRING },
        recipientTitle: { type: Type.STRING },
        companyName: { type: Type.STRING },
        companyAddress: { type: Type.STRING },
        date: { type: Type.STRING },
        subjectLine: { type: Type.STRING },
        salutation: { type: Type.STRING },
        openingParagraph: { type: Type.STRING },
        bodyParagraphs: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        closingParagraph: { type: Type.STRING },
        signOff: {
          type: Type.STRING,
          description:
            "Closing phrase only (e.g., 'Sincerely,' or 'Best regards,'), strictly WITHOUT the candidate's name.",
        },
      },
      required: [
        'recipientName',
        'recipientTitle',
        'companyName',
        'companyAddress',
        'date',
        'subjectLine',
        'salutation',
        'openingParagraph',
        'bodyParagraphs',
        'closingParagraph',
        'signOff',
      ],
    },
    atsAnalysis: {
      type: Type.OBJECT,
      properties: {
        matchScore: { type: Type.INTEGER },
        matchedKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        missingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        tailoringNotes: { type: Type.STRING },
      },
      required: ['matchScore', 'matchedKeywords', 'missingKeywords', 'tailoringNotes'],
    },
  },
  required: [
    'targetHeadline',
    'summary',
    'workExperience',
    'projects',
    'education',
    'certifications',
    'skills',
    'coverLetter',
    'atsAnalysis',
  ],
};

const GENERATED_JD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    jobDescription: {
      type: Type.STRING,
      description:
        'A realistic, well-structured plain-text job description tailored to the requested job title, including role summary, key responsibilities, required skills/qualifications, and preferred bonus qualifications.',
    },
  },
  required: ['jobDescription'],
};

function buildFallbackJobDescription(jobTitle: string, targetCompany: string): string {
  const cleanTitle = jobTitle.trim();
  const companySuffix = targetCompany.trim() ? ` — ${targetCompany.trim()}` : '';
  const orgPhrase = targetCompany.trim() || 'our organization';

  return `${cleanTitle}${companySuffix}
We are seeking an accomplished ${cleanTitle} to join ${orgPhrase} and drive high-impact initiatives across product delivery, operational excellence, and cross-functional execution.

Key Responsibilities:
- Lead end-to-end strategy, architecture, and execution for core ${cleanTitle} initiatives.
- Partner closely with engineering, product, design, and executive stakeholders to translate business goals into measurable outcomes.
- Establish best practices, quality standards, documentation, and scalable workflows across teams.
- Track key performance metrics, optimize reliability and efficiency, and mentor team members.

Required Qualifications:
- Proven track record of delivering measurable impact in a ${cleanTitle} or closely related role.
- Strong problem-solving, communication, and stakeholder alignment skills in fast-paced environments.
- Hands-on mastery of modern tools, systems, and methodologies relevant to ${cleanTitle} work.

Preferred Qualifications:
- Experience scaling processes or platforms in high-growth organizations.
- Demonstrated leadership mentoring peers and driving cross-team continuous improvement.`;
}

function getGeminiErrorMessage(err: any): string {
  const status = err?.status || err?.code;
  const rawMessage = String(err?.message || '');
  if (
    status === 429 ||
    rawMessage.includes('429') ||
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    rawMessage.toLowerCase().includes('quota')
  ) {
    return 'Gemini API quota exceeded (429 RESOURCE_EXHAUSTED). Upgrading to a paid tier increases quota—you can select a billing-enabled API key in Settings > Secrets.';
  }
  if (
    status === 403 ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID')
  ) {
    return 'Gemini API authentication failed. Please check or select a valid API key in the Settings > Secrets panel.';
  }
  return rawMessage || 'Failed to generate content with Gemini.';
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction: string;
    responseSchema: any;
  }
) {
  const modelsToTry = [
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
        },
      });
      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const msg = String(err?.message || '').toLowerCase();
      const isRetryableModelError =
        status === 404 ||
        status === 429 ||
        status === 500 ||
        status === 503 ||
        msg.includes('not found') ||
        msg.includes('resource_exhausted') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('unavailable') ||
        msg.includes('overloaded');

      if (isRetryableModelError) {
        continue;
      }
      break;
    }
  }
  throw lastError || new Error('Failed to generate content with Gemini.');
}

function parseRawTextFallback(rawText: string): MasterProfile {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const firstLine = lines[0] || 'Candidate Profile';
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\d[\d\s().-]{7,}\d)/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  const bullets = lines
    .filter((l) => /^[-•*]/.test(l) || l.length > 45)
    .map((l) => l.replace(/^[-•*]\s*/, ''))
    .slice(0, 6);

  return normalizeMasterProfile({
    personalInfo: {
      fullName: firstLine.length < 50 ? firstLine : 'Extracted Candidate',
      targetHeadline: lines[1] && lines[1].length < 80 ? lines[1] : 'Software & Product Professional',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0].trim() : '',
      location: '',
      linkedinUrl: linkedinMatch ? linkedinMatch[0] : '',
      portfolioUrl: githubMatch ? githubMatch[0] : '',
      photoDataUrl: '',
    },
    summary:
      lines.find((l) => l.length > 60 && !/^[-•*]/.test(l)) ||
      'Experienced professional with a track record of delivering impactful projects and cross-functional results.',
    workExperience:
      bullets.length > 0
        ? [
            {
              id: `exp-${Date.now()}`,
              jobTitle: lines[1] && lines[1].length < 60 ? lines[1] : 'Senior Professional',
              company: 'Extracted Experience',
              location: '',
              startDate: '2021',
              endDate: 'Present',
              bullets,
            },
          ]
        : [],
    projects: [],
    education: [],
    certifications: [],
    skills: [
      {
        id: `skill-${Date.now()}`,
        category: 'Extracted Skills',
        skills: Array.from(
          new Set(
            rawText
              .split(/[,•|\n]/)
              .map((s) => s.trim())
              .filter((s) => s.length >= 2 && s.length <= 24 && !s.includes(' '))
          )
        ).slice(0, 12),
      },
    ],
  });
}

function buildGroundedFallbackTailoredData(
  profile: MasterProfile,
  jobDescription: string,
  targetCompany: string,
  targetLength: TargetLength
): TailoredResumeData {
  const localAts = computeLocalAtsAnalysis(profile, jobDescription);
  const baseData = createInitialTailoredData(
    profile,
    targetCompany || 'Target Organization',
    jobDescription
  );

  // Enforce 1-page vs 2-page length constraint strictly using only true facts from MasterProfile
  const maxRoles = targetLength === '1-page' ? 3 : profile.workExperience.length;
  const maxBulletsPerRole = targetLength === '1-page' ? 3 : 6;
  const maxProjects = targetLength === '1-page' ? 2 : profile.projects.length;

  const jdLower = jobDescription.toLowerCase();

  // Score and prioritize work experience bullets by relevance to JD without inventing anything
  const tailoredWork = profile.workExperience.slice(0, maxRoles).map((role, idx) => {
    const scoredBullets = role.bullets.map((b) => {
      const lowerB = b.toLowerCase();
      let score = 0;
      for (const kw of localAts.matchedKeywords) {
        if (lowerB.includes(kw.toLowerCase())) score += 2;
      }
      if (/\d+%|\$\d+|\d+x/.test(b)) score += 1;
      return { text: b, score };
    });
    scoredBullets.sort((a, b) => b.score - a.score);
    return {
      ...role,
      id: role.id || `exp-${idx}`,
      bullets: scoredBullets.slice(0, maxBulletsPerRole).map((b) => b.text),
    };
  });

  const tailoredProjects = profile.projects.slice(0, maxProjects).map((proj, idx) => ({
    ...proj,
    id: proj.id || `proj-${idx}`,
    bullets: proj.bullets.slice(0, targetLength === '1-page' ? 2 : 4),
  }));

  // Extract a clean target role title from the first line of the JD if present
  const firstJdLine = jobDescription
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  const extractedRole =
    firstJdLine && firstJdLine.length < 75
      ? firstJdLine.split(/[-—|@]/)[0].trim()
      : profile.personalInfo.targetHeadline || 'Senior Professional';

  const topMatched = localAts.matchedKeywords.slice(0, 5);
  const companyLabel = targetCompany.trim() || 'your organization';

  const tailoredSummary = profile.summary
    ? `${profile.summary}${
        topMatched.length > 0
          ? ` Proven expertise across ${topMatched.join(', ')} tailored to drive high-impact outcomes for ${companyLabel}.`
          : ''
      }`
    : baseData.summary;

  return {
    targetHeadline: profile.personalInfo.targetHeadline || extractedRole,
    summary: tailoredSummary,
    workExperience: tailoredWork,
    projects: tailoredProjects,
    education: profile.education,
    certifications: profile.certifications,
    skills: profile.skills.map((cat) => {
      // Sort matched skills to the front of each category
      const sorted = [...cat.skills].sort((a, b) => {
        const aMatch = jdLower.includes(a.toLowerCase()) ? 1 : 0;
        const bMatch = jdLower.includes(b.toLowerCase()) ? 1 : 0;
        return bMatch - aMatch;
      });
      return {
        ...cat,
        skills: sorted,
      };
    }),
    coverLetter: {
      ...baseData.coverLetter,
      companyName: companyLabel,
      subjectLine: `Application for ${extractedRole} — ${profile.personalInfo.fullName || 'Candidate'}`,
      salutation: `Dear ${companyLabel} Hiring Team,`,
      openingParagraph: `I am excited to submit my application for the ${extractedRole} position at ${companyLabel}. Drawing on my background as a ${profile.personalInfo.targetHeadline || 'seasoned professional'}${
        topMatched.length > 0 ? ` with deep hands-on experience in ${topMatched.join(', ')}` : ''
      }, I am confident in my ability to contribute immediately to your team's objectives.`,
      bodyParagraphs: [
        profile.workExperience[0]
          ? `In my role as ${profile.workExperience[0].jobTitle} at ${profile.workExperience[0].company}, I focused on delivering measurable operational and technical results: ${profile.workExperience[0].bullets.slice(0, 2).join(' ')}`
          : baseData.coverLetter.bodyParagraphs[0],
        profile.workExperience[1]
          ? `Previously at ${profile.workExperience[1].company} as ${profile.workExperience[1].jobTitle}, I further strengthened my execution across cross-functional initiatives: ${profile.workExperience[1].bullets.slice(0, 2).join(' ')}`
          : baseData.coverLetter.bodyParagraphs[1],
      ],
      closingParagraph: `Thank you for considering my application. I look forward to the possibility of discussing how my verified experience and technical background align with ${companyLabel}'s goals.`,
      signOff: 'Sincerely,',
    },
    atsAnalysis: localAts,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '0.0.0.0';

  // Increase payload limit to 20MB to support base64 PDF uploads and profile photos
  app.use(express.json({ limit: '20mb' }));

  app.post('/api/parse-pdf', async (req, res) => {
    try {
      const { pdfBase64 } = req.body || {};
      if (!pdfBase64 || typeof pdfBase64 !== 'string') {
        return res.status(400).json({ error: 'Missing pdfBase64 payload.' });
      }

      const cleanedBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const ai = getGenAIClient();

      if (!ai) {
        return res.status(400).json({
          error:
            'Gemini API key is not configured. Please check the Settings > Secrets panel or use Paste Raw Text / Sample Profile.',
        });
      }

      const systemInstruction = `You are an expert resume parser for TailorCV Studio.
Extract all career details from the provided PDF resume into the structured JSON schema.
Rules:
- Extract exact job titles, company names, dates, locations, and accomplishment bullet points.
- Categorize skills logically (e.g., Technical Skills, Tools & Cloud, Leadership & Domain).
- Never invent facts not present in the PDF. Use empty strings or empty arrays for missing sections.`;

      const parsed = await generateWithModelFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanedBase64,
              },
            },
            {
              text: 'Extract all resume sections from this PDF into the MasterProfile JSON structure.',
            },
          ],
        },
        systemInstruction,
        responseSchema: MASTER_PROFILE_SCHEMA,
      });

      const normalized = normalizeMasterProfile(parsed);
      return res.json({ profile: normalized });
    } catch (error: any) {
      const friendlyMessage = getGeminiErrorMessage(error);
      const status = error?.status || error?.code;
      return res.status(status === 429 ? 429 : 500).json({
        error: friendlyMessage,
      });
    }
  });

  app.post('/api/parse-text', async (req, res) => {
    try {
      const { rawText } = req.body || {};
      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({ error: 'Please paste non-empty text or career notes to organize.' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        const fallbackProfile = parseRawTextFallback(rawText);
        return res.json({ profile: fallbackProfile, usedFallback: true });
      }

      const systemInstruction = `You are an expert career data organizer for TailorCV Studio.
Parse the user's unformatted LinkedIn text, old resume text, or project notes into the structured MasterProfile JSON schema.
Rules:
- Never fabricate companies, degrees, dates, or metrics that are not in the user's text.
- Organize skills into clean categories (e.g., Core Technologies, Frameworks & Tools, Domain & Leadership).
- Polish fragmented notes into clear, factual accomplishment bullet points while preserving all original metrics and facts.`;

      try {
        const parsed = await generateWithModelFallback(ai, {
          contents: `Parse and organize the following raw career notes/resume text into the structured MasterProfile JSON:\n\n${rawText}`,
          systemInstruction,
          responseSchema: MASTER_PROFILE_SCHEMA,
        });
        const normalized = normalizeMasterProfile(parsed);
        return res.json({ profile: normalized });
      } catch {
        console.info('Using local parse-text fallback after model exhaustion.');
        const fallbackProfile = parseRawTextFallback(rawText);
        return res.json({ profile: fallbackProfile, usedFallback: true });
      }
    } catch (error: any) {
      console.error('Error in /api/parse-text:', error?.message || error);
      return res.status(500).json({
        error: getGeminiErrorMessage(error),
      });
    }
  });

  app.post('/api/generate-jd', async (req, res) => {
    try {
      const { jobTitle, targetCompany = '' } = req.body || {};
      if (!jobTitle || typeof jobTitle !== 'string' || !jobTitle.trim()) {
        return res.status(400).json({
          error: 'Please enter a job title to generate a Job Description.',
        });
      }

      const cleanTitle = jobTitle.trim();
      const cleanCompany = typeof targetCompany === 'string' ? targetCompany.trim() : '';
      const ai = getGenAIClient();

      if (!ai) {
        return res.json({
          jobDescription: buildFallbackJobDescription(cleanTitle, cleanCompany),
          usedFallback: true,
        });
      }

      const systemInstruction = `You are an expert technical and executive recruiter for TailorCV Studio.
Generate a realistic, ATS-ready plain-text Job Description tailored specifically to the requested job title.
Rules:
- Format cleanly in plain text (no markdown bold/headings like ** or ##).
- Use newline (\\n) breaks between sections (Role Overview, Key Responsibilities, Required Qualifications, Preferred Qualifications), with a blank line between sections and each bullet point on its own line starting with "- ".
- Include realistic, industry-standard skills, tools, metrics, and keywords authentic to the specified job title so a candidate can benchmark and tailor their resume accurately.
- Keep the length concise and scannable (roughly 180-240 words).`;

      const prompt = `JOB TITLE: ${cleanTitle}${
        cleanCompany ? `\nTARGET COMPANY: ${cleanCompany}` : ''
      }

Generate a realistic, role-specific Job Description in the requested JSON schema.`;

      try {
        const result = await generateWithModelFallback(ai, {
          contents: prompt,
          systemInstruction,
          responseSchema: GENERATED_JD_SCHEMA,
        });
        const generated =
          typeof result?.jobDescription === 'string' && result.jobDescription.trim()
            ? result.jobDescription.trim()
            : buildFallbackJobDescription(cleanTitle, cleanCompany);

        return res.json({ jobDescription: generated });
      } catch {
        console.info('Using local generate-jd fallback after model exhaustion.');
        return res.json({
          jobDescription: buildFallbackJobDescription(cleanTitle, cleanCompany),
          usedFallback: true,
        });
      }
    } catch (error: any) {
      console.error('Error in /api/generate-jd:', error?.message || error);
      return res.status(500).json({
        error: getGeminiErrorMessage(error),
      });
    }
  });

  app.post('/api/tailor', async (req, res) => {
    try {
      const {
        profile: rawProfile,
        jobDescription,
        targetCompany = '',
        targetLength = '1-page',
      } = req.body || {};

      if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
        return res.status(400).json({
          error: 'Please enter a Target Job Description before generating a tailored resume.',
        });
      }

      const profile = normalizeMasterProfile(rawProfile);
      const ai = getGenAIClient();

      if (!ai) {
        const fallbackData = buildGroundedFallbackTailoredData(
          profile,
          jobDescription,
          targetCompany,
          targetLength
        );
        return res.json({ tailoredData: fallbackData, usedFallback: true });
      }

      const lengthDirective =
        targetLength === '1-page'
          ? 'TARGET LENGTH: 1 PAGE. Select the top 2-3 most relevant roles and top 1-2 most relevant projects from the Master Profile, and tighten each bullet point to 2-3 crisp lines (max 3-4 bullets per role) so the entire resume fits cleanly within a single 297mm A4 page.'
          : 'TARGET LENGTH: 2 PAGES. Include the broader work history and project portfolio from the Master Profile with comprehensive accomplishment detail.';

      const systemInstruction = `You are the Principal Executive Resume Strategist and ATS Grounding Engine for TailorCV Studio.
Your task is to generate a tailored Resume, a matching tailored Cover Letter, and an honest ATS Keyword Match & Gap Analysis based strictly on the user's Master Profile and the pasted Target Job Description.

STRICT AI GROUNDING & TAILORING RULES (ZERO HALLUCINATION MANDATE):
1. ZERO HALLUCINATION MANDATE: NEVER invent companies, job titles, employment dates, degrees, certifications, metrics, or tools/skills that do not exist in the user's Master Profile.
2. Select, prioritize, and reframe ONLY true facts from the Master Profile to maximize relevance to the pasted Job Description.
3. Tailor the Professional Summary and Target Headline specifically to the target role and company (${targetCompany || 'the hiring organization'}).
4. Rewrite bullet points using strong action verbs and natural keyword alignment with the Job Description while keeping all numbers, percentages, dollar figures, and facts 100% truthful to the Master Profile.
5. ${lengthDirective}
6. ATS KEYWORD MATCH & GAP ANALYZER:
   - Calculate an realistic estimated ATS Match Score (0-100).
   - "matchedKeywords": List keywords/skills from the Job Description that are genuinely supported by the user's Master Profile.
   - "missingKeywords": List important keywords/skills requested in the Job Description that are NOT in the user's Master Profile. Strictly NEVER fabricate these missing keywords onto the resume or cover letter!`;

      const prompt = `MASTER PROFILE JSON:
${JSON.stringify(
  {
    ...profile,
    personalInfo: {
      ...profile.personalInfo,
      photoDataUrl: undefined, // Omit base64 image from prompt tokens
    },
  },
  null,
  2
)}

TARGET COMPANY NAME: ${targetCompany || 'Not specified'}
TARGET LENGTH: ${targetLength}

TARGET JOB DESCRIPTION:
${jobDescription}

Generate the tailored resume, matching cover letter, and ATS keyword match/gap analysis in the exact JSON schema.`;

      try {
        const result = await generateWithModelFallback(ai, {
          contents: prompt,
          systemInstruction,
          responseSchema: TAILORED_RESUME_SCHEMA,
        });

        // Merge with local ATS verification if AI returned empty arrays
        const localAts = computeLocalAtsAnalysis(profile, jobDescription);
        const atsAnalysis = {
          matchScore:
            typeof result?.atsAnalysis?.matchScore === 'number'
              ? Math.max(0, Math.min(100, Math.round(result.atsAnalysis.matchScore)))
              : localAts.matchScore,
          matchedKeywords:
            Array.isArray(result?.atsAnalysis?.matchedKeywords) &&
            result.atsAnalysis.matchedKeywords.length > 0
              ? result.atsAnalysis.matchedKeywords
              : localAts.matchedKeywords,
          missingKeywords:
            Array.isArray(result?.atsAnalysis?.missingKeywords) &&
            result.atsAnalysis.missingKeywords.length > 0
              ? result.atsAnalysis.missingKeywords
              : localAts.missingKeywords,
          tailoringNotes:
            result?.atsAnalysis?.tailoringNotes || localAts.tailoringNotes,
        };

        const tailoredData: TailoredResumeData = {
          targetHeadline:
            result.targetHeadline || profile.personalInfo.targetHeadline || 'Senior Professional',
          summary: result.summary || profile.summary,
          workExperience: Array.isArray(result.workExperience)
            ? result.workExperience.map((w: any, i: number) => ({
                id: w.id || `tailored-exp-${i}`,
                jobTitle: w.jobTitle || '',
                company: w.company || '',
                location: w.location || '',
                startDate: w.startDate || '',
                endDate: w.endDate || '',
                bullets: Array.isArray(w.bullets) ? w.bullets : [],
              }))
            : profile.workExperience,
          projects: Array.isArray(result.projects)
            ? result.projects.map((p: any, i: number) => ({
                id: p.id || `tailored-proj-${i}`,
                name: p.name || '',
                roleOrTechStack: p.roleOrTechStack || '',
                link: p.link || '',
                bullets: Array.isArray(p.bullets) ? p.bullets : [],
              }))
            : profile.projects,
          education: Array.isArray(result.education)
            ? result.education.map((e: any, i: number) => ({
                id: e.id || `tailored-edu-${i}`,
                degree: e.degree || '',
                institution: e.institution || '',
                location: e.location || '',
                graduationYear: e.graduationYear || '',
                gpaOrHonors: e.gpaOrHonors || '',
              }))
            : profile.education,
          certifications: Array.isArray(result.certifications)
            ? result.certifications.map((c: any, i: number) => ({
                id: c.id || `tailored-cert-${i}`,
                name: c.name || '',
                issuer: c.issuer || '',
                year: c.year || '',
              }))
            : profile.certifications,
          skills: Array.isArray(result.skills)
            ? result.skills.map((s: any, i: number) => ({
                id: s.id || `tailored-skill-${i}`,
                category: s.category || 'Skills',
                skills: Array.isArray(s.skills) ? s.skills : [],
              }))
            : profile.skills,
          coverLetter: {
            recipientName: result.coverLetter?.recipientName || 'Hiring Manager',
            recipientTitle: result.coverLetter?.recipientTitle || 'Talent Acquisition Team',
            companyName:
              result.coverLetter?.companyName || targetCompany || 'Hiring Organization',
            companyAddress: result.coverLetter?.companyAddress || '',
            date:
              result.coverLetter?.date ||
              new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }),
            subjectLine:
              result.coverLetter?.subjectLine ||
              `Application for ${result.targetHeadline || profile.personalInfo.targetHeadline}`,
            salutation:
              result.coverLetter?.salutation ||
              `Dear ${targetCompany || 'Hiring'} Team,`,
            openingParagraph: result.coverLetter?.openingParagraph || '',
            bodyParagraphs: Array.isArray(result.coverLetter?.bodyParagraphs)
              ? result.coverLetter.bodyParagraphs
              : [],
            closingParagraph: result.coverLetter?.closingParagraph || '',
            signOff: sanitizeCoverLetterSignOff(
              result.coverLetter?.signOff || 'Sincerely,',
              profile.personalInfo.fullName
            ),
          },
          atsAnalysis,
        };

        return res.json({ tailoredData });
      } catch {
        console.info('Using grounded local tailor fallback after model exhaustion.');
        const fallbackData = buildGroundedFallbackTailoredData(
          profile,
          jobDescription,
          targetCompany,
          targetLength
        );
        return res.json({ tailoredData: fallbackData, usedFallback: true });
      }
    } catch (error: any) {
      console.error('Error in /api/tailor:', error?.message || error);
      return res.status(500).json({
        error: getGeminiErrorMessage(error),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`TailorCV Studio server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TailorCV Studio server:', err);
  process.exit(1);
});
