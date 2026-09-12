import { ReferenceBook } from "@/types/database";

export interface DefaultBookTemplate {
  id: string;
  title: string;
  author: string;
  subject_id: string;
  subject_name: string;
  category: "Standard Reference" | "NCERT" | "Government Report" | "Manual";
  importance: "Essential" | "Recommended" | "Reference";
  edition?: string;
  description: string;
}

export const BOOK_SUBJECT_FILTERS = [
  { id: "all", name: "All Subjects" },
  { id: "polity", name: "Polity & Constitution" },
  { id: "history", name: "History & Culture" },
  { id: "geography", name: "Geography & Environment" },
  { id: "economy", name: "Indian Economy" },
  { id: "environment", name: "Environment & Ecology" },
  { id: "sci-tech", name: "Science & Technology" },
  { id: "ethics", name: "Ethics (GS4)" },
  { id: "ncert", name: "NCERT Textbooks" },
  { id: "ir-security", name: "IR & Security" },
];

export const DEFAULT_UPSC_BOOKS: DefaultBookTemplate[] = [
  // POLITY & CONSTITUTION
  {
    id: "book-polity-laxmikanth",
    title: "Indian Polity",
    author: "M. Laxmikanth",
    subject_id: "polity",
    subject_name: "Indian Polity & Governance",
    category: "Standard Reference",
    importance: "Essential",
    edition: "7th Edition",
    description: "The definitive guide for UPSC Prelims & Mains Polity, covering fundamental rights, parliament, judiciary, and constitutional bodies.",
  },
  {
    id: "book-polity-ddbasu",
    title: "Introduction to the Constitution of India",
    author: "Dr. Durga Das Basu (D.D. Basu)",
    subject_id: "polity",
    subject_name: "Indian Polity & Governance",
    category: "Standard Reference",
    importance: "Recommended",
    edition: "26th Edition",
    description: "Deep constitutional analysis, landmark case laws, and comparative constitutional mechanics for Mains GS2.",
  },
  {
    id: "book-polity-2nd-arc",
    title: "2nd Administrative Reforms Commission (ARC) Key Reports",
    author: "Government of India",
    subject_id: "polity",
    subject_name: "Indian Polity & Governance",
    category: "Government Report",
    importance: "Essential",
    edition: "Summary Reports (1st, 4th, 6th, 10th, 12th)",
    description: "Crucial for GS2 governance and GS4 ethics answers. Contains actionable reforms for administrative and public accountability.",
  },

  // HISTORY & ART & CULTURE
  {
    id: "book-hist-spectrum",
    title: "A Brief History of Modern India",
    author: "Rajiv Ahir (Spectrum)",
    subject_id: "history",
    subject_name: "History & Art & Culture",
    category: "Standard Reference",
    importance: "Essential",
    edition: "Latest Revised Edition",
    description: "Concise yet exhaustive overview of Indian national movement, socio-religious reforms, and British administrative policies.",
  },
  {
    id: "book-hist-bipin-chandra",
    title: "India's Struggle for Independence",
    author: "Bipin Chandra",
    subject_id: "history",
    subject_name: "History & Art & Culture",
    category: "Standard Reference",
    importance: "Recommended",
    description: "Comprehensive narrative for analytical Mains GS1 questions on the socio-economic impact of the freedom movement.",
  },
  {
    id: "book-hist-ancient-sharma",
    title: "India's Ancient Past",
    author: "R.S. Sharma",
    subject_id: "history",
    subject_name: "History & Art & Culture",
    category: "Standard Reference",
    importance: "Essential",
    description: "Standard foundation for Vedic civilization, Mauryas, Guptas, and early state formation in ancient India.",
  },
  {
    id: "book-hist-medieval-satish",
    title: "History of Medieval India",
    author: "Satish Chandra",
    subject_id: "history",
    subject_name: "History & Art & Culture",
    category: "Standard Reference",
    importance: "Essential",
    description: "Crucial for Delhi Sultanate, Vijayanagara Empire, and Mughal administrative and agrarian systems.",
  },
  {
    id: "book-art-culture-singhania",
    title: "Indian Art and Culture",
    author: "Nitin Singhania",
    subject_id: "history",
    subject_name: "History & Art & Culture",
    category: "Standard Reference",
    importance: "Essential",
    edition: "4th Edition",
    description: "Detailed coverage of Indian architecture, sculpture, paintings, classical dances, music, and UNESCO heritage sites.",
  },

  // GEOGRAPHY
  {
    id: "book-geo-gcleong",
    title: "Certificate Physical and Human Geography",
    author: "G.C. Leong",
    subject_id: "geography",
    subject_name: "Geography",
    category: "Standard Reference",
    importance: "Essential",
    description: "Standard text for physical geography, weather patterns, climate classification, and vegetation regions.",
  },
  {
    id: "book-geo-ncert-11-physical",
    title: "Fundamentals of Physical Geography (Class 11)",
    author: "NCERT",
    subject_id: "ncert",
    subject_name: "NCERT Textbooks",
    category: "NCERT",
    importance: "Essential",
    description: "Must-read textbook for geomorphology, plate tectonics, climatology, oceanography, and atmospheric circulation.",
  },
  {
    id: "book-geo-ncert-11-india",
    title: "India: Physical Environment (Class 11)",
    author: "NCERT",
    subject_id: "ncert",
    subject_name: "NCERT Textbooks",
    category: "NCERT",
    importance: "Essential",
    description: "Covers Indian physiography, river drainage systems, monsoons, soil varieties, and natural hazards.",
  },
  {
    id: "book-geo-ncert-12-human",
    title: "Fundamentals of Human Geography (Class 12)",
    author: "NCERT",
    subject_id: "ncert",
    subject_name: "NCERT Textbooks",
    category: "NCERT",
    importance: "Essential",
    description: "Demographics, global migration patterns, human development index, settlements, and international trade.",
  },
  {
    id: "book-geo-ncert-12-india",
    title: "India: People and Economy (Class 12)",
    author: "NCERT",
    subject_id: "ncert",
    subject_name: "NCERT Textbooks",
    category: "NCERT",
    importance: "Essential",
    description: "Mineral resources, agricultural patterns, industries, transport, and planning in India.",
  },
  {
    id: "book-geo-atlas",
    title: "Oxford Student Atlas for India",
    author: "Oxford University Press",
    subject_id: "geography",
    subject_name: "Geography",
    category: "Manual",
    importance: "Essential",
    description: "Indispensable atlas for map-based Prelims questions, straits, mountain passes, rivers, and national parks.",
  },

  // INDIAN ECONOMY
  {
    id: "book-econ-ramesh-singh",
    title: "Indian Economy",
    author: "Ramesh Singh",
    subject_id: "economy",
    subject_name: "Indian Economy",
    category: "Standard Reference",
    importance: "Essential",
    edition: "15th Edition",
    description: "Covers macroeconomic concepts, fiscal policy, banking reforms, inflation, agriculture, and external sector.",
  },
  {
    id: "book-econ-sanjiv-verma",
    title: "The Indian Economy",
    author: "Sanjiv Verma",
    subject_id: "economy",
    subject_name: "Indian Economy",
    category: "Standard Reference",
    importance: "Recommended",
    description: "Accessible, lucid presentation of core economic principles and government schemes.",
  },
  {
    id: "book-econ-survey-budget",
    title: "Economic Survey & Union Budget Compendium",
    author: "Ministry of Finance, GoI",
    subject_id: "economy",
    subject_name: "Indian Economy",
    category: "Government Report",
    importance: "Essential",
    description: "Essential annual document containing macroeconomic indicators, policy shifts, sectoral growth data, and budgetary allocations.",
  },

  // ENVIRONMENT & ECOLOGY
  {
    id: "book-env-shankar",
    title: "Environment",
    author: "Shankar IAS Academy",
    subject_id: "environment",
    subject_name: "Environment & Ecology",
    category: "Standard Reference",
    importance: "Essential",
    edition: "10th Edition",
    description: "Standard UPSC text for biodiversity, climate change protocols (UNFCCC, COP), pollution, national parks, and wildlife reserves.",
  },
  {
    id: "book-env-pmf",
    title: "Environment & Ecology",
    author: "PMF IAS",
    subject_id: "environment",
    subject_name: "Environment & Ecology",
    category: "Standard Reference",
    importance: "Recommended",
    description: "Color-coded diagrams, species classifications (IUCN status), and updated international conventions.",
  },

  // SCIENCE & TECHNOLOGY
  {
    id: "book-sci-agrahari",
    title: "Science and Technology",
    author: "Ravi P. Agrahari",
    subject_id: "sci-tech",
    subject_name: "Science & Technology",
    category: "Standard Reference",
    importance: "Essential",
    edition: "Latest Edition",
    description: "Comprehensive coverage of biotechnology, space missions (ISRO/NASA), nanotechnology, AI, nuclear tech, and defense systems.",
  },

  // ETHICS, INTEGRITY & APTITUDE (GS4)
  {
    id: "book-ethics-lexicon",
    title: "Lexicon for Ethics, Integrity & Aptitude",
    author: "Chronicle Editorial Board",
    subject_id: "ethics",
    subject_name: "Ethics (GS4)",
    category: "Standard Reference",
    importance: "Essential",
    description: "Defines core ethical terminology, emotional intelligence, moral philosophers, and case study frameworks.",
  },
  {
    id: "book-ethics-subbarao",
    title: "Ethics, Integrity and Aptitude",
    author: "G. Subba Rao & P.N. Roy Chowdhury",
    subject_id: "ethics",
    subject_name: "Ethics (GS4)",
    category: "Standard Reference",
    importance: "Recommended",
    description: "Analytical coverage of moral thinkers, ethical dilemmas in civil services, and structured case studies.",
  },

  // IR & INTERNAL SECURITY
  {
    id: "book-ir-sikri",
    title: "Challenge and Strategy: Rethinking India's Foreign Policy",
    author: "Rajiv Sikri",
    subject_id: "ir-security",
    subject_name: "IR & Security",
    category: "Standard Reference",
    importance: "Recommended",
    description: "Strategic insights on India's neighborhood policy, relations with major powers, and multilateral engagements.",
  },
  {
    id: "book-sec-singh",
    title: "Internal Security of India",
    author: "Ashok Kumar (IPS) & Vipul Anekant",
    subject_id: "ir-security",
    subject_name: "IR & Security",
    category: "Standard Reference",
    importance: "Essential",
    description: "Covers cross-border terrorism, cyber warfare, Left-Wing Extremism (LWE), border management, and money laundering.",
  },
];
