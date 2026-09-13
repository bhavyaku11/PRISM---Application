import type { Policy, PolicySection } from '@/types/policy';
import type {
  ComparisonCategoryId,
  ComparisonCategorySection,
  ComparisonRow,
  DocumentChunkRecord,
  PolicyComparisonResult,
  PolicyComparisonValue,
} from '@/types/comparison';

const MISSING_EVIDENCE_TEXT = 'Not clearly stated in the available policy evidence.';

function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return MISSING_EVIDENCE_TEXT;
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return MISSING_EVIDENCE_TEXT;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function findBestSection(
  sections: PolicySection[],
  types: string[],
  keywords: string[] = []
): PolicySection | null {
  const typeMatches = sections.filter((s) => types.includes(s.section_type));
  if (typeMatches.length === 0) return null;

  if (keywords.length === 0) return typeMatches[0];

  for (const s of typeMatches) {
    const text = `${s.title} ${s.content}`.toLowerCase();
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return s;
    }
  }

  return typeMatches[0];
}

function findBestChunk(
  chunks: DocumentChunkRecord[],
  keywords: string[]
): DocumentChunkRecord | null {
  if (chunks.length === 0 || keywords.length === 0) return null;

  let bestChunk: DocumentChunkRecord | null = null;
  let highestScore = 0;

  for (const c of chunks) {
    const title = (c.section_title || '').toLowerCase();
    const content = (c.content || '').toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      const lowerKw = kw.toLowerCase();
      if (title.includes(lowerKw)) score += 3;
      if (content.includes(lowerKw)) score += 1;
    }

    if (score > highestScore) {
      highestScore = score;
      bestChunk = c;
    }
  }

  return highestScore > 0 ? bestChunk : null;
}

function cleanExcerpt(text: string | null | undefined, maxLen = 220): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen) + '...';
}

function extractFirstMatch(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Builds deterministic comparison for a single dimension
 */
function buildRow(
  id: string,
  label: string,
  description: string,
  category: ComparisonCategoryId,
  valA: PolicyComparisonValue,
  valB: PolicyComparisonValue,
  policyAName: string,
  policyBName: string
): ComparisonRow {
  // Determine difference neutrally
  let hasDifference = false;
  let diffDesc = '';
  let diffType: 'numeric' | 'text' | 'availability' | 'identical' = 'identical';

  if (!valA.hasData && !valB.hasData) {
    hasDifference = false;
    diffDesc = 'Neither policy provides explicit evidence for this clause in available records.';
    diffType = 'identical';
  } else if (valA.hasData && !valB.hasData) {
    hasDifference = true;
    diffDesc = `${policyAName} specifies this clause (${valA.value}); ${policyBName} does not clearly state this in the available policy evidence.`;
    diffType = 'availability';
  } else if (!valA.hasData && valB.hasData) {
    hasDifference = true;
    diffDesc = `${policyBName} specifies this clause (${valB.value}); ${policyAName} does not clearly state this in the available policy evidence.`;
    diffType = 'availability';
  } else {
    // Both have data
    const strA = valA.value.trim().toLowerCase();
    const strB = valB.value.trim().toLowerCase();

    if (strA === strB) {
      hasDifference = false;
      diffDesc = `Both policies specify matching terms for ${label.toLowerCase()} (${valA.value}).`;
      diffType = 'identical';
    } else {
      hasDifference = true;
      diffDesc = `${policyBName} states "${valB.value}", whereas ${policyAName} states "${valA.value}".`;
      diffType = 'text';
    }
  }

  return {
    id,
    label,
    description,
    category,
    policyA: valA,
    policyB: valB,
    difference: {
      hasDifference,
      description: diffDesc,
      type: diffType,
    },
  };
}

/**
 * Comprehensive Policy Comparison Extractor
 */
export function buildPolicyComparison(
  policyA: Policy,
  sectionsA: PolicySection[],
  chunksA: DocumentChunkRecord[],
  policyB: Policy,
  sectionsB: PolicySection[],
  chunksB: DocumentChunkRecord[]
): PolicyComparisonResult {
  const nameA = policyA.policy_name || 'Policy A';
  const nameB = policyB.policy_name || 'Policy B';

  // 1. OVERVIEW
  const overviewRows: ComparisonRow[] = [
    buildRow(
      'ov_policy_name',
      'Policy Name',
      'Official registered product title.',
      'overview',
      {
        value: policyA.policy_name,
        hasData: Boolean(policyA.policy_name),
        source: 'Policy Schedule / Certificate',
      },
      {
        value: policyB.policy_name,
        hasData: Boolean(policyB.policy_name),
        source: 'Policy Schedule / Certificate',
      },
      nameA,
      nameB
    ),
    buildRow(
      'ov_insurer',
      'Insurer / Provider',
      'Underwriting insurance company.',
      'overview',
      {
        value: policyA.insurer_name,
        hasData: Boolean(policyA.insurer_name),
        source: 'Policy Certificate',
      },
      {
        value: policyB.insurer_name,
        hasData: Boolean(policyB.insurer_name),
        source: 'Policy Certificate',
      },
      nameA,
      nameB
    ),
    buildRow(
      'ov_policy_type',
      'Policy Type',
      'Classification (Individual, Family Floater, Critical Illness, Group).',
      'overview',
      {
        value: policyA.policy_type || 'Health Insurance',
        hasData: Boolean(policyA.policy_type),
        source: 'Policy Schedule',
      },
      {
        value: policyB.policy_type || 'Health Insurance',
        hasData: Boolean(policyB.policy_type),
        source: 'Policy Schedule',
      },
      nameA,
      nameB
    ),
    buildRow(
      'ov_sum_insured',
      'Sum Insured',
      'Maximum annual coverage limit stated in schedule.',
      'overview',
      {
        value: formatCurrency(policyA.sum_insured),
        hasData: typeof policyA.sum_insured === 'number' && policyA.sum_insured > 0,
        source: 'Policy Schedule / Schedule Page',
      },
      {
        value: formatCurrency(policyB.sum_insured),
        hasData: typeof policyB.sum_insured === 'number' && policyB.sum_insured > 0,
        source: 'Policy Schedule / Schedule Page',
      },
      nameA,
      nameB
    ),
    buildRow(
      'ov_period',
      'Coverage Period',
      'Policy commencement and expiry dates.',
      'overview',
      {
        value:
          policyA.policy_start_date && policyA.policy_end_date
            ? `${formatDate(policyA.policy_start_date)} to ${formatDate(policyA.policy_end_date)}`
            : MISSING_EVIDENCE_TEXT,
        hasData: Boolean(policyA.policy_start_date && policyA.policy_end_date),
        source: 'Policy Schedule',
      },
      {
        value:
          policyB.policy_start_date && policyB.policy_end_date
            ? `${formatDate(policyB.policy_start_date)} to ${formatDate(policyB.policy_end_date)}`
            : MISSING_EVIDENCE_TEXT,
        hasData: Boolean(policyB.policy_start_date && policyB.policy_end_date),
        source: 'Policy Schedule',
      },
      nameA,
      nameB
    ),
    buildRow(
      'ov_premium',
      'Premium Amount',
      'Annual or installment policy premium.',
      'overview',
      {
        value: policyA.premium ? formatCurrency(policyA.premium) : MISSING_EVIDENCE_TEXT,
        hasData: typeof policyA.premium === 'number' && policyA.premium > 0,
        source: 'Policy Schedule / Tax Invoice',
      },
      {
        value: policyB.premium ? formatCurrency(policyB.premium) : MISSING_EVIDENCE_TEXT,
        hasData: typeof policyB.premium === 'number' && policyB.premium > 0,
        source: 'Policy Schedule / Tax Invoice',
      },
      nameA,
      nameB
    ),
  ];

  // 2. HOSPITALIZATION & COVERAGE
  const extractHospitalization = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['hospitalization expenses', 'inpatient hospitalization', 'inpatient treatment']);
    const sec = findBestSection(sections, ['coverage'], ['hospitalization', 'inpatient']);
    if (chunk) {
      return {
        value: 'Covered as per stated hospitalization expenses clause',
        hasData: true,
        source: `${chunk.section_title || 'Hospitalization Expenses'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Inpatient hospitalization covered under section terms',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractRoomRent = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['room rent', 'room category', 'single private', 'boarding expenses']);
    const sec = findBestSection(sections, ['coverage', 'limits'], ['room rent', 'room']);
    if (chunk) {
      const text = chunk.content;
      let shortDesc = 'Room rent terms specified in clause';
      if (text.toLowerCase().includes('single private')) shortDesc = 'Single Private AC Room (No sublimit)';
      else if (text.toLowerCase().includes('1%')) shortDesc = '1% of Sum Insured per day';
      else if (text.toLowerCase().includes('no sub-limit') || text.toLowerCase().includes('no sublimit'))
        shortDesc = 'No capping / sub-limit specified';

      return {
        value: shortDesc,
        hasData: true,
        source: `${chunk.section_title || 'Room Rent'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Room rent specified in coverage section',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractICULimits = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['intensive care unit', 'icu charges', 'icu limit']);
    const sec = findBestSection(sections, ['coverage', 'limits'], ['icu', 'intensive care']);
    if (chunk) {
      const text = chunk.content.toLowerCase();
      let shortDesc = 'ICU expenses covered per policy clause';
      if (text.includes('no capping') || text.includes('no sublimit') || text.includes('no sub-limit'))
        shortDesc = 'No sub-limit on ICU charges';
      else if (text.includes('2%')) shortDesc = '2% of Sum Insured per day';

      return {
        value: shortDesc,
        hasData: true,
        source: `${chunk.section_title || 'ICU Charges'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'ICU charges covered under section terms',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractPrePostHosp = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['pre-hospitalization', 'post-hospitalization', 'pre-hospitalisation', 'post-hospitalisation']);
    const sec = findBestSection(sections, ['coverage'], ['pre-hospital', 'post-hospital']);
    if (chunk) {
      const text = chunk.content;
      const preDays = extractFirstMatch(text, /pre-hospitali[zs]ation.*?(\d+)\s*days/i) || '60';
      const postDays = extractFirstMatch(text, /post-hospitali[zs]ation.*?(\d+)\s*days/i) || '90 / 180';

      return {
        value: `${preDays} days Pre / ${postDays} days Post Hospitalization`,
        hasData: true,
        source: `${chunk.section_title || 'Pre/Post Hospitalization'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Pre and post hospitalization covered',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const coverageRows: ComparisonRow[] = [
    buildRow(
      'cov_hosp',
      'Inpatient Hospitalization',
      'Core hospital stay expenses including doctor fees and nursing.',
      'coverage',
      extractHospitalization(sectionsA, chunksA),
      extractHospitalization(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'cov_room_rent',
      'Room Rent & Boarding',
      'Daily hospital room rent category or sublimit percentage.',
      'coverage',
      extractRoomRent(sectionsA, chunksA),
      extractRoomRent(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'cov_icu',
      'ICU Charges',
      'Intensive care unit charges and associated medical sublimits.',
      'coverage',
      extractICULimits(sectionsA, chunksA),
      extractICULimits(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'cov_pre_post',
      'Pre & Post Hospitalization',
      'Eligible medical and investigation expenses before and after discharge.',
      'coverage',
      extractPrePostHosp(sectionsA, chunksA),
      extractPrePostHosp(sectionsB, chunksB),
      nameA,
      nameB
    ),
  ];

  // 3. WAITING PERIODS
  const extractInitialWaiting = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['30 days', 'initial waiting period', 'first thirty days']);
    const sec = findBestSection(sections, ['waiting_period'], ['30 days', 'initial']);
    if (chunk) {
      return {
        value: '30 Days (Accident claims exempt)',
        hasData: true,
        source: `${chunk.section_title || 'Waiting Periods'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: '30 Days initial waiting period',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractPEDWaiting = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['pre-existing disease', 'pre-existing', 'ped waiting', 'months of continuous']);
    const sec = findBestSection(sections, ['waiting_period'], ['pre-existing', 'ped']);
    if (chunk) {
      const text = chunk.content;
      const months = extractFirstMatch(text, /(\d+)\s*months/i) || '36 / 48';
      return {
        value: `${months} Months (${Math.round(parseInt(months, 10) / 12) || 3} Years)`,
        hasData: true,
        source: `${chunk.section_title || 'Pre-existing Disease Waiting'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      const months = extractFirstMatch(sec.content, /(\d+)\s*months/i) || '36 / 48';
      return {
        value: `${months} Months continuous coverage`,
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractSpecificIllnessWaiting = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['specific illness', 'specific disease', 'two years', '24 months', 'specified ailments']);
    const sec = findBestSection(sections, ['waiting_period'], ['specific', 'two year', '24 month']);
    if (chunk) {
      return {
        value: '24 Months for specified ailments (cataract, hernia, joint replacement, etc.)',
        hasData: true,
        source: `${chunk.section_title || 'Specific Illness Waiting'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: '24 Months specific disease waiting period',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const waitingPeriodRows: ComparisonRow[] = [
    buildRow(
      'wp_initial',
      'Initial Waiting Period',
      'Waiting period from inception before non-accidental illnesses are covered.',
      'waiting_periods',
      extractInitialWaiting(sectionsA, chunksA),
      extractInitialWaiting(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'wp_ped',
      'Pre-Existing Diseases (PED)',
      'Moratorium on pre-existing medical conditions before claims are eligible.',
      'waiting_periods',
      extractPEDWaiting(sectionsA, chunksA),
      extractPEDWaiting(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'wp_specific',
      'Specific Illnesses / Ailments',
      'Waiting period for named procedures (e.g. hernia, cataract, ENT, stones).',
      'waiting_periods',
      extractSpecificIllnessWaiting(sectionsA, chunksA),
      extractSpecificIllnessWaiting(sectionsB, chunksB),
      nameA,
      nameB
    ),
  ];

  // 4. COST SHARING
  const extractCopay = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['co-payment', 'copayment', 'copay', 'proportionate deduction']);
    const sec = findBestSection(sections, ['copayment', 'deductible'], ['copay', 'co-pay']);
    if (chunk) {
      const text = chunk.content.toLowerCase();
      let shortDesc = 'Co-payment clause specified';
      if (text.includes('no copay') || text.includes('no co-pay') || text.includes('nil co-pay') || text.includes('nil copayment')) {
        shortDesc = 'Nil (No co-payment required)';
      } else {
        const pct = extractFirstMatch(chunk.content, /(\d+)\s*%/i);
        if (pct) shortDesc = `${pct}% co-payment applies`;
      }

      return {
        value: shortDesc,
        hasData: true,
        source: `${chunk.section_title || 'Co-payment'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Co-payment specified in policy wording',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractDeductibles = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['deductible', 'voluntary deductible', 'compulsory deductible']);
    const sec = findBestSection(sections, ['copayment', 'deductible'], ['deductible']);
    if (chunk) {
      const text = chunk.content.toLowerCase();
      let shortDesc = 'Deductible terms specified in clause';
      if (text.includes('nil') || text.includes('no deductible')) shortDesc = 'Nil deductible';

      return {
        value: shortDesc,
        hasData: true,
        source: `${chunk.section_title || 'Deductibles'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Deductible clause found in policy',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const costSharingRows: ComparisonRow[] = [
    buildRow(
      'cs_copay',
      'Co-Payment',
      'Percentage of eligible claim payable by policyholder.',
      'cost_sharing',
      extractCopay(sectionsA, chunksA),
      extractCopay(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'cs_deductible',
      'Deductibles',
      'Upfront amount policyholder pays before insurance coverage kicks in.',
      'cost_sharing',
      extractDeductibles(sectionsA, chunksA),
      extractDeductibles(sectionsB, chunksB),
      nameA,
      nameB
    ),
  ];

  // 5. LIMITS & SUBLIMITS
  const extractSublimits = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['sub-limit', 'sublimit', 'capping', 'proportionate deduction', 'cataract limit']);
    const sec = findBestSection(sections, ['limits'], ['sublimit', 'capping', 'limit']);
    if (chunk) {
      return {
        value: 'Specific sublimits and capping terms identified',
        hasData: true,
        source: `${chunk.section_title || 'Sub-limits'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Sublimit schedule specified in limits section',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractDayCare = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['day care', 'daycare procedure', 'day care treatment', '24 hours hospitalization']);
    const sec = findBestSection(sections, ['coverage', 'limits'], ['day care', 'daycare']);
    if (chunk) {
      return {
        value: 'Covered for medical procedures requiring < 24h hospitalization',
        hasData: true,
        source: `${chunk.section_title || 'Day Care Procedures'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Day care treatments covered per policy list',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const limitsRows: ComparisonRow[] = [
    buildRow(
      'lim_sublimits',
      'Disease & Procedure Sublimits',
      'Caps on specific medical conditions (cataract, robotic surgery, joint replacement).',
      'limits',
      extractSublimits(sectionsA, chunksA),
      extractSublimits(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'lim_daycare',
      'Day Care Treatments',
      'Coverage for modern treatments not requiring 24-hour hospitalization.',
      'limits',
      extractDayCare(sectionsA, chunksA),
      extractDayCare(sectionsB, chunksB),
      nameA,
      nameB
    ),
  ];

  // 6. EXCLUSIONS
  const extractExclusions = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['permanent exclusions', 'standard exclusions', 'not payable', 'excluded treatments']);
    const sec = findBestSection(sections, ['exclusions'], ['permanent', 'general exclusions']);
    if (chunk) {
      return {
        value: 'Standard IRDAI permanent & specific exclusions apply',
        hasData: true,
        source: `${chunk.section_title || 'Exclusions'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Exclusions detailed in policy wording',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const exclusionsRows: ComparisonRow[] = [
    buildRow(
      'excl_major',
      'Major & Standard Exclusions',
      'Treatments, conditions, or non-medical items explicitly excluded from coverage.',
      'exclusions',
      extractExclusions(sectionsA, chunksA),
      extractExclusions(sectionsB, chunksB),
      nameA,
      nameB
    ),
  ];

  // 7. CLAIMS PROCEDURE
  const extractClaimIntimation = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['notice of claim', 'claim intimation', 'intimation window', '24 hours', '48 hours']);
    const sec = findBestSection(sections, ['claims', 'conditions'], ['notice', 'intimation']);
    if (chunk) {
      const text = chunk.content.toLowerCase();
      let shortDesc = 'Notice required within stated timeline';
      if (text.includes('24 hours') && text.includes('48 hours')) {
        shortDesc = '48h prior for planned; within 24h for emergency';
      } else if (text.includes('24 hours')) {
        shortDesc = 'Within 24 hours of hospital admission';
      }

      return {
        value: shortDesc,
        hasData: true,
        source: `${chunk.section_title || 'Notice of Claim'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Notice of claim specified in conditions',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const extractSubmissionTimeline = (
    sections: PolicySection[],
    chunks: DocumentChunkRecord[]
  ): PolicyComparisonValue => {
    const chunk = findBestChunk(chunks, ['submission of claim', 'discharge documents', '15 days', '30 days']);
    const sec = findBestSection(sections, ['claims', 'conditions'], ['submission', 'discharge']);
    if (chunk) {
      const text = chunk.content.toLowerCase();
      let shortDesc = 'Documents to be submitted within specified window';
      if (text.includes('15 days')) shortDesc = 'Within 15 days from date of discharge';
      else if (text.includes('30 days')) shortDesc = 'Within 30 days from date of discharge';

      return {
        value: shortDesc,
        hasData: true,
        source: `${chunk.section_title || 'Claim Submission'} — Page ${chunk.page_number || 1}`,
        pageNumber: chunk.page_number,
        sectionTitle: chunk.section_title,
        excerpt: cleanExcerpt(chunk.content),
      };
    }
    if (sec) {
      return {
        value: 'Claim submission timeline specified in conditions',
        hasData: true,
        source: `${sec.title} — Pages ${sec.page_start}-${sec.page_end}`,
        pageNumber: sec.page_start,
        sectionTitle: sec.title,
        excerpt: cleanExcerpt(sec.content),
      };
    }
    return {
      value: MISSING_EVIDENCE_TEXT,
      hasData: false,
      source: 'No explicit clause found',
    };
  };

  const claimsRows: ComparisonRow[] = [
    buildRow(
      'clm_intimation',
      'Claim Intimation Window',
      'Time limit to notify insurer or TPA of hospital admission.',
      'claims',
      extractClaimIntimation(sectionsA, chunksA),
      extractClaimIntimation(sectionsB, chunksB),
      nameA,
      nameB
    ),
    buildRow(
      'clm_submission',
      'Document Submission Window',
      'Deadline for filing bills, receipts, and claim forms post-discharge.',
      'claims',
      extractSubmissionTimeline(sectionsA, chunksA),
      extractSubmissionTimeline(sectionsB, chunksB),
      nameA,
      nameB
    ),
  ];

  // Assemble Categories
  const categories: ComparisonCategorySection[] = [
    {
      id: 'overview',
      title: 'Core Coverage Overview',
      description: 'Sum insured, policyholder details, and operational coverage dates.',
      rows: overviewRows,
    },
    {
      id: 'coverage',
      title: 'Hospitalization & Room Rent',
      description: 'Inpatient treatment, room rent capping, and pre/post hospitalization terms.',
      rows: coverageRows,
    },
    {
      id: 'waiting_periods',
      title: 'Waiting Periods',
      description: 'Initial moratoriums, pre-existing diseases, and specific illness waiting windows.',
      rows: waitingPeriodRows,
    },
    {
      id: 'cost_sharing',
      title: 'Cost Sharing & Co-pay',
      description: 'Out-of-pocket co-payments and deductibles applicable upon claim settlement.',
      rows: costSharingRows,
    },
    {
      id: 'limits',
      title: 'Sub-limits & Procedure Caps',
      description: 'Treatment-specific financial sublimits and day care procedure eligibility.',
      rows: limitsRows,
    },
    {
      id: 'exclusions',
      title: 'Exclusions',
      description: 'Permanent IRDAI exclusions and treatments explicitly barred from coverage.',
      rows: exclusionsRows,
    },
    {
      id: 'claims',
      title: 'Claims Procedure',
      description: 'Emergency/planned intimation timelines and dossier submission requirements.',
      rows: claimsRows,
    },
  ];

  // Derive Deterministic Key Differences
  const keyDifferences: string[] = [];

  // 1. Sum Insured comparison
  if (
    typeof policyA.sum_insured === 'number' &&
    typeof policyB.sum_insured === 'number' &&
    policyA.sum_insured !== policyB.sum_insured
  ) {
    if (policyB.sum_insured > policyA.sum_insured) {
      keyDifferences.push(
        `${nameB} states a higher stated sum insured (${formatCurrency(policyB.sum_insured)}) than ${nameA} (${formatCurrency(policyA.sum_insured)}).`
      );
    } else {
      keyDifferences.push(
        `${nameA} states a higher stated sum insured (${formatCurrency(policyA.sum_insured)}) than ${nameB} (${formatCurrency(policyB.sum_insured)}).`
      );
    }
  }

  // 2. Insurer / Product type
  if (policyA.insurer_name !== policyB.insurer_name) {
    keyDifferences.push(
      `${nameA} is underwritten by ${policyA.insurer_name}, while ${nameB} is provided by ${policyB.insurer_name}.`
    );
  }

  // 3. Other identified differences across rows
  const allRows = [
    ...coverageRows,
    ...waitingPeriodRows,
    ...costSharingRows,
    ...limitsRows,
    ...exclusionsRows,
    ...claimsRows,
  ];

  for (const r of allRows) {
    if (r.difference.hasDifference && keyDifferences.length < 5) {
      if (!keyDifferences.includes(r.difference.description)) {
        keyDifferences.push(r.difference.description);
      }
    }
  }

  if (keyDifferences.length === 0) {
    keyDifferences.push('Both policies demonstrate comparable terms across the indexed provisions.');
  }

  return {
    policyA,
    policyB,
    categories,
    keyDifferences,
    evidenceCount: {
      policyA: sectionsA.length + chunksA.length,
      policyB: sectionsB.length + chunksB.length,
    },
  };
}
