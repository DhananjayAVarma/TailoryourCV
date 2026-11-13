import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_MASTER_PROFILE,
  SAMPLE_JOB_DESCRIPTION,
  computeLocalAtsAnalysis,
  getDensityStyles,
  mergeMasterProfiles,
  normalizeMasterProfile,
  sanitizeCoverLetterSignOff,
  validateHexColor,
} from './cvLogic';

test('computeLocalAtsAnalysis separates matched vs missing JD keywords accurately without fabrication', () => {
  const analysis = computeLocalAtsAnalysis(SAMPLE_MASTER_PROFILE, SAMPLE_JOB_DESCRIPTION);

  assert.ok(analysis.matchScore >= 50 && analysis.matchScore <= 99);
  assert.ok(analysis.matchedKeywords.includes('TypeScript'));
  assert.ok(analysis.matchedKeywords.includes('React'));
  assert.ok(analysis.matchedKeywords.includes('PostgreSQL'));
  assert.ok(analysis.matchedKeywords.includes('Kubernetes'));

  // Rust, ClickHouse, WebAssembly are in SAMPLE_JOB_DESCRIPTION but NOT in SAMPLE_MASTER_PROFILE
  assert.ok(analysis.missingKeywords.includes('Rust'));
  assert.ok(analysis.missingKeywords.includes('ClickHouse'));
  assert.ok(analysis.missingKeywords.includes('WebAssembly'));
});

test('mergeMasterProfiles combines work experience bullets and skills without duplicates', () => {
  const incoming = {
    personalInfo: {
      fullName: 'Elena Vance, M.S.',
    },
    workExperience: [
      {
        id: 'new-1',
        jobTitle: 'Staff Software Engineer — Cloud Platform',
        company: 'StratosScale Technologies',
        location: 'San Francisco, CA',
        startDate: 'Jan 2023',
        endDate: 'Present',
        bullets: ['Led multi-region disaster recovery drills across 4 AWS availability zones.'],
      },
      {
        id: 'new-2',
        jobTitle: 'Principal Distributed Architect',
        company: 'NovaCloud Systems',
        location: 'Remote',
        startDate: '2025',
        endDate: 'Present',
        bullets: ['Designed global edge routing mesh.'],
      },
    ],
    skills: [
      {
        id: 's-1',
        category: 'Languages & Core Stack',
        skills: ['TypeScript', 'Rust'],
      },
    ],
  };

  const merged = mergeMasterProfiles(SAMPLE_MASTER_PROFILE, incoming);

  assert.equal(merged.personalInfo.fullName, 'Elena Vance, M.S.');
  // Existing email preserved
  assert.equal(merged.personalInfo.email, SAMPLE_MASTER_PROFILE.personalInfo.email);
  // 3 existing work experiences + 1 new company = 4
  assert.equal(merged.workExperience.length, 4);
  // First experience should have 4 original bullets + 1 new merged bullet = 5
  assert.equal(merged.workExperience[0].bullets.length, 5);
  // Rust added to Languages & Core Stack without duplicating TypeScript
  const langCat = merged.skills.find((s) => s.category === 'Languages & Core Stack');
  assert.ok(langCat);
  assert.ok(langCat.skills.includes('Rust'));
  assert.equal(langCat.skills.filter((k) => k === 'TypeScript').length, 1);
});

test('normalizeMasterProfile handles malformed or partial input safely', () => {
  const normalized = normalizeMasterProfile({
    personalInfo: { fullName: 'Alex Rivera' },
    workExperience: [{ jobTitle: 'Engineer', bullets: ['Built APIs', ''] }],
  });

  assert.equal(normalized.personalInfo.fullName, 'Alex Rivera');
  assert.equal(normalized.personalInfo.email, '');
  assert.equal(normalized.workExperience.length, 1);
  assert.deepEqual(normalized.workExperience[0].bullets, ['Built APIs']);
  assert.deepEqual(normalized.projects, []);
});

test('getDensityStyles returns distinct spacing and font sizing for compact, normal, and relaxed', () => {
  const compact = getDensityStyles('compact');
  const normal = getDensityStyles('normal');
  const relaxed = getDensityStyles('relaxed');

  assert.ok(compact.baseFontSizePx < normal.baseFontSizePx);
  assert.ok(normal.baseFontSizePx < relaxed.baseFontSizePx);
  assert.equal(compact.pagePaddingMm, '14mm');
  assert.equal(normal.pagePaddingMm, '16mm');
  assert.equal(relaxed.pagePaddingMm, '18mm');
});

test('validateHexColor normalizes valid hex strings and falls back to Executive Navy on invalid input', () => {
  assert.equal(validateHexColor('#065f46'), '#065F46');
  assert.equal(validateHexColor('4338ca'), '#4338CA');
  assert.equal(validateHexColor('not-a-color'), '#1E3A8A');
});

test('sanitizeCoverLetterSignOff removes candidate name while preserving closing phrase', () => {
  assert.equal(sanitizeCoverLetterSignOff('Sincerely,\nElena Vance', 'Elena Vance'), 'Sincerely,');
  assert.equal(sanitizeCoverLetterSignOff('Best regards, Elena Vance', 'Elena Vance'), 'Best regards,');
  assert.equal(sanitizeCoverLetterSignOff('Warm regards,\nJohn Doe', ''), 'Warm regards,');
  assert.equal(sanitizeCoverLetterSignOff('Sincerely,', 'Elena Vance'), 'Sincerely,');
});
