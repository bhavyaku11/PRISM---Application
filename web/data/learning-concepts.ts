import type { LearningConcept, LearningCategory } from '@/types/learning';

export interface CategoryInfo {
  id: LearningCategory;
  label: string;
  description: string;
}

export const LEARNING_CATEGORIES: CategoryInfo[] = [
  {
    id: 'coverage',
    label: 'Coverage Basics',
    description: 'Fundamental principles of what your health policy protects and excludes.',
  },
  {
    id: 'costs_limits',
    label: 'Costs & Limits',
    description: 'Out-of-pocket responsibilities, co-payments, room caps, and sub-limits.',
  },
  {
    id: 'waiting_periods',
    label: 'Waiting Periods',
    description: 'Mandatory moratoriums before specific medical benefits become payable.',
  },
  {
    id: 'claims',
    label: 'Claims & Hospitals',
    description: 'Cashless processing, reimbursement filings, network hospitals, and intimations.',
  },
  {
    id: 'policy_mgmt',
    label: 'Policy Management',
    description: 'Annual renewals, free-look cancellation periods, and portability rights.',
  },
];

export const LEARNING_CONCEPTS: LearningConcept[] = [
  {
    id: 'sum_insured',
    slug: 'sum-insured',
    title: 'Sum Insured',
    category: 'coverage',
    categoryLabel: 'Coverage Basics',
    shortDescription:
      'The maximum total amount your insurance company will pay for covered medical expenses during a single policy year.',
    whatIsIt:
      'Sum Insured is the upper financial limit of coverage guaranteed by your insurer in a policy year. Any covered hospitalization costs up to this amount can be settled by the insurer according to policy terms. If total treatment bills exceed this amount, you are typically responsible for paying the excess unless your policy has an active recharge or restoration benefit.',
    whyItMatters:
      'Choosing an adequate Sum Insured protects against escalating healthcare inflation, multi-day ICU stays, or major surgeries. Knowing your exact Sum Insured helps you gauge whether a high-cost hospital stay will be fully protected.',
    example: {
      scenario:
        'Assume you hold a policy with a Sum Insured of ₹10,00,000. You undergo a planned surgery with an approved hospital bill of ₹4,50,000.',
      calculation:
        'The insurer settles ₹4,50,000 (subject to deductibles/sub-limits), leaving ₹5,50,000 in available Sum Insured for the remainder of the policy year.',
    },
    readTime: '3 min read',
    difficulty: 'essential',
    iconName: 'Shield',
    featured: true,
    searchKeywords: ['sum insured', 'coverage limit', 'maximum coverage', 'financial limit', 'si', 'annual limit'],
    retrievalQuery: 'sum insured maximum limit of indemnity schedule of insurance annual coverage amount',
    suggestedQuestions: [
      'What is my total Sum Insured?',
      'Does my policy offer automatic restoration or recharge of Sum Insured?',
      'Is my Sum Insured shared or individual on this policy?',
    ],
  },
  {
    id: 'waiting_period',
    slug: 'waiting-period',
    title: 'Waiting Period',
    category: 'waiting_periods',
    categoryLabel: 'Waiting Periods',
    shortDescription:
      'A specified time duration after policy commencement during which specific illnesses or treatments are not yet covered.',
    whatIsIt:
      'A waiting period is a contractual clause stating that certain medical conditions or expenses will only be covered after a fixed number of days or months of continuous coverage. Indian health policies typically feature an initial 30-day waiting period (except for accidental injury), a 1 to 3-year specific illness waiting period, and pre-existing disease waiting periods.',
    whyItMatters:
      'Claims filed for illnesses contracted or treated during an applicable waiting period may be rejected. Understanding which waiting periods are active prevents unexpected out-of-pocket costs.',
    example: {
      scenario:
        'You purchase a new health policy on January 1. On January 20 (day 20), you are hospitalized for acute viral fever with a bill of ₹40,000.',
      calculation:
        'Because standard illness coverage requires a 30-day initial waiting period, this non-accidental claim would not be payable by the insurer.',
    },
    readTime: '4 min read',
    difficulty: 'essential',
    iconName: 'Clock',
    featured: true,
    searchKeywords: ['waiting period', 'initial waiting', 'moratorium', 'waiting time', 'cooling period', '30 days'],
    retrievalQuery: 'waiting period initial 30 days specific illness waiting periods moratorium exclusions',
    suggestedQuestions: [
      'What initial waiting periods apply to my policy?',
      'Which specific illnesses have a waiting period in my plan?',
      'Have my policy waiting periods been served?',
    ],
  },
  {
    id: 'pre_existing_disease',
    slug: 'pre-existing-disease',
    title: 'Pre-existing Disease (PED)',
    category: 'waiting_periods',
    categoryLabel: 'Waiting Periods',
    shortDescription:
      'Any medical condition, symptom, or ailment diagnosed or treated within 36 to 48 months prior to purchasing the policy.',
    whatIsIt:
      'A Pre-existing Disease (PED) is any medical condition, illness, or injury diagnosed by a physician or for which medical advice or treatment was received prior to the effective date of the policy. Per IRDAI regulations, PEDs are subject to a waiting period—commonly between 24 and 48 months—after which treatments for those specific conditions become eligible for coverage.',
    whyItMatters:
      'Accurate declaration of pre-existing health conditions during application is essential. Non-disclosure can lead to claim rejections or policy cancellation. Once the waiting period is served, full coverage for the condition is unlocked.',
    example: {
      scenario:
        'You have hypertension disclosed at policy inception with a 36-month PED waiting period. In month 18, you require hospitalization for a hypertension-related complication costing ₹1,20,000.',
      calculation:
        'Because the 36-month waiting period for this pre-existing condition has not yet completed, the claim is not payable. However, in month 37, treatment for this condition would become eligible.',
    },
    readTime: '4 min read',
    difficulty: 'intermediate',
    iconName: 'HeartPulse',
    featured: true,
    searchKeywords: ['ped', 'pre-existing', 'pre existing disease', 'prior illness', 'chronic condition', 'hypertension', 'diabetes'],
    retrievalQuery: 'pre-existing disease PED waiting period 24 months 36 months 48 months disclosed medical condition',
    suggestedQuestions: [
      'What is the pre-existing disease waiting period in my policy?',
      'Does my policy cover diabetes or hypertension after a waiting period?',
      'Are any pre-existing conditions permanently excluded?',
    ],
  },
  {
    id: 'copay',
    slug: 'co-pay',
    title: 'Co-pay',
    category: 'costs_limits',
    categoryLabel: 'Costs & Limits',
    shortDescription:
      'A predetermined percentage of approved medical expenses that you must pay out of pocket, while the insurer pays the rest.',
    whatIsIt:
      'Co-pay (co-payment) is a cost-sharing provision where you agree to pay a fixed percentage of each approved claim. For example, a 10% or 20% co-pay is common in senior citizen plans or when undergoing treatment in a tier-1 city with a zone-based policy. A co-pay does not reduce your total Sum Insured; it simply divides each claim bill between you and the insurer.',
    whyItMatters:
      'A policy with a mandatory co-pay requires you to contribute cash whenever you are hospitalized. Knowing your co-pay percentage lets you calculate your exact personal share before settling a hospital bill.',
    example: {
      scenario:
        'You have an approved hospitalization claim of ₹2,00,000 under a policy that specifies a mandatory 20% co-payment.',
      calculation:
        'You pay 20% (₹40,000) out of pocket, and the insurance company settles the remaining 80% (₹1,60,000).',
    },
    readTime: '3 min read',
    difficulty: 'essential',
    iconName: 'Receipt',
    featured: true,
    searchKeywords: ['co-pay', 'copay', 'copayment', 'cost sharing', 'percentage share', 'out of pocket'],
    retrievalQuery: 'co-pay copay copayment cost sharing percentage deduction senior citizen zone',
    suggestedQuestions: [
      'Does my policy contain a mandatory co-payment clause?',
      'Is there a zone-based co-pay if I get treated in a metro city?',
      'Are senior members on this policy subject to a higher co-pay?',
    ],
  },
  {
    id: 'deductible',
    slug: 'deductible',
    title: 'Deductible',
    category: 'costs_limits',
    categoryLabel: 'Costs & Limits',
    shortDescription:
      'A fixed rupee amount you must pay toward medical expenses before your insurance coverage begins contributing.',
    whatIsIt:
      'A deductible is a fixed financial threshold specified in your policy. Unlike a co-pay (which is a percentage of every claim), a deductible is a flat lump sum. In top-up or super top-up policies, the insurer only pays for eligible expenses that surpass the deductible threshold in a claim or policy year.',
    whyItMatters:
      'Deductibles are foundational to top-up and super top-up policies. If your claim is below the deductible threshold, the insurer pays ₹0. Many people use an employer policy to absorb the deductible amount before triggering their top-up.',
    example: {
      scenario:
        'You have a super top-up policy of ₹20,00,000 Sum Insured with a ₹3,00,000 deductible. You incur an eligible hospital bill of ₹7,50,000.',
      calculation:
        'You (or your primary corporate policy) cover the first ₹3,00,000 deductible. The super top-up policy settles the remaining ₹4,50,000.',
    },
    readTime: '3 min read',
    difficulty: 'intermediate',
    iconName: 'Receipt',
    featured: false,
    searchKeywords: ['deductible', 'top-up', 'super top up', 'threshold', 'out of pocket threshold', 'excess'],
    retrievalQuery: 'deductible top-up super top-up threshold aggregate deductible claim excess',
    suggestedQuestions: [
      'Does my policy have a deductible or excess amount?',
      'Is the deductible per claim or aggregate across the policy year?',
      'Can I use my corporate insurance to cover the deductible?',
    ],
  },
  {
    id: 'room_rent_limit',
    slug: 'room-rent-limit',
    title: 'Room Rent Limit',
    category: 'costs_limits',
    categoryLabel: 'Costs & Limits',
    shortDescription:
      'A cap on the daily hospital room charges your insurer will cover, often triggering proportionate deductions on medical bills if exceeded.',
    whatIsIt:
      'A room rent limit is a maximum daily allowance for your hospital room or suite (e.g. 1% of Sum Insured per day, or ₹5,000/day). If you opt for a room that costs more than this limit, the insurer may not only charge you the room difference, but also apply proportionate deductions across doctor consultation fees, nursing fees, and surgical charges linked to room categories.',
    whyItMatters:
      'Exceeding a room rent cap can lead to severe proportionate billing penalties, leaving you with substantial unexpected out-of-pocket hospital bills even if your overall Sum Insured has not been exhausted.',
    example: {
      scenario:
        'Your policy has a ₹5,00,000 Sum Insured with a 1% room rent limit (₹5,000/day). You choose a private room costing ₹10,000/day (double the limit).',
      calculation:
        'Because you picked a room twice your limit, the insurer may apply proportionate deductions, potentially settling only 50% of associated doctor and surgeon fees.',
    },
    readTime: '4 min read',
    difficulty: 'essential',
    iconName: 'Shield',
    featured: true,
    searchKeywords: ['room rent', 'room rent limit', 'room capping', 'proportionate deduction', 'room category', 'single private room'],
    retrievalQuery: 'room rent room category single private room proportionate deduction 1% sum insured capping',
    suggestedQuestions: [
      'What is the daily room rent limit on my policy?',
      'Does my policy have proportionate deduction if I choose a higher room category?',
      'Is a single private room covered without capping?',
    ],
  },
  {
    id: 'icu_limit',
    slug: 'icu-limit',
    title: 'ICU Limit',
    category: 'costs_limits',
    categoryLabel: 'Costs & Limits',
    shortDescription:
      'A daily financial ceiling on Intensive Care Unit (ICU) and Intensive Cardiac Care Unit (ICCU) room charges.',
    whatIsIt:
      'Similar to general room rent, an ICU limit establishes the maximum per-day amount your insurer will pay for intensive care or critical care monitoring. In many modern comprehensive health policies, ICU charges are covered with no sub-limits, whereas budget or basic policies often cap ICU charges at 2% of the Sum Insured per day.',
    whyItMatters:
      'ICU charges in tertiary and private hospitals can exceed ₹15,000 to ₹30,000 per day. Ensuring your policy does not impose an artificial ICU cap protects you during critical medical emergencies.',
    example: {
      scenario:
        'A patient spends 4 days in an ICU costing ₹20,000/day (total ₹80,000). The policy caps ICU charges at 2% of a ₹5,00,000 Sum Insured (₹10,00,00/day = ₹10,000/day).',
      calculation:
        'The insurer covers ₹10,000/day (total ₹40,000). The remaining ₹40,000 ICU charge must be paid directly by the patient.',
    },
    readTime: '3 min read',
    difficulty: 'intermediate',
    iconName: 'HeartPulse',
    featured: false,
    searchKeywords: ['icu', 'icu limit', 'intensive care', 'iccu', 'critical care cap', 'icu charges'],
    retrievalQuery: 'intensive care unit ICU limit ICCU daily capping actual expenses critical care',
    suggestedQuestions: [
      'Does my policy place a daily cap on ICU charges?',
      'Are monitoring and ventilator charges covered under ICU benefits?',
      'What is the maximum number of ICU days covered?',
    ],
  },
  {
    id: 'sub_limit',
    slug: 'sub-limit',
    title: 'Sub-limit',
    category: 'costs_limits',
    categoryLabel: 'Costs & Limits',
    shortDescription:
      'A specific monetary cap on the payout for a particular treatment, surgery, or medical procedure regardless of your total Sum Insured.',
    whatIsIt:
      'A sub-limit is a predefined ceiling placed on specific treatments, modern medical procedures, or illnesses. Common sub-limits include caps on cataract surgery (e.g., ₹40,000 per eye), joint replacements, kidney stone treatments, or hernia repairs. Even if your overall Sum Insured is ₹20,00,000, a sub-limit caps the insurer payout for that specific condition.',
    whyItMatters:
      'Sub-limits prevent the full Sum Insured from being utilized for certain common elective surgeries. Knowing your sub-limits prevents hospital billing surprises during discharge.',
    example: {
      scenario:
        'You have a ₹15,00,000 Sum Insured, but your policy has a ₹35,000 sub-limit for cataract surgery. You undergo laser cataract surgery costing ₹70,000.',
      calculation:
        'The insurer will reimburse a maximum of ₹35,000 due to the sub-limit. You must pay the remaining ₹35,000 out of pocket.',
    },
    readTime: '3 min read',
    difficulty: 'intermediate',
    iconName: 'Receipt',
    featured: false,
    searchKeywords: ['sub-limit', 'sublimit', 'procedure cap', 'cataract limit', 'joint replacement cap', 'treatment cap'],
    retrievalQuery: 'sub-limit sublimit specific ailment cataract joint replacement robotic surgery limit',
    suggestedQuestions: [
      'Are there sub-limits on cataract or joint replacement in my policy?',
      'Does my policy cap modern or robotic treatments?',
      'Which medical conditions have financial sub-limits on my plan?',
    ],
  },
  {
    id: 'exclusions',
    slug: 'exclusions',
    title: 'Exclusions',
    category: 'coverage',
    categoryLabel: 'Coverage Basics',
    shortDescription:
      'Specific medical conditions, treatments, supplies, or circumstances that your health insurance policy will not pay for under any circumstance.',
    whatIsIt:
      'Exclusions are contractual terms specifying medical treatments and non-medical costs that the policy does not cover. Standard permanent exclusions typically include cosmetic surgeries, unproven or experimental treatments, self-inflicted injuries, and non-medical consumables (gloves, PPE kits, admission charges) unless a specific consumable rider is attached.',
    whyItMatters:
      'Reviewing exclusions helps you avoid false assumptions about coverage. Disallowances on non-medical items (consumables) represent one of the most common causes of out-of-pocket costs in hospital bills.',
    example: {
      scenario:
        'Your total hospital bill is ₹1,00,000, which includes ₹12,000 for administrative kits, thermometer probes, and surgical gloves categorized as non-payable consumables.',
      calculation:
        'The insurer excludes the ₹12,000 in non-medical consumables, settling the approved medical expenses of ₹88,000 (subject to policy conditions).',
    },
    readTime: '4 min read',
    difficulty: 'essential',
    iconName: 'AlertTriangle',
    featured: false,
    searchKeywords: ['exclusions', 'permanent exclusions', 'non-payable items', 'consumables', 'not covered', 'uncovered treatments'],
    retrievalQuery: 'general exclusions permanent exclusions non-payable items cosmetic experimental consumables',
    suggestedQuestions: [
      'What are the major permanent exclusions in my policy?',
      'Does my policy cover hospital consumables and PPE charges?',
      'Are alternative treatments like AYUSH covered or excluded?',
    ],
  },
  {
    id: 'cashless_hospitalization',
    slug: 'cashless-hospitalization',
    title: 'Cashless Hospitalization',
    category: 'claims',
    categoryLabel: 'Claims & Hospitals',
    shortDescription:
      'A claim settlement method where the insurance company or Third Party Administrator (TPA) pays the hospital directly on your behalf.',
    whatIsIt:
      'Cashless hospitalization allows you to receive medical care at an empanelled network hospital without paying the approved medical bills up front. The hospital coordinates pre-authorization with your insurer or TPA. Upon approval, the insurer directly settles the eligible expenses with the hospital, and you only pay for non-covered items, co-pays, or room rent differentials.',
    whyItMatters:
      'Cashless treatment eliminates the stressful burden of liquidating savings or arranging emergency cash during medical admissions. It requires pre-authorization before planned treatment or within 24–48 hours of emergency admission.',
    example: {
      scenario:
        'You are admitted to a network hospital for an approved gallbladder surgery costing ₹1,50,000. Your policy has no co-pay or sub-limits.',
      calculation:
        'The hospital sends pre-authorization; the insurer approves and pays ₹1,45,000 directly. You pay ₹5,000 for non-medical personal items upon discharge.',
    },
    readTime: '4 min read',
    difficulty: 'essential',
    iconName: 'CheckCircle',
    featured: true,
    searchKeywords: ['cashless', 'cashless claim', 'pre-authorization', 'tpa settlement', 'direct settlement', 'network admission'],
    retrievalQuery: 'cashless hospitalization pre-authorization approval network hospital TPA direct settlement',
    suggestedQuestions: [
      'How does the cashless pre-authorization process work for my policy?',
      'What is the intimation deadline for emergency cashless admissions?',
      'Who is the Third Party Administrator (TPA) for my policy?',
    ],
  },
  {
    id: 'reimbursement_claim',
    slug: 'reimbursement-claim',
    title: 'Reimbursement Claim',
    category: 'claims',
    categoryLabel: 'Claims & Hospitals',
    shortDescription:
      'A claim process where you pay hospital bills directly and subsequently submit documents to the insurer for reimbursement.',
    whatIsIt:
      'A reimbursement claim is required when you undergo treatment at a non-network hospital, or when cashless pre-authorization is unavailable or denied without prejudice to policy terms. You settle the full hospital invoice yourself, obtain the discharge summary and original payment receipts, and submit a formal claim dossier to the insurer within the policy timeline (commonly 15 to 30 days).',
    whyItMatters:
      'Understanding reimbursement guidelines ensures you preserve all necessary medical evidence—such as pharmacy doctor prescriptions, itemized breakups, and lab test reports—required for a successful audit and payout.',
    example: {
      scenario:
        'You are admitted in an emergency at a non-network facility and pay ₹90,000 at discharge. You submit original bills and reports within 15 days.',
      calculation:
        'The insurer audits the documentation and deposits ₹85,000 directly into your bank account after deducting ₹5,000 in non-payable administrative charges.',
    },
    readTime: '4 min read',
    difficulty: 'intermediate',
    iconName: 'FileText',
    featured: false,
    searchKeywords: ['reimbursement', 'claim filing', 'document submission', 'non-network claim', 'claim payout', 'discharge summary'],
    retrievalQuery: 'reimbursement claim document submission timeline 15 days 30 days discharge summary original bills',
    suggestedQuestions: [
      'What is the submission deadline for filing a reimbursement claim?',
      'Which original documents are mandatory for reimbursement in my policy?',
      'Can I file for pre and post hospitalization expenses via reimbursement?',
    ],
  },
  {
    id: 'network_hospital',
    slug: 'network-hospital',
    title: 'Network Hospital',
    category: 'claims',
    categoryLabel: 'Claims & Hospitals',
    shortDescription:
      'A healthcare facility that has a formal contractual agreement with your insurer or TPA to provide cashless medical services.',
    whatIsIt:
      'A network hospital is a hospital, clinic, or day-care center that has partnered with your insurer or Third-Party Administrator (TPA). Because of pre-negotiated tariff rates and electronic claim gateways, network hospitals can offer cashless admissions. Treatment at non-network hospitals generally requires upfront payment and a subsequent reimbursement claim.',
    whyItMatters:
      'Checking whether preferred hospitals in your neighborhood are in your insurer\'s active network allows for smooth, stress-free cashless admissions when medical needs arise.',
    example: {
      scenario:
        'Hospital A is on your insurer\'s active network list; Hospital B is non-network. You need planned knee surgery costing ₹2,20,000.',
      calculation:
        'At Hospital A, you can use cashless pre-authorization with zero upfront hospital fee. At Hospital B, you must pay ₹2,20,000 upfront and file for reimbursement.',
    },
    readTime: '3 min read',
    difficulty: 'essential',
    iconName: 'HeartPulse',
    featured: false,
    searchKeywords: ['network hospital', 'empanelled hospital', 'preferred provider', 'hospital list', 'cashless hospital', 'tpa network'],
    retrievalQuery: 'network hospital provider network cashless empanelled hospital list preferred provider',
    suggestedQuestions: [
      'How do I verify if a hospital is in my policy\'s cashless network?',
      'Does my policy cover treatments in non-network hospitals?',
      'Are there zone restrictions on hospital networks in my plan?',
    ],
  },
  {
    id: 'claim_intimation',
    slug: 'claim-intimation',
    title: 'Claim Intimation',
    category: 'claims',
    categoryLabel: 'Claims & Hospitals',
    shortDescription:
      'The formal initial notification sent to your insurer or TPA informing them of an upcoming or emergency hospital admission.',
    whatIsIt:
      'Claim intimation is the first mandatory communication step in filing a health claim. Policy terms stipulate a strict timeline: for planned hospitalizations, intimation must usually be given 48 to 72 hours prior to admission; for emergency hospitalizations, notice is generally required within 24 to 48 hours of admission. Failure to intimate on time can delay pre-authorization or complicate reimbursement claims.',
    whyItMatters:
      'Timely intimation initiates the case file in the insurer\'s system, assigns a reference number, and alerts the medical audit team to begin pre-authorization without delays.',
    example: {
      scenario:
        'An emergency admission occurs at 10:00 PM on Friday. The policy requires intimation within 24 hours of emergency admission.',
      calculation:
        'Notifying the TPA or insurer\'s toll-free line by Saturday 10:00 PM satisfies the intimation requirement and generates a claim reference number.',
    },
    readTime: '3 min read',
    difficulty: 'intermediate',
    iconName: 'FileText',
    featured: false,
    searchKeywords: ['claim intimation', 'notice of claim', 'emergency intimation', 'admission notice', 'intimation window', 'notification'],
    retrievalQuery: 'claim intimation notice of claim emergency hospitalization 24 hours 48 hours planned admission',
    suggestedQuestions: [
      'What is the required notice timeline for emergency hospitalizations?',
      'How much advance notice is required for planned surgeries in my policy?',
      'What information is needed to intimate a claim to my insurer?',
    ],
  },
  {
    id: 'policy_renewal',
    slug: 'policy-renewal',
    title: 'Policy Renewal',
    category: 'policy_mgmt',
    categoryLabel: 'Policy Management',
    shortDescription:
      'The annual process of paying your premium to maintain uninterrupted coverage and preserve cumulative waiting period credits.',
    whatIsIt:
      'Health insurance policies in India are typically annual contracts that require renewal every 12 months. IRDAI grants lifelong renewability for health insurance, meaning an insurer cannot refuse renewal solely due to adverse claim history. A grace period (typically 30 days) is provided to pay the renewal premium, during which waiting period continuity benefits are protected, though hospitalizations during the unpaid grace period are not covered.',
    whyItMatters:
      'Allowing a policy to lapse past the grace period results in forfeiture of cumulative bonuses and resets all served waiting periods for pre-existing conditions back to day zero.',
    example: {
      scenario:
        'Your policy expires on March 31. You pay the renewal premium on April 14 (within the 30-day grace period).',
      calculation:
        'Your continuous coverage and served waiting periods are preserved intact. However, any illness treated between April 1 and April 13 would not be covered.',
    },
    readTime: '3 min read',
    difficulty: 'essential',
    iconName: 'Clock',
    featured: false,
    searchKeywords: ['renewal', 'grace period', 'lifelong renewability', 'lapsed policy', 'cumulative bonus', 'continuous coverage'],
    retrievalQuery: 'policy renewal grace period 30 days lifelong renewability continuity of coverage cumulative bonus',
    suggestedQuestions: [
      'When is my policy due for renewal?',
      'What is the grace period for premium payment on my policy?',
      'Do I have cumulative bonus (no claim bonus) accumulated on this policy?',
    ],
  },
  {
    id: 'free_look_period',
    slug: 'free-look-period',
    title: 'Free-look Period',
    category: 'policy_mgmt',
    categoryLabel: 'Policy Management',
    shortDescription:
      'A statutory trial period (typically 15 to 30 days) during which you can review policy terms and cancel for a refund if unsatisfied.',
    whatIsIt:
      'The free-look period is a consumer protection mandated by the IRDAI. It allows a policyholder 15 days (or 30 days if purchased electronically or through distance marketing) from the date of policy document receipt to review the terms and conditions. If you disagree with any terms, you can return the policy and receive a refund of premium, less deductions for proportionate risk premium, medical screening expenses, and stamp duty.',
    whyItMatters:
      'The free-look period gives you a risk-free window to inspect your actual policy wording, room rent limits, and waiting period clauses to ensure the plan matches what was promised.',
    example: {
      scenario:
        'You receive your new health policy on June 10. While reading the schedule, you find an unexpected room rent cap. You apply for free-look cancellation on June 18 (day 8).',
      calculation:
        'Your request is accepted within the 15-day window. The insurer refunds your premium after nominal deductions for stamp duty and administrative medical screening.',
    },
    readTime: '3 min read',
    difficulty: 'intermediate',
    iconName: 'FileText',
    featured: false,
    searchKeywords: ['free look', 'free-look period', 'cancellation', 'refund', '15 days', 'trial period', 'return policy'],
    retrievalQuery: 'free look period 15 days 30 days cancellation refund of premium stamp duty medical examination',
    suggestedQuestions: [
      'What is the free-look period window specified in my policy?',
      'What deductions apply if I cancel during the free-look period?',
      'Does the free-look period apply to policy renewals or only new policies?',
    ],
  },
  {
    id: 'portability',
    slug: 'portability',
    title: 'Portability',
    category: 'policy_mgmt',
    categoryLabel: 'Policy Management',
    shortDescription:
      'The legal right to switch your health insurance policy to another insurer without losing accumulated waiting period credits.',
    whatIsIt:
      'Portability is an IRDAI-regulated mechanism that allows a policyholder to transfer their health insurance policy from one insurer to another (or between plans of the same insurer) while carrying forward credits gained for waiting periods, pre-existing conditions, and time-bound exclusions. Portability applications must be submitted at least 45 days before the annual renewal date.',
    whyItMatters:
      'Portability protects policyholders from being trapped in unsatisfactory plans due to fear of losing years of served waiting periods. It allows you to upgrade to better coverage or lower premiums seamlessly.',
    example: {
      scenario:
        'You have completed 3 years of coverage with Insurer A, fulfilling your pre-existing disease waiting period. You apply to port to Insurer B 45 days before renewal.',
      calculation:
        'Insurer B accepts the policy. Your 3 years of continuous coverage carry over, meaning your pre-existing conditions remain covered without serving new waiting periods.',
    },
    readTime: '4 min read',
    difficulty: 'advanced',
    iconName: 'SlidersHorizontal',
    featured: false,
    searchKeywords: ['portability', 'port policy', 'switch insurer', 'credit transfer', 'continuity benefit', '45 days renewal'],
    retrievalQuery: 'portability migration transfer continuity waiting period credit 45 days prior to renewal IRDAI',
    suggestedQuestions: [
      'How does portability work if I want to switch insurers?',
      'Will my served waiting periods transfer if I migrate my plan?',
      'What is the deadline before renewal to apply for portability?',
    ],
  },
];
