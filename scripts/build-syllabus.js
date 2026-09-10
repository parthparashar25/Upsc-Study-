// Generator script for comprehensive UPSC Master Syllabus
const fs = require('fs');
const path = require('path');

const RAW_SYLLABUS = [
  // ==========================================
  // PRELIMS
  // ==========================================
  {
    id: "subj-pre-hist",
    name: "History of India & Indian National Movement",
    exam: "Prelims",
    paper: "General",
    display_order: 1,
    active: true,
    sections: [
      {
        id: "sec-pre-hist-ancient",
        name: "Ancient India",
        display_order: 1,
        topics: [
          "Ancient India Overview",
          "Indus Valley Civilization",
          "Vedic Period",
          "Mahajanapadas",
          "Buddhism",
          "Jainism",
          "Mauryan Empire",
          "Post-Mauryan India",
          "Gupta Period",
          "South Indian Kingdoms",
          "Sangam Age",
        ],
      },
      {
        id: "sec-pre-hist-medieval",
        name: "Medieval India",
        display_order: 2,
        topics: [
          "Medieval India",
          "Delhi Sultanate",
          "Vijayanagara Empire",
          "Mughal Empire",
          "Marathas",
          "Bhakti Movement",
          "Sufi Movement",
        ],
      },
      {
        id: "sec-pre-hist-modern",
        name: "Modern Indian History & Freedom Struggle",
        display_order: 3,
        topics: [
          "European Arrival in India",
          "British Expansion",
          "Governor-Generals and Viceroys",
          "Revolt of 1857",
          "Socio-Religious Reform Movements",
          "Indian National Congress",
          "Moderate and Extremist Phase",
          "Swadeshi Movement",
          "Home Rule Movement",
          "Gandhian Era",
          "Non-Cooperation Movement",
          "Civil Disobedience Movement",
          "Quit India Movement",
          "Revolutionary Movement",
          "Constitutional Development",
          "Partition and Independence",
        ],
      },
      {
        id: "sec-pre-hist-postind",
        name: "Post-Independence India",
        display_order: 4,
        topics: [
          "Post-Independence India",
          "Reorganization of States",
          "Planning and Democratic Consolidation",
          "Major Developments & Challenges",
        ],
      },
    ],
  },
  {
    id: "subj-pre-polity",
    name: "Indian Polity & Governance",
    exam: "Prelims",
    paper: "General",
    display_order: 2,
    active: true,
    sections: [
      {
        id: "sec-pre-pol-const",
        name: "Constitutional Framework",
        display_order: 1,
        topics: [
          "Historical Background",
          "Constitution Making",
          "Constitutional Features",
          "Preamble",
          "Citizenship",
          "Fundamental Rights",
          "Directive Principles",
          "Fundamental Duties",
          "Constitutional Amendments",
          "Basic Structure",
        ],
      },
      {
        id: "sec-pre-pol-union",
        name: "Union Executive & Parliament",
        display_order: 2,
        topics: [
          "President",
          "Vice President",
          "Prime Minister",
          "Council of Ministers",
          "Parliament",
          "Parliamentary Committees",
        ],
      },
      {
        id: "sec-pre-pol-judiciary",
        name: "Judiciary",
        display_order: 3,
        topics: [
          "Supreme Court",
          "High Courts",
          "Judicial Review",
          "Judicial Activism",
        ],
      },
      {
        id: "sec-pre-pol-state",
        name: "State Government & Administration",
        display_order: 4,
        topics: [
          "Governor",
          "Chief Minister",
          "State Legislature",
          "Centre-State Relations",
          "Inter-State Relations",
          "Emergency Provisions",
        ],
      },
      {
        id: "sec-pre-pol-local",
        name: "Local Government",
        display_order: 5,
        topics: [
          "Local Government",
          "Panchayati Raj",
          "Municipalities",
        ],
      },
      {
        id: "sec-pre-pol-bodies",
        name: "Constitutional & Statutory Bodies",
        display_order: 6,
        topics: [
          "Election Commission",
          "UPSC",
          "Finance Commission",
          "CAG",
          "Attorney General",
          "Advocate General",
          "Constitutional Bodies",
          "Statutory Bodies",
          "Tribunals",
        ],
      },
      {
        id: "sec-pre-pol-gov",
        name: "Governance & Civil Society",
        display_order: 7,
        topics: [
          "RTI",
          "Governance",
          "E-Governance",
          "Pressure Groups",
          "NGOs",
          "Civil Society",
        ],
      },
    ],
  },
  {
    id: "subj-pre-geo",
    name: "Geography",
    exam: "Prelims",
    paper: "General",
    display_order: 3,
    active: true,
    sections: [
      {
        id: "sec-pre-geo-physical",
        name: "Physical Geography & Geomorphology",
        display_order: 1,
        topics: [
          "Physical Geography",
          "Earth Structure",
          "Geomorphology",
          "Plate Tectonics",
          "Earthquakes",
          "Volcanoes",
          "Rocks",
          "Landforms",
        ],
      },
      {
        id: "sec-pre-geo-climate",
        name: "Climatology",
        display_order: 2,
        topics: [
          "Climatology",
          "Atmosphere",
          "Winds",
          "Pressure Belts",
          "Monsoons",
          "Cyclones",
        ],
      },
      {
        id: "sec-pre-geo-ocean",
        name: "Oceanography",
        display_order: 3,
        topics: [
          "Oceanography",
          "Ocean Currents",
          "Tides",
          "Marine Resources",
        ],
      },
      {
        id: "sec-pre-geo-india",
        name: "Indian Geography",
        display_order: 4,
        topics: [
          "Indian Geography",
          "Physiography of India",
          "Rivers",
          "Drainage Systems",
          "Climate of India",
          "Soils",
          "Natural Vegetation",
          "Agriculture",
          "Minerals",
          "Industries",
          "Transport",
          "Population",
          "Urbanization",
        ],
      },
      {
        id: "sec-pre-geo-human-world",
        name: "Human, Economic & World Geography",
        display_order: 5,
        topics: [
          "Human Geography",
          "Economic Geography",
          "World Geography",
          "Important Geographical Locations",
          "Mapping",
        ],
      },
    ],
  },
  {
    id: "subj-pre-eco",
    name: "Indian Economy",
    exam: "Prelims",
    paper: "General",
    display_order: 4,
    active: true,
    sections: [
      {
        id: "sec-pre-eco-concepts",
        name: "Basic Economic Concepts & National Income",
        display_order: 1,
        topics: [
          "Basic Economic Concepts",
          "National Income",
          "GDP and GNP",
          "Inflation",
        ],
      },
      {
        id: "sec-pre-eco-monetary-fiscal",
        name: "Monetary & Fiscal Policy",
        display_order: 2,
        topics: [
          "Monetary Policy",
          "Fiscal Policy",
          "Banking",
          "RBI",
          "Financial Markets",
          "Budget",
          "Taxation",
          "Public Finance",
        ],
      },
      {
        id: "sec-pre-eco-external",
        name: "External Sector & Trade",
        display_order: 3,
        topics: [
          "External Sector",
          "Balance of Payments",
          "Exchange Rates",
          "International Trade",
        ],
      },
      {
        id: "sec-pre-eco-growth-dev",
        name: "Economic Growth, Poverty & Inclusion",
        display_order: 4,
        topics: [
          "Economic Growth",
          "Economic Development",
          "Poverty",
          "Unemployment",
          "Inclusive Growth",
          "Infrastructure",
          "Financial Inclusion",
          "Government Schemes",
        ],
      },
      {
        id: "sec-pre-eco-sectors",
        name: "Sectors & Economic Reforms",
        display_order: 5,
        topics: [
          "Agriculture",
          "Industry",
          "Services",
          "MSMEs",
          "Economic Reforms",
          "Liberalization",
          "Privatization",
          "Globalization",
        ],
      },
    ],
  },
  {
    id: "subj-pre-env",
    name: "Environment & Ecology",
    exam: "Prelims",
    paper: "General",
    display_order: 5,
    active: true,
    sections: [
      {
        id: "sec-pre-env-ecology",
        name: "Ecology & Ecosystems",
        display_order: 1,
        topics: [
          "Ecology",
          "Ecosystems",
          "Food Chains",
          "Food Webs",
          "Ecological Pyramids",
        ],
      },
      {
        id: "sec-pre-env-bio",
        name: "Biodiversity & Conservation",
        display_order: 2,
        topics: [
          "Biodiversity",
          "Species",
          "Protected Areas",
          "National Parks",
          "Wildlife Sanctuaries",
          "Biosphere Reserves",
          "Conservation",
          "Forests",
          "Wetlands",
          "Marine Ecosystems",
        ],
      },
      {
        id: "sec-pre-env-climate-poll",
        name: "Climate Change & Pollution",
        display_order: 3,
        topics: [
          "Climate Change",
          "Greenhouse Effect",
          "Global Warming",
          "Ozone Layer",
          "Pollution",
          "Air Pollution",
          "Water Pollution",
          "Soil Pollution",
          "Waste Management",
        ],
      },
      {
        id: "sec-pre-env-laws-conv",
        name: "Environmental Laws & Conventions",
        display_order: 4,
        topics: [
          "Environmental Laws",
          "Environmental Organizations",
          "International Environmental Conventions",
          "Sustainable Development",
          "Renewable Energy",
          "Environmental Impact Assessment",
        ],
      },
    ],
  },
  {
    id: "subj-pre-scitech",
    name: "Science & Technology",
    exam: "Prelims",
    paper: "General",
    display_order: 6,
    active: true,
    sections: [
      {
        id: "sec-pre-sci-basics",
        name: "General Science Basics",
        display_order: 1,
        topics: [
          "Physics Basics",
          "Chemistry Basics",
          "Biology Basics",
          "Human Biology",
          "Diseases",
        ],
      },
      {
        id: "sec-pre-sci-biotech",
        name: "Biotechnology & Genetics",
        display_order: 2,
        topics: [
          "Biotechnology",
          "Genetics",
          "Biotechnology Applications",
        ],
      },
      {
        id: "sec-pre-sci-space-def",
        name: "Space, Defence & Nuclear Technology",
        display_order: 3,
        topics: [
          "Space Technology",
          "Satellites",
          "ISRO",
          "Defence Technology",
          "Nuclear Technology",
        ],
      },
      {
        id: "sec-pre-sci-it-emerging",
        name: "IT & Emerging Technologies",
        display_order: 4,
        topics: [
          "Nanotechnology",
          "Artificial Intelligence",
          "Robotics",
          "Information Technology",
          "Communication Technology",
          "Semiconductor Technology",
          "Emerging Technologies",
        ],
      },
    ],
  },
  {
    id: "subj-pre-ca",
    name: "Current Affairs",
    exam: "Prelims",
    paper: "General",
    display_order: 7,
    active: true,
    sections: [
      {
        id: "sec-pre-ca-cat",
        name: "Current Affairs Categories",
        display_order: 1,
        topics: [
          "National",
          "International",
          "Economy",
          "Polity",
          "Environment",
          "Science & Technology",
          "Defence",
          "Government Schemes",
          "Reports & Indices",
          "Awards",
          "Important Personalities",
          "Places in News",
          "International Organizations",
        ],
      },
    ],
  },
  {
    id: "subj-pre-csat",
    name: "CSAT",
    exam: "Prelims",
    paper: "General",
    display_order: 8,
    active: true,
    sections: [
      {
        id: "sec-pre-csat-rc",
        name: "Reading Comprehension",
        display_order: 1,
        topics: [
          "Reading Comprehension",
        ],
      },
      {
        id: "sec-pre-csat-num",
        name: "Basic Numeracy & Data Interpretation",
        display_order: 2,
        topics: [
          "Basic Numeracy",
          "Number System",
          "Percentage",
          "Profit & Loss",
          "Ratio & Proportion",
          "Average",
          "Time & Work",
          "Time Speed Distance",
          "Simple & Compound Interest",
          "Data Interpretation",
          "Data Sufficiency",
        ],
      },
      {
        id: "sec-pre-csat-reasoning",
        name: "Reasoning & Problem Solving",
        display_order: 3,
        topics: [
          "Logical Reasoning",
          "Analytical Ability",
          "Decision Making",
          "Problem Solving",
        ],
      },
    ],
  },

  // ==========================================
  // MAINS GS PAPER I
  // ==========================================
  {
    id: "subj-mains-gs1-culture",
    name: "Indian Heritage & Culture",
    exam: "Mains",
    paper: "GS1",
    display_order: 101,
    active: true,
    sections: [
      {
        id: "sec-mains-gs1-culture",
        name: "Art, Architecture & Cultural Traditions",
        display_order: 1,
        topics: [
          "Architecture",
          "Sculpture",
          "Paintings",
          "Literature",
          "Music",
          "Dance",
          "Theatre",
          "Religion and Philosophy",
          "Cultural Traditions",
          "UNESCO Heritage",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs1-history",
    name: "Modern Indian History",
    exam: "Mains",
    paper: "GS1",
    display_order: 102,
    active: true,
    sections: [
      {
        id: "sec-mains-gs1-hist",
        name: "British Rule & National Movement",
        display_order: 1,
        topics: [
          "British Rule",
          "Economic Impact of British Rule",
          "Revolt of 1857",
          "Social Reform",
          "National Movement",
          "Gandhian Era",
          "Revolutionary Movement",
          "Constitutional Development",
          "Independence and Partition",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs1-world",
    name: "World History",
    exam: "Mains",
    paper: "GS1",
    display_order: 103,
    active: true,
    sections: [
      {
        id: "sec-mains-gs1-world",
        name: "Major Events & Political Ideologies",
        display_order: 1,
        topics: [
          "Renaissance",
          "Reformation",
          "Enlightenment",
          "American Revolution",
          "French Revolution",
          "Industrial Revolution",
          "Nationalism",
          "Unification of Europe",
          "Unification of Germany",
          "Unification of Italy",
          "Imperialism",
          "Colonialism",
          "World War I",
          "Russian Revolution",
          "World War II",
          "Decolonization",
          "Cold War",
          "Political Ideologies",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs1-society",
    name: "Indian Society",
    exam: "Mains",
    paper: "GS1",
    display_order: 104,
    active: true,
    sections: [
      {
        id: "sec-mains-gs1-society",
        name: "Social Structure, Diversity & Issues",
        display_order: 1,
        topics: [
          "Salient Features",
          "Diversity",
          "Women",
          "Population",
          "Poverty",
          "Urbanization",
          "Globalization",
          "Communalism",
          "Regionalism",
          "Secularism",
          "Social Empowerment",
          "Social Issues",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs1-geo",
    name: "Geography",
    exam: "Mains",
    paper: "GS1",
    display_order: 105,
    active: true,
    sections: [
      {
        id: "sec-mains-gs1-geo",
        name: "World & Indian Geography (Mains)",
        display_order: 1,
        topics: [
          "Distribution of Key Natural Resources",
          "Factors Responsible for Location of Industries",
          "Important Geophysical Phenomena",
          "Geographical Features and Environmental Changes",
        ],
      },
    ],
  },

  // ==========================================
  // MAINS GS PAPER II
  // ==========================================
  {
    id: "subj-mains-gs2-const",
    name: "Constitution",
    exam: "Mains",
    paper: "GS2",
    display_order: 201,
    active: true,
    sections: [
      {
        id: "sec-mains-gs2-const",
        name: "Constitutional Framework & Organs",
        display_order: 1,
        topics: [
          "Constitutional Framework",
          "Constitutional Amendments",
          "Federalism",
          "Separation of Powers",
          "Parliament",
          "Judiciary",
          "Executive",
          "Constitutional Bodies",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs2-gov",
    name: "Polity & Governance",
    exam: "Mains",
    paper: "GS2",
    display_order: 202,
    active: true,
    sections: [
      {
        id: "sec-mains-gs2-gov",
        name: "Governance & Accountability",
        display_order: 1,
        topics: [
          "Parliament",
          "Executive",
          "Judiciary",
          "Elections",
          "Governance",
          "Transparency",
          "Accountability",
          "E-Governance",
          "Civil Services",
          "NGOs",
          "Pressure Groups",
          "Citizen Charters",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs2-socjus",
    name: "Social Justice",
    exam: "Mains",
    paper: "GS2",
    display_order: 203,
    active: true,
    sections: [
      {
        id: "sec-mains-gs2-socjus",
        name: "Social Welfare & Human Development",
        display_order: 1,
        topics: [
          "Health",
          "Education",
          "Poverty",
          "Hunger",
          "Vulnerable Sections",
          "Welfare Schemes",
          "Social Sector",
          "Human Development",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs2-ir",
    name: "International Relations",
    exam: "Mains",
    paper: "GS2",
    display_order: 204,
    active: true,
    sections: [
      {
        id: "sec-mains-gs2-ir",
        name: "Foreign Policy & International Institutions",
        display_order: 1,
        topics: [
          "India and Neighbours",
          "India and Major Powers",
          "Regional Organizations",
          "International Organizations",
          "United Nations",
          "WTO",
          "IMF",
          "World Bank",
          "Bilateral Relations",
          "Multilateral Relations",
          "Global Issues",
          "Indian Diaspora",
        ],
      },
    ],
  },

  // ==========================================
  // MAINS GS PAPER III
  // ==========================================
  {
    id: "subj-mains-gs3-eco",
    name: "Economy",
    exam: "Mains",
    paper: "GS3",
    display_order: 301,
    active: true,
    sections: [
      {
        id: "sec-mains-gs3-eco",
        name: "Economic Growth & Public Finance",
        display_order: 1,
        topics: [
          "Growth",
          "Development",
          "Employment",
          "Inclusive Growth",
          "Budget",
          "Taxation",
          "Infrastructure",
          "Investment",
          "Banking",
          "Financial Markets",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs3-agri",
    name: "Agriculture",
    exam: "Mains",
    paper: "GS3",
    display_order: 302,
    active: true,
    sections: [
      {
        id: "sec-mains-gs3-agri",
        name: "Cropping, Tech & Food Security",
        display_order: 1,
        topics: [
          "Cropping Patterns",
          "Irrigation",
          "Agricultural Marketing",
          "MSP",
          "Food Processing",
          "Land Reforms",
          "Subsidies",
          "Agricultural Technology",
          "Animal Husbandry",
          "Fisheries",
          "Food Security",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs3-scitech",
    name: "Science & Technology",
    exam: "Mains",
    paper: "GS3",
    display_order: 303,
    active: true,
    sections: [
      {
        id: "sec-mains-gs3-scitech",
        name: "Technological Developments & Applications",
        display_order: 1,
        topics: [
          "Space",
          "Biotechnology",
          "Nanotechnology",
          "AI",
          "Robotics",
          "Defence Technology",
          "Cyber Technology",
          "Emerging Technologies",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs3-env",
    name: "Environment",
    exam: "Mains",
    paper: "GS3",
    display_order: 304,
    active: true,
    sections: [
      {
        id: "sec-mains-gs3-env",
        name: "Ecology & Climate Action",
        display_order: 1,
        topics: [
          "Biodiversity",
          "Conservation",
          "Climate Change",
          "Pollution",
          "Environmental Governance",
          "Renewable Energy",
          "Sustainable Development",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs3-dm",
    name: "Disaster Management",
    exam: "Mains",
    paper: "GS3",
    display_order: 305,
    active: true,
    sections: [
      {
        id: "sec-mains-gs3-dm",
        name: "Disaster Preparedness & Response",
        display_order: 1,
        topics: [
          "Disaster Types",
          "Disaster Preparedness",
          "Mitigation",
          "Response",
          "Recovery",
          "Institutional Framework",
          "NDMA",
          "Sendai Framework",
        ],
      },
    ],
  },
  {
    id: "subj-mains-gs3-sec",
    name: "Internal Security",
    exam: "Mains",
    paper: "GS3",
    display_order: 306,
    active: true,
    sections: [
      {
        id: "sec-mains-gs3-sec",
        name: "Security Challenges & Forces",
        display_order: 1,
        topics: [
          "Terrorism",
          "Extremism",
          "Insurgency",
          "Cyber Security",
          "Money Laundering",
          "Border Management",
          "Organized Crime",
          "Security Forces",
          "Maritime Security",
        ],
      },
    ],
  },

  // ==========================================
  // MAINS GS PAPER IV — ETHICS
  // ==========================================
  {
    id: "subj-mains-gs4-ethics",
    name: "Ethics, Integrity & Aptitude",
    exam: "Mains",
    paper: "GS4",
    display_order: 401,
    active: true,
    sections: [
      {
        id: "sec-mains-gs4-interface",
        name: "Ethics & Human Interface",
        display_order: 1,
        topics: [
          "Ethics",
          "Morality",
          "Human Values",
          "Ethical Dilemmas",
          "Attitude",
          "Emotional Intelligence",
        ],
      },
      {
        id: "sec-mains-gs4-thinkers",
        name: "Thinkers",
        display_order: 2,
        topics: [
          "Indian Thinkers",
          "Western Thinkers",
          "Philosophical Ideas",
        ],
      },
      {
        id: "sec-mains-gs4-pubadmin",
        name: "Public Administration Ethics",
        display_order: 3,
        topics: [
          "Integrity",
          "Impartiality",
          "Objectivity",
          "Accountability",
          "Transparency",
          "Code of Conduct",
          "Code of Ethics",
          "Corruption",
          "Probity",
        ],
      },
      {
        id: "sec-mains-gs4-cases",
        name: "Case Studies",
        display_order: 4,
        topics: [
          "Ethical Dilemmas",
          "Administrative Cases",
          "Conflict of Interest",
          "Public Service Values",
          "Decision Making",
        ],
      },
    ],
  },

  // ==========================================
  // ESSAY
  // ==========================================
  {
    id: "subj-mains-essay",
    name: "Essay",
    exam: "Mains",
    paper: "Essay",
    display_order: 501,
    active: true,
    sections: [
      {
        id: "sec-mains-essay-themes",
        name: "Broad Essay Themes",
        display_order: 1,
        topics: [
          "Society",
          "Economy",
          "Governance",
          "Politics",
          "Philosophy",
          "Ethics",
          "Science & Technology",
          "Environment",
          "Education",
          "Women",
          "International Relations",
          "Democracy",
          "Development",
          "Social Issues",
        ],
      },
    ],
  },

  // ==========================================
  // OPTIONAL SUBJECT FRAMEWORK
  // ==========================================
  {
    id: "subj-mains-optional",
    name: "Optional Subject",
    exam: "Mains",
    paper: "Optional",
    display_order: 601,
    active: true,
    sections: [
      {
        id: "sec-mains-opt-paper1",
        name: "Paper I (Theory & Foundations)",
        display_order: 1,
        topics: [
          "Foundations & Core Concepts",
          "Advanced Theories & Models",
          "Thinkers & Major Contributions",
          "Applied Approaches & Methods",
        ],
      },
      {
        id: "sec-mains-opt-paper2",
        name: "Paper II (Indian Context & Application)",
        display_order: 2,
        topics: [
          "Historical & Institutional Evolution",
          "Indian Perspective & Dimensions",
          "Contemporary Policies & Issues",
          "Case Studies & Empirical Analysis",
        ],
      },
    ],
  },
];

// Generate structured data with unique topic IDs
let totalSubjects = RAW_SYLLABUS.length;
let totalSections = 0;
let totalTopics = 0;

const structuredSyllabus = RAW_SYLLABUS.map((subj) => {
  return {
    ...subj,
    sections: subj.sections.map((sec) => {
      totalSections++;
      return {
        ...sec,
        topics: sec.topics.map((topicName, idx) => {
          totalTopics++;
          // Generate deterministic clean slug
          const topicSlug = topicName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const topicId = `top-${sec.id.replace('sec-', '')}-${idx + 1}-${topicSlug}`.slice(0, 50);
          return {
            id: topicId,
            name: topicName,
            display_order: idx + 1,
          };
        }),
      };
    }),
  };
});

console.log(`Subjects: ${totalSubjects}, Sections: ${totalSections}, Topics: ${totalTopics}`);

// 1. Output TypeScript file
const tsContent = `import { SyllabusSubject, SyllabusSection, SyllabusTopic } from "@/types/database";

export interface MasterSyllabusSubject extends SyllabusSubject {
  sections: {
    id: string;
    name: string;
    display_order: number;
    topics: {
      id: string;
      name: string;
      description?: string;
      display_order: number;
    }[];
  }[];
}

export const MASTER_SYLLABUS: MasterSyllabusSubject[] = ${JSON.stringify(structuredSyllabus, null, 2)};

export function getAllTopics(): SyllabusTopic[] {
  const all: SyllabusTopic[] = [];
  MASTER_SYLLABUS.forEach((subj) => {
    subj.sections.forEach((sec) => {
      sec.topics.forEach((t) => {
        all.push({
          id: t.id,
          section_id: sec.id,
          name: t.name,
          description: t.description || '',
          display_order: t.display_order,
          active: true,
          subject_id: subj.id,
          subject_name: subj.name,
          section_name: sec.name,
          exam: subj.exam,
          paper: subj.paper,
        });
      });
    });
  });
  return all;
}

export function computeTopicStatus(
  study: boolean,
  revision: boolean,
  pyq: boolean,
  currentStatus?: string
): any {
  if (currentStatus === "Revision Due") return "Revision Due";
  if (!study && !revision && !pyq) return "Not Started";
  if (study && revision && pyq) return "Completed";
  return "In Progress";
}
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/syllabus-data.ts'), tsContent, 'utf-8');

// 2. Output SQL seed migration
let sqlContent = `-- ==============================================================================
-- UPSC Master Syllabus SQL Seed
-- Total Subjects: ${totalSubjects} | Total Sections: ${totalSections} | Total Topics: ${totalTopics}
-- ==============================================================================

-- 1. SEED SYLLABUS SUBJECTS
insert into public.syllabus_subjects (id, name, exam, paper, display_order, active)
values
`;

const subjRows = structuredSyllabus.map(
  (s) => `  ('${s.id}', '${s.name.replace(/'/g, "''")}', '${s.exam}', '${s.paper}', ${s.display_order}, true)`
);
sqlContent += subjRows.join(',\n') + '\non conflict (id) do update set name = excluded.name, exam = excluded.exam, paper = excluded.paper, display_order = excluded.display_order;\n\n';

// 2. SEED SECTIONS
sqlContent += '-- 2. SEED SYLLABUS SECTIONS\ninsert into public.syllabus_sections (id, subject_id, name, display_order)\nvalues\n';
const secRows = [];
structuredSyllabus.forEach((s) => {
  s.sections.forEach((sec) => {
    secRows.push(`  ('${sec.id}', '${s.id}', '${sec.name.replace(/'/g, "''")}', ${sec.display_order})`);
  });
});
sqlContent += secRows.join(',\n') + '\non conflict (id) do update set name = excluded.name, subject_id = excluded.subject_id, display_order = excluded.display_order;\n\n';

// 3. SEED TOPICS
sqlContent += '-- 3. SEED SYLLABUS TOPICS\ninsert into public.syllabus_topics (id, section_id, name, description, display_order, active)\nvalues\n';
const topRows = [];
structuredSyllabus.forEach((s) => {
  s.sections.forEach((sec) => {
    sec.topics.forEach((t) => {
      topRows.push(`  ('${t.id}', '${sec.id}', '${t.name.replace(/'/g, "''")}', '', ${t.display_order}, true)`);
    });
  });
});
sqlContent += topRows.join(',\n') + '\non conflict (id) do update set name = excluded.name, section_id = excluded.section_id, display_order = excluded.display_order;\n';

fs.writeFileSync(path.join(__dirname, '../supabase/seed_syllabus.sql'), sqlContent, 'utf-8');
console.log('Successfully generated src/lib/syllabus-data.ts and supabase/seed_syllabus.sql!');
