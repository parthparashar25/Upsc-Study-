import { SyllabusSubject, SyllabusSection, SyllabusTopic } from "@/types/database";

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

export const MASTER_SYLLABUS: MasterSyllabusSubject[] = [
  {
    "id": "subj-pre-hist",
    "name": "History of India & Indian National Movement",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 1,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-hist-ancient",
        "name": "Ancient India",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-hist-ancient-1-ancient-india-overview",
            "name": "Ancient India Overview",
            "display_order": 1
          },
          {
            "id": "top-pre-hist-ancient-2-indus-valley-civilization",
            "name": "Indus Valley Civilization",
            "display_order": 2
          },
          {
            "id": "top-pre-hist-ancient-3-vedic-period",
            "name": "Vedic Period",
            "display_order": 3
          },
          {
            "id": "top-pre-hist-ancient-4-mahajanapadas",
            "name": "Mahajanapadas",
            "display_order": 4
          },
          {
            "id": "top-pre-hist-ancient-5-buddhism",
            "name": "Buddhism",
            "display_order": 5
          },
          {
            "id": "top-pre-hist-ancient-6-jainism",
            "name": "Jainism",
            "display_order": 6
          },
          {
            "id": "top-pre-hist-ancient-7-mauryan-empire",
            "name": "Mauryan Empire",
            "display_order": 7
          },
          {
            "id": "top-pre-hist-ancient-8-post-mauryan-india",
            "name": "Post-Mauryan India",
            "display_order": 8
          },
          {
            "id": "top-pre-hist-ancient-9-gupta-period",
            "name": "Gupta Period",
            "display_order": 9
          },
          {
            "id": "top-pre-hist-ancient-10-south-indian-kingdoms",
            "name": "South Indian Kingdoms",
            "display_order": 10
          },
          {
            "id": "top-pre-hist-ancient-11-sangam-age",
            "name": "Sangam Age",
            "display_order": 11
          }
        ]
      },
      {
        "id": "sec-pre-hist-medieval",
        "name": "Medieval India",
        "display_order": 2,
        "topics": [
          {
            "id": "top-pre-hist-medieval-1-medieval-india",
            "name": "Medieval India",
            "display_order": 1
          },
          {
            "id": "top-pre-hist-medieval-2-delhi-sultanate",
            "name": "Delhi Sultanate",
            "display_order": 2
          },
          {
            "id": "top-pre-hist-medieval-3-vijayanagara-empire",
            "name": "Vijayanagara Empire",
            "display_order": 3
          },
          {
            "id": "top-pre-hist-medieval-4-mughal-empire",
            "name": "Mughal Empire",
            "display_order": 4
          },
          {
            "id": "top-pre-hist-medieval-5-marathas",
            "name": "Marathas",
            "display_order": 5
          },
          {
            "id": "top-pre-hist-medieval-6-bhakti-movement",
            "name": "Bhakti Movement",
            "display_order": 6
          },
          {
            "id": "top-pre-hist-medieval-7-sufi-movement",
            "name": "Sufi Movement",
            "display_order": 7
          }
        ]
      },
      {
        "id": "sec-pre-hist-modern",
        "name": "Modern Indian History & Freedom Struggle",
        "display_order": 3,
        "topics": [
          {
            "id": "top-pre-hist-modern-1-european-arrival-in-india",
            "name": "European Arrival in India",
            "display_order": 1
          },
          {
            "id": "top-pre-hist-modern-2-british-expansion",
            "name": "British Expansion",
            "display_order": 2
          },
          {
            "id": "top-pre-hist-modern-3-governor-generals-and-vicero",
            "name": "Governor-Generals and Viceroys",
            "display_order": 3
          },
          {
            "id": "top-pre-hist-modern-4-revolt-of-1857",
            "name": "Revolt of 1857",
            "display_order": 4
          },
          {
            "id": "top-pre-hist-modern-5-socio-religious-reform-movem",
            "name": "Socio-Religious Reform Movements",
            "display_order": 5
          },
          {
            "id": "top-pre-hist-modern-6-indian-national-congress",
            "name": "Indian National Congress",
            "display_order": 6
          },
          {
            "id": "top-pre-hist-modern-7-moderate-and-extremist-phase",
            "name": "Moderate and Extremist Phase",
            "display_order": 7
          },
          {
            "id": "top-pre-hist-modern-8-swadeshi-movement",
            "name": "Swadeshi Movement",
            "display_order": 8
          },
          {
            "id": "top-pre-hist-modern-9-home-rule-movement",
            "name": "Home Rule Movement",
            "display_order": 9
          },
          {
            "id": "top-pre-hist-modern-10-gandhian-era",
            "name": "Gandhian Era",
            "display_order": 10
          },
          {
            "id": "top-pre-hist-modern-11-non-cooperation-movement",
            "name": "Non-Cooperation Movement",
            "display_order": 11
          },
          {
            "id": "top-pre-hist-modern-12-civil-disobedience-movement",
            "name": "Civil Disobedience Movement",
            "display_order": 12
          },
          {
            "id": "top-pre-hist-modern-13-quit-india-movement",
            "name": "Quit India Movement",
            "display_order": 13
          },
          {
            "id": "top-pre-hist-modern-14-revolutionary-movement",
            "name": "Revolutionary Movement",
            "display_order": 14
          },
          {
            "id": "top-pre-hist-modern-15-constitutional-development",
            "name": "Constitutional Development",
            "display_order": 15
          },
          {
            "id": "top-pre-hist-modern-16-partition-and-independence",
            "name": "Partition and Independence",
            "display_order": 16
          }
        ]
      },
      {
        "id": "sec-pre-hist-postind",
        "name": "Post-Independence India",
        "display_order": 4,
        "topics": [
          {
            "id": "top-pre-hist-postind-1-post-independence-india",
            "name": "Post-Independence India",
            "display_order": 1
          },
          {
            "id": "top-pre-hist-postind-2-reorganization-of-states",
            "name": "Reorganization of States",
            "display_order": 2
          },
          {
            "id": "top-pre-hist-postind-3-planning-and-democratic-con",
            "name": "Planning and Democratic Consolidation",
            "display_order": 3
          },
          {
            "id": "top-pre-hist-postind-4-major-developments-challeng",
            "name": "Major Developments & Challenges",
            "display_order": 4
          }
        ]
      },
      {
        "id": "sec-pre-hist-culture",
        "name": "Indian Heritage, Art & Culture",
        "display_order": 5,
        "topics": [
          { "id": "top-pre-hist-culture-1-architecture", "name": "Architecture (Rock-Cut, Stupas, Cave Art, Temples & Indo-Islamic)", "display_order": 1 },
          { "id": "top-pre-hist-culture-2-sculpture", "name": "Sculpture & Pottery (Harappan, Gandhara, Mathura, Amravati, Bronzes)", "display_order": 2 },
          { "id": "top-pre-hist-culture-3-paintings", "name": "Indian Paintings (Murals, Miniatures - Mughal, Rajasthani, Pahari, Folk)", "display_order": 3 },
          { "id": "top-pre-hist-culture-4-literature", "name": "Classical & Medieval Literature (Vedas, Epics, Sangam, Persian & Vernacular)", "display_order": 4 },
          { "id": "top-pre-hist-culture-5-music-dance", "name": "Indian Classical Music & Dances (Hindustani, Carnatic, 8 Classical Dances)", "display_order": 5 },
          { "id": "top-pre-hist-culture-6-theatre-puppetry", "name": "Traditional Theatre, Puppetry & Martial Arts", "display_order": 6 },
          { "id": "top-pre-hist-culture-7-philosophy", "name": "Six Schools of Indian Philosophy, Buddhism & Jainism", "display_order": 7 },
          { "id": "top-pre-hist-culture-8-unesco", "name": "UNESCO Tangible & Intangible Cultural Heritage of India", "display_order": 8 }
        ]
      },
      {
        "id": "sec-pre-hist-world",
        "name": "World History",
        "display_order": 6,
        "topics": [
          { "id": "top-pre-hist-world-1-revolutions", "name": "Renaissance, Enlightenment, American & French Revolutions", "display_order": 1 },
          { "id": "top-pre-hist-world-2-industrial-rev", "name": "Industrial Revolution, Capitalism, Socialism & Colonialism", "display_order": 2 },
          { "id": "top-pre-hist-world-3-ww1-interwar", "name": "World War I, Russian Revolution & League of Nations", "display_order": 3 },
          { "id": "top-pre-hist-world-4-ww2-nazism", "name": "Fascism, Nazism, World War II & Decolonization", "display_order": 4 },
          { "id": "top-pre-hist-world-5-cold-war", "name": "Cold War, Non-Aligned Movement & Disintegration of USSR", "display_order": 5 }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-polity",
    "name": "Indian Polity & Governance",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 2,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-pol-const",
        "name": "Constitutional Framework",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-pol-const-1-historical-background",
            "name": "Historical Background",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-const-2-constitution-making",
            "name": "Constitution Making",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-const-3-constitutional-features",
            "name": "Constitutional Features",
            "display_order": 3
          },
          {
            "id": "top-pre-pol-const-4-preamble",
            "name": "Preamble",
            "display_order": 4
          },
          {
            "id": "top-pre-pol-const-5-citizenship",
            "name": "Citizenship",
            "display_order": 5
          },
          {
            "id": "top-pre-pol-const-6-fundamental-rights",
            "name": "Fundamental Rights",
            "display_order": 6
          },
          {
            "id": "top-pre-pol-const-7-directive-principles",
            "name": "Directive Principles",
            "display_order": 7
          },
          {
            "id": "top-pre-pol-const-8-fundamental-duties",
            "name": "Fundamental Duties",
            "display_order": 8
          },
          {
            "id": "top-pre-pol-const-9-constitutional-amendments",
            "name": "Constitutional Amendments",
            "display_order": 9
          },
          {
            "id": "top-pre-pol-const-10-basic-structure",
            "name": "Basic Structure",
            "display_order": 10
          }
        ]
      },
      {
        "id": "sec-pre-pol-union",
        "name": "Union Executive & Parliament",
        "display_order": 2,
        "topics": [
          {
            "id": "top-pre-pol-union-1-president",
            "name": "President",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-union-2-vice-president",
            "name": "Vice President",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-union-3-prime-minister",
            "name": "Prime Minister",
            "display_order": 3
          },
          {
            "id": "top-pre-pol-union-4-council-of-ministers",
            "name": "Council of Ministers",
            "display_order": 4
          },
          {
            "id": "top-pre-pol-union-5-parliament",
            "name": "Parliament",
            "display_order": 5
          },
          {
            "id": "top-pre-pol-union-6-parliamentary-committees",
            "name": "Parliamentary Committees",
            "display_order": 6
          }
        ]
      },
      {
        "id": "sec-pre-pol-judiciary",
        "name": "Judiciary",
        "display_order": 3,
        "topics": [
          {
            "id": "top-pre-pol-judiciary-1-supreme-court",
            "name": "Supreme Court",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-judiciary-2-high-courts",
            "name": "High Courts",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-judiciary-3-judicial-review",
            "name": "Judicial Review",
            "display_order": 3
          },
          {
            "id": "top-pre-pol-judiciary-4-judicial-activism",
            "name": "Judicial Activism",
            "display_order": 4
          }
        ]
      },
      {
        "id": "sec-pre-pol-state",
        "name": "State Government & Administration",
        "display_order": 4,
        "topics": [
          {
            "id": "top-pre-pol-state-1-governor",
            "name": "Governor",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-state-2-chief-minister",
            "name": "Chief Minister",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-state-3-state-legislature",
            "name": "State Legislature",
            "display_order": 3
          },
          {
            "id": "top-pre-pol-state-4-centre-state-relations",
            "name": "Centre-State Relations",
            "display_order": 4
          },
          {
            "id": "top-pre-pol-state-5-inter-state-relations",
            "name": "Inter-State Relations",
            "display_order": 5
          },
          {
            "id": "top-pre-pol-state-6-emergency-provisions",
            "name": "Emergency Provisions",
            "display_order": 6
          }
        ]
      },
      {
        "id": "sec-pre-pol-local",
        "name": "Local Government",
        "display_order": 5,
        "topics": [
          {
            "id": "top-pre-pol-local-1-local-government",
            "name": "Local Government",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-local-2-panchayati-raj",
            "name": "Panchayati Raj",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-local-3-municipalities",
            "name": "Municipalities",
            "display_order": 3
          }
        ]
      },
      {
        "id": "sec-pre-pol-bodies",
        "name": "Constitutional & Statutory Bodies",
        "display_order": 6,
        "topics": [
          {
            "id": "top-pre-pol-bodies-1-election-commission",
            "name": "Election Commission",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-bodies-2-upsc",
            "name": "UPSC",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-bodies-3-finance-commission",
            "name": "Finance Commission",
            "display_order": 3
          },
          {
            "id": "top-pre-pol-bodies-4-cag",
            "name": "CAG",
            "display_order": 4
          },
          {
            "id": "top-pre-pol-bodies-5-attorney-general",
            "name": "Attorney General",
            "display_order": 5
          },
          {
            "id": "top-pre-pol-bodies-6-advocate-general",
            "name": "Advocate General",
            "display_order": 6
          },
          {
            "id": "top-pre-pol-bodies-7-constitutional-bodies",
            "name": "Constitutional Bodies",
            "display_order": 7
          },
          {
            "id": "top-pre-pol-bodies-8-statutory-bodies",
            "name": "Statutory Bodies",
            "display_order": 8
          },
          {
            "id": "top-pre-pol-bodies-9-tribunals",
            "name": "Tribunals",
            "display_order": 9
          }
        ]
      },
      {
        "id": "sec-pre-pol-gov",
        "name": "Governance & Civil Society",
        "display_order": 7,
        "topics": [
          {
            "id": "top-pre-pol-gov-1-rti",
            "name": "RTI",
            "display_order": 1
          },
          {
            "id": "top-pre-pol-gov-2-governance",
            "name": "Governance",
            "display_order": 2
          },
          {
            "id": "top-pre-pol-gov-3-e-governance",
            "name": "E-Governance",
            "display_order": 3
          },
          {
            "id": "top-pre-pol-gov-4-pressure-groups",
            "name": "Pressure Groups",
            "display_order": 4
          },
          {
            "id": "top-pre-pol-gov-5-ngos",
            "name": "NGOs",
            "display_order": 5
          },
          {
            "id": "top-pre-pol-gov-6-civil-society",
            "name": "Civil Society",
            "display_order": 6
          }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-geo",
    "name": "Geography",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 3,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-geo-physical",
        "name": "Physical Geography & Geomorphology",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-geo-physical-1-physical-geography",
            "name": "Physical Geography",
            "display_order": 1
          },
          {
            "id": "top-pre-geo-physical-2-earth-structure",
            "name": "Earth Structure",
            "display_order": 2
          },
          {
            "id": "top-pre-geo-physical-3-geomorphology",
            "name": "Geomorphology",
            "display_order": 3
          },
          {
            "id": "top-pre-geo-physical-4-plate-tectonics",
            "name": "Plate Tectonics",
            "display_order": 4
          },
          {
            "id": "top-pre-geo-physical-5-earthquakes",
            "name": "Earthquakes",
            "display_order": 5
          },
          {
            "id": "top-pre-geo-physical-6-volcanoes",
            "name": "Volcanoes",
            "display_order": 6
          },
          {
            "id": "top-pre-geo-physical-7-rocks",
            "name": "Rocks",
            "display_order": 7
          },
          {
            "id": "top-pre-geo-physical-8-landforms",
            "name": "Landforms",
            "display_order": 8
          }
        ]
      },
      {
        "id": "sec-pre-geo-climate",
        "name": "Climatology",
        "display_order": 2,
        "topics": [
          {
            "id": "top-pre-geo-climate-1-climatology",
            "name": "Climatology",
            "display_order": 1
          },
          {
            "id": "top-pre-geo-climate-2-atmosphere",
            "name": "Atmosphere",
            "display_order": 2
          },
          {
            "id": "top-pre-geo-climate-3-winds",
            "name": "Winds",
            "display_order": 3
          },
          {
            "id": "top-pre-geo-climate-4-pressure-belts",
            "name": "Pressure Belts",
            "display_order": 4
          },
          {
            "id": "top-pre-geo-climate-5-monsoons",
            "name": "Monsoons",
            "display_order": 5
          },
          {
            "id": "top-pre-geo-climate-6-cyclones",
            "name": "Cyclones",
            "display_order": 6
          }
        ]
      },
      {
        "id": "sec-pre-geo-ocean",
        "name": "Oceanography",
        "display_order": 3,
        "topics": [
          {
            "id": "top-pre-geo-ocean-1-oceanography",
            "name": "Oceanography",
            "display_order": 1
          },
          {
            "id": "top-pre-geo-ocean-2-ocean-currents",
            "name": "Ocean Currents",
            "display_order": 2
          },
          {
            "id": "top-pre-geo-ocean-3-tides",
            "name": "Tides",
            "display_order": 3
          },
          {
            "id": "top-pre-geo-ocean-4-marine-resources",
            "name": "Marine Resources",
            "display_order": 4
          }
        ]
      },
      {
        "id": "sec-pre-geo-india",
        "name": "Indian Geography",
        "display_order": 4,
        "topics": [
          {
            "id": "top-pre-geo-india-1-indian-geography",
            "name": "Indian Geography",
            "display_order": 1
          },
          {
            "id": "top-pre-geo-india-2-physiography-of-india",
            "name": "Physiography of India",
            "display_order": 2
          },
          {
            "id": "top-pre-geo-india-3-rivers",
            "name": "Rivers",
            "display_order": 3
          },
          {
            "id": "top-pre-geo-india-4-drainage-systems",
            "name": "Drainage Systems",
            "display_order": 4
          },
          {
            "id": "top-pre-geo-india-5-climate-of-india",
            "name": "Climate of India",
            "display_order": 5
          },
          {
            "id": "top-pre-geo-india-6-soils",
            "name": "Soils",
            "display_order": 6
          },
          {
            "id": "top-pre-geo-india-7-natural-vegetation",
            "name": "Natural Vegetation",
            "display_order": 7
          },
          {
            "id": "top-pre-geo-india-8-agriculture",
            "name": "Agriculture",
            "display_order": 8
          },
          {
            "id": "top-pre-geo-india-9-minerals",
            "name": "Minerals",
            "display_order": 9
          },
          {
            "id": "top-pre-geo-india-10-industries",
            "name": "Industries",
            "display_order": 10
          },
          {
            "id": "top-pre-geo-india-11-transport",
            "name": "Transport",
            "display_order": 11
          },
          {
            "id": "top-pre-geo-india-12-population",
            "name": "Population",
            "display_order": 12
          },
          {
            "id": "top-pre-geo-india-13-urbanization",
            "name": "Urbanization",
            "display_order": 13
          }
        ]
      },
      {
        "id": "sec-pre-geo-human-world",
        "name": "Human, Economic & World Geography",
        "display_order": 5,
        "topics": [
          {
            "id": "top-pre-geo-human-world-1-human-geography",
            "name": "Human Geography",
            "display_order": 1
          },
          {
            "id": "top-pre-geo-human-world-2-economic-geography",
            "name": "Economic Geography",
            "display_order": 2
          },
          {
            "id": "top-pre-geo-human-world-3-world-geography",
            "name": "World Geography",
            "display_order": 3
          },
          {
            "id": "top-pre-geo-human-world-4-important-geographical-l",
            "name": "Important Geographical Locations",
            "display_order": 4
          },
          {
            "id": "top-pre-geo-human-world-5-mapping",
            "name": "Mapping",
            "display_order": 5
          }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-eco",
    "name": "Indian Economy",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 4,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-eco-concepts",
        "name": "Basic Economic Concepts & National Income",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-eco-concepts-1-basic-economic-concepts",
            "name": "Basic Economic Concepts",
            "display_order": 1
          },
          {
            "id": "top-pre-eco-concepts-2-national-income",
            "name": "National Income",
            "display_order": 2
          },
          {
            "id": "top-pre-eco-concepts-3-gdp-and-gnp",
            "name": "GDP and GNP",
            "display_order": 3
          },
          {
            "id": "top-pre-eco-concepts-4-inflation",
            "name": "Inflation",
            "display_order": 4
          }
        ]
      },
      {
        "id": "sec-pre-eco-monetary-fiscal",
        "name": "Monetary & Fiscal Policy",
        "display_order": 2,
        "topics": [
          {
            "id": "top-pre-eco-monetary-fiscal-1-monetary-policy",
            "name": "Monetary Policy",
            "display_order": 1
          },
          {
            "id": "top-pre-eco-monetary-fiscal-2-fiscal-policy",
            "name": "Fiscal Policy",
            "display_order": 2
          },
          {
            "id": "top-pre-eco-monetary-fiscal-3-banking",
            "name": "Banking",
            "display_order": 3
          },
          {
            "id": "top-pre-eco-monetary-fiscal-4-rbi",
            "name": "RBI",
            "display_order": 4
          },
          {
            "id": "top-pre-eco-monetary-fiscal-5-financial-markets",
            "name": "Financial Markets",
            "display_order": 5
          },
          {
            "id": "top-pre-eco-monetary-fiscal-6-budget",
            "name": "Budget",
            "display_order": 6
          },
          {
            "id": "top-pre-eco-monetary-fiscal-7-taxation",
            "name": "Taxation",
            "display_order": 7
          },
          {
            "id": "top-pre-eco-monetary-fiscal-8-public-finance",
            "name": "Public Finance",
            "display_order": 8
          }
        ]
      },
      {
        "id": "sec-pre-eco-external",
        "name": "External Sector & Trade",
        "display_order": 3,
        "topics": [
          {
            "id": "top-pre-eco-external-1-external-sector",
            "name": "External Sector",
            "display_order": 1
          },
          {
            "id": "top-pre-eco-external-2-balance-of-payments",
            "name": "Balance of Payments",
            "display_order": 2
          },
          {
            "id": "top-pre-eco-external-3-exchange-rates",
            "name": "Exchange Rates",
            "display_order": 3
          },
          {
            "id": "top-pre-eco-external-4-international-trade",
            "name": "International Trade",
            "display_order": 4
          }
        ]
      },
      {
        "id": "sec-pre-eco-growth-dev",
        "name": "Economic Growth, Poverty & Inclusion",
        "display_order": 4,
        "topics": [
          {
            "id": "top-pre-eco-growth-dev-1-economic-growth",
            "name": "Economic Growth",
            "display_order": 1
          },
          {
            "id": "top-pre-eco-growth-dev-2-economic-development",
            "name": "Economic Development",
            "display_order": 2
          },
          {
            "id": "top-pre-eco-growth-dev-3-poverty",
            "name": "Poverty",
            "display_order": 3
          },
          {
            "id": "top-pre-eco-growth-dev-4-unemployment",
            "name": "Unemployment",
            "display_order": 4
          },
          {
            "id": "top-pre-eco-growth-dev-5-inclusive-growth",
            "name": "Inclusive Growth",
            "display_order": 5
          },
          {
            "id": "top-pre-eco-growth-dev-6-infrastructure",
            "name": "Infrastructure",
            "display_order": 6
          },
          {
            "id": "top-pre-eco-growth-dev-7-financial-inclusion",
            "name": "Financial Inclusion",
            "display_order": 7
          },
          {
            "id": "top-pre-eco-growth-dev-8-government-schemes",
            "name": "Government Schemes",
            "display_order": 8
          }
        ]
      },
      {
        "id": "sec-pre-eco-sectors",
        "name": "Sectors & Economic Reforms",
        "display_order": 5,
        "topics": [
          {
            "id": "top-pre-eco-sectors-1-agriculture",
            "name": "Agriculture",
            "display_order": 1
          },
          {
            "id": "top-pre-eco-sectors-2-industry",
            "name": "Industry",
            "display_order": 2
          },
          {
            "id": "top-pre-eco-sectors-3-services",
            "name": "Services",
            "display_order": 3
          },
          {
            "id": "top-pre-eco-sectors-4-msmes",
            "name": "MSMEs",
            "display_order": 4
          },
          {
            "id": "top-pre-eco-sectors-5-economic-reforms",
            "name": "Economic Reforms",
            "display_order": 5
          },
          {
            "id": "top-pre-eco-sectors-6-liberalization",
            "name": "Liberalization",
            "display_order": 6
          },
          {
            "id": "top-pre-eco-sectors-7-privatization",
            "name": "Privatization",
            "display_order": 7
          },
          {
            "id": "top-pre-eco-sectors-8-globalization",
            "name": "Globalization",
            "display_order": 8
          }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-env",
    "name": "Environment & Ecology",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 5,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-env-ecology",
        "name": "Ecology & Ecosystems",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-env-ecology-1-ecology",
            "name": "Ecology",
            "display_order": 1
          },
          {
            "id": "top-pre-env-ecology-2-ecosystems",
            "name": "Ecosystems",
            "display_order": 2
          },
          {
            "id": "top-pre-env-ecology-3-food-chains",
            "name": "Food Chains",
            "display_order": 3
          },
          {
            "id": "top-pre-env-ecology-4-food-webs",
            "name": "Food Webs",
            "display_order": 4
          },
          {
            "id": "top-pre-env-ecology-5-ecological-pyramids",
            "name": "Ecological Pyramids",
            "display_order": 5
          }
        ]
      },
      {
        "id": "sec-pre-env-bio",
        "name": "Biodiversity & Conservation",
        "display_order": 2,
        "topics": [
          {
            "id": "top-pre-env-bio-1-biodiversity",
            "name": "Biodiversity",
            "display_order": 1
          },
          {
            "id": "top-pre-env-bio-2-species",
            "name": "Species",
            "display_order": 2
          },
          {
            "id": "top-pre-env-bio-3-protected-areas",
            "name": "Protected Areas",
            "display_order": 3
          },
          {
            "id": "top-pre-env-bio-4-national-parks",
            "name": "National Parks",
            "display_order": 4
          },
          {
            "id": "top-pre-env-bio-5-wildlife-sanctuaries",
            "name": "Wildlife Sanctuaries",
            "display_order": 5
          },
          {
            "id": "top-pre-env-bio-6-biosphere-reserves",
            "name": "Biosphere Reserves",
            "display_order": 6
          },
          {
            "id": "top-pre-env-bio-7-conservation",
            "name": "Conservation",
            "display_order": 7
          },
          {
            "id": "top-pre-env-bio-8-forests",
            "name": "Forests",
            "display_order": 8
          },
          {
            "id": "top-pre-env-bio-9-wetlands",
            "name": "Wetlands",
            "display_order": 9
          },
          {
            "id": "top-pre-env-bio-10-marine-ecosystems",
            "name": "Marine Ecosystems",
            "display_order": 10
          }
        ]
      },
      {
        "id": "sec-pre-env-climate-poll",
        "name": "Climate Change & Pollution",
        "display_order": 3,
        "topics": [
          {
            "id": "top-pre-env-climate-poll-1-climate-change",
            "name": "Climate Change",
            "display_order": 1
          },
          {
            "id": "top-pre-env-climate-poll-2-greenhouse-effect",
            "name": "Greenhouse Effect",
            "display_order": 2
          },
          {
            "id": "top-pre-env-climate-poll-3-global-warming",
            "name": "Global Warming",
            "display_order": 3
          },
          {
            "id": "top-pre-env-climate-poll-4-ozone-layer",
            "name": "Ozone Layer",
            "display_order": 4
          },
          {
            "id": "top-pre-env-climate-poll-5-pollution",
            "name": "Pollution",
            "display_order": 5
          },
          {
            "id": "top-pre-env-climate-poll-6-air-pollution",
            "name": "Air Pollution",
            "display_order": 6
          },
          {
            "id": "top-pre-env-climate-poll-7-water-pollution",
            "name": "Water Pollution",
            "display_order": 7
          },
          {
            "id": "top-pre-env-climate-poll-8-soil-pollution",
            "name": "Soil Pollution",
            "display_order": 8
          },
          {
            "id": "top-pre-env-climate-poll-9-waste-management",
            "name": "Waste Management",
            "display_order": 9
          }
        ]
      },
      {
        "id": "sec-pre-env-laws-conv",
        "name": "Environmental Laws & Conventions",
        "display_order": 4,
        "topics": [
          {
            "id": "top-pre-env-laws-conv-1-environmental-laws",
            "name": "Environmental Laws",
            "display_order": 1
          },
          {
            "id": "top-pre-env-laws-conv-2-environmental-organization",
            "name": "Environmental Organizations",
            "display_order": 2
          },
          {
            "id": "top-pre-env-laws-conv-3-international-environmenta",
            "name": "International Environmental Conventions",
            "display_order": 3
          },
          {
            "id": "top-pre-env-laws-conv-4-sustainable-development",
            "name": "Sustainable Development",
            "display_order": 4
          },
          {
            "id": "top-pre-env-laws-conv-5-renewable-energy",
            "name": "Renewable Energy",
            "display_order": 5
          },
          {
            "id": "top-pre-env-laws-conv-6-environmental-impact-asses",
            "name": "Environmental Impact Assessment",
            "display_order": 6
          }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-scitech",
    "name": "Science & Technology",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 6,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-sci-basics",
        "name": "General Science Basics",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-sci-basics-1-physics-basics",
            "name": "Physics Basics",
            "display_order": 1
          },
          {
            "id": "top-pre-sci-basics-2-chemistry-basics",
            "name": "Chemistry Basics",
            "display_order": 2
          },
          {
            "id": "top-pre-sci-basics-3-biology-basics",
            "name": "Biology Basics",
            "display_order": 3
          },
          {
            "id": "top-pre-sci-basics-4-human-biology",
            "name": "Human Biology",
            "display_order": 4
          },
          {
            "id": "top-pre-sci-basics-5-diseases",
            "name": "Diseases",
            "display_order": 5
          }
        ]
      },
      {
        "id": "sec-pre-sci-biotech",
        "name": "Biotechnology & Genetics",
        "display_order": 2,
        "topics": [
          {
            "id": "top-pre-sci-biotech-1-biotechnology",
            "name": "Biotechnology",
            "display_order": 1
          },
          {
            "id": "top-pre-sci-biotech-2-genetics",
            "name": "Genetics",
            "display_order": 2
          },
          {
            "id": "top-pre-sci-biotech-3-biotechnology-applications",
            "name": "Biotechnology Applications",
            "display_order": 3
          }
        ]
      },
      {
        "id": "sec-pre-sci-space-def",
        "name": "Space, Defence & Nuclear Technology",
        "display_order": 3,
        "topics": [
          {
            "id": "top-pre-sci-space-def-1-space-technology",
            "name": "Space Technology",
            "display_order": 1
          },
          {
            "id": "top-pre-sci-space-def-2-satellites",
            "name": "Satellites",
            "display_order": 2
          },
          {
            "id": "top-pre-sci-space-def-3-isro",
            "name": "ISRO",
            "display_order": 3
          },
          {
            "id": "top-pre-sci-space-def-4-defence-technology",
            "name": "Defence Technology",
            "display_order": 4
          },
          {
            "id": "top-pre-sci-space-def-5-nuclear-technology",
            "name": "Nuclear Technology",
            "display_order": 5
          }
        ]
      },
      {
        "id": "sec-pre-sci-it-emerging",
        "name": "IT & Emerging Technologies",
        "display_order": 4,
        "topics": [
          {
            "id": "top-pre-sci-it-emerging-1-nanotechnology",
            "name": "Nanotechnology",
            "display_order": 1
          },
          {
            "id": "top-pre-sci-it-emerging-2-artificial-intelligence",
            "name": "Artificial Intelligence",
            "display_order": 2
          },
          {
            "id": "top-pre-sci-it-emerging-3-robotics",
            "name": "Robotics",
            "display_order": 3
          },
          {
            "id": "top-pre-sci-it-emerging-4-information-technology",
            "name": "Information Technology",
            "display_order": 4
          },
          {
            "id": "top-pre-sci-it-emerging-5-communication-technology",
            "name": "Communication Technology",
            "display_order": 5
          },
          {
            "id": "top-pre-sci-it-emerging-6-semiconductor-technology",
            "name": "Semiconductor Technology",
            "display_order": 6
          },
          {
            "id": "top-pre-sci-it-emerging-7-emerging-technologies",
            "name": "Emerging Technologies",
            "display_order": 7
          }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-ca",
    "name": "Current Affairs",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 7,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-ca-cat",
        "name": "Current Affairs Categories",
        "display_order": 1,
        "topics": [
          {
            "id": "top-pre-ca-cat-1-national",
            "name": "National",
            "display_order": 1
          },
          {
            "id": "top-pre-ca-cat-2-international",
            "name": "International",
            "display_order": 2
          },
          {
            "id": "top-pre-ca-cat-3-economy",
            "name": "Economy",
            "display_order": 3
          },
          {
            "id": "top-pre-ca-cat-4-polity",
            "name": "Polity",
            "display_order": 4
          },
          {
            "id": "top-pre-ca-cat-5-environment",
            "name": "Environment",
            "display_order": 5
          },
          {
            "id": "top-pre-ca-cat-6-science-technology",
            "name": "Science & Technology",
            "display_order": 6
          },
          {
            "id": "top-pre-ca-cat-7-defence",
            "name": "Defence",
            "display_order": 7
          },
          {
            "id": "top-pre-ca-cat-8-government-schemes",
            "name": "Government Schemes",
            "display_order": 8
          },
          {
            "id": "top-pre-ca-cat-9-reports-indices",
            "name": "Reports & Indices",
            "display_order": 9
          },
          {
            "id": "top-pre-ca-cat-10-awards",
            "name": "Awards",
            "display_order": 10
          },
          {
            "id": "top-pre-ca-cat-11-important-personalities",
            "name": "Important Personalities",
            "display_order": 11
          },
          {
            "id": "top-pre-ca-cat-12-places-in-news",
            "name": "Places in News",
            "display_order": 12
          },
          {
            "id": "top-pre-ca-cat-13-international-organizations",
            "name": "International Organizations",
            "display_order": 13
          }
        ]
      }
    ]
  },
  {
    "id": "subj-pre-csat",
    "name": "CSAT (General Studies Paper II)",
    "exam": "Prelims",
    "paper": "General",
    "display_order": 8,
    "active": true,
    "sections": [
      {
        "id": "sec-pre-csat-rc",
        "name": "Comprehension",
        "display_order": 1,
        "topics": [
          { "id": "top-pre-csat-rc-1-rc-short", "name": "Short & Medium Passages", "display_order": 1 },
          { "id": "top-pre-csat-rc-2-rc-critical", "name": "Critical Reasoning & Inferences", "display_order": 2 },
          { "id": "top-pre-csat-rc-3-rc-assumption", "name": "Assumptions & Main Ideas", "display_order": 3 }
        ]
      },
      {
        "id": "sec-pre-csat-interpersonal",
        "name": "Interpersonal Skills & Communication",
        "display_order": 2,
        "topics": [
          { "id": "top-pre-csat-interpersonal-1", "name": "Communication Dynamics", "display_order": 1 },
          { "id": "top-pre-csat-interpersonal-2", "name": "Interpersonal Conflict & Teamwork", "display_order": 2 }
        ]
      },
      {
        "id": "sec-pre-csat-reasoning",
        "name": "Logical Reasoning & Analytical Ability",
        "display_order": 3,
        "topics": [
          { "id": "top-pre-csat-reasoning-1-logical-reasoning", "name": "Syllogisms, Deductions & Statements", "display_order": 1 },
          { "id": "top-pre-csat-reasoning-2-analytical-ability", "name": "Seating Arrangement & Blood Relations", "display_order": 2 },
          { "id": "top-pre-csat-reasoning-3-coding-series", "name": "Coding-Decoding, Series & Sequences", "display_order": 3 },
          { "id": "top-pre-csat-reasoning-4-clocks-calendars", "name": "Directions, Clocks, Calendars & Puzzles", "display_order": 4 }
        ]
      },
      {
        "id": "sec-pre-csat-decision",
        "name": "Decision-Making & Problem-Solving",
        "display_order": 4,
        "topics": [
          { "id": "top-pre-csat-decision-1", "name": "Administrative & Ethical Dilemmas", "display_order": 1 },
          { "id": "top-pre-csat-decision-2", "name": "Problem Evaluation & Priority Setting", "display_order": 2 }
        ]
      },
      {
        "id": "sec-pre-csat-num",
        "name": "Basic Numeracy (Class X Level)",
        "display_order": 5,
        "topics": [
          { "id": "top-pre-csat-num-2-number-system", "name": "Number System, Divisibility, LCM & HCF", "display_order": 1 },
          { "id": "top-pre-csat-num-3-percentage", "name": "Percentages & Fractions", "display_order": 2 },
          { "id": "top-pre-csat-num-4-profit-loss", "name": "Profit, Loss & Discount", "display_order": 3 },
          { "id": "top-pre-csat-num-5-ratio-proportion", "name": "Ratio, Proportion & Partnerships", "display_order": 4 },
          { "id": "top-pre-csat-num-6-average", "name": "Averages, Ages & Mixtures", "display_order": 5 },
          { "id": "top-pre-csat-num-7-time-work", "name": "Time, Work, Pipes & Cisterns", "display_order": 6 },
          { "id": "top-pre-csat-num-8-time-speed-distance", "name": "Speed, Distance, Trains & Boats", "display_order": 7 },
          { "id": "top-pre-csat-num-9-permutation-comb", "name": "Permutations, Combinations & Probability", "display_order": 8 }
        ]
      },
      {
        "id": "sec-pre-csat-di",
        "name": "Data Interpretation & Sufficiency",
        "display_order": 6,
        "topics": [
          { "id": "top-pre-csat-num-10-data-interpretation", "name": "Charts, Graphs, Tables & Pie Charts", "display_order": 1 },
          { "id": "top-pre-csat-num-11-data-sufficiency", "name": "Data Sufficiency Statements", "display_order": 2 }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs1-culture",
    "name": "Indian Heritage & Culture",
    "exam": "Mains",
    "paper": "GS1",
    "display_order": 101,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs1-culture",
        "name": "Art, Architecture & Cultural Traditions",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs1-culture-1-architecture",
            "name": "Architecture",
            "display_order": 1
          },
          {
            "id": "top-mains-gs1-culture-2-sculpture",
            "name": "Sculpture",
            "display_order": 2
          },
          {
            "id": "top-mains-gs1-culture-3-paintings",
            "name": "Paintings",
            "display_order": 3
          },
          {
            "id": "top-mains-gs1-culture-4-literature",
            "name": "Literature",
            "display_order": 4
          },
          {
            "id": "top-mains-gs1-culture-5-music",
            "name": "Music",
            "display_order": 5
          },
          {
            "id": "top-mains-gs1-culture-6-dance",
            "name": "Dance",
            "display_order": 6
          },
          {
            "id": "top-mains-gs1-culture-7-theatre",
            "name": "Theatre",
            "display_order": 7
          },
          {
            "id": "top-mains-gs1-culture-8-religion-and-philosophy",
            "name": "Religion and Philosophy",
            "display_order": 8
          },
          {
            "id": "top-mains-gs1-culture-9-cultural-traditions",
            "name": "Cultural Traditions",
            "display_order": 9
          },
          {
            "id": "top-mains-gs1-culture-10-unesco-heritage",
            "name": "UNESCO Heritage",
            "display_order": 10
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs1-history",
    "name": "Modern Indian History",
    "exam": "Mains",
    "paper": "GS1",
    "display_order": 102,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs1-hist",
        "name": "British Rule & National Movement",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs1-hist-1-british-rule",
            "name": "British Rule",
            "display_order": 1
          },
          {
            "id": "top-mains-gs1-hist-2-economic-impact-of-british-ru",
            "name": "Economic Impact of British Rule",
            "display_order": 2
          },
          {
            "id": "top-mains-gs1-hist-3-revolt-of-1857",
            "name": "Revolt of 1857",
            "display_order": 3
          },
          {
            "id": "top-mains-gs1-hist-4-social-reform",
            "name": "Social Reform",
            "display_order": 4
          },
          {
            "id": "top-mains-gs1-hist-5-national-movement",
            "name": "National Movement",
            "display_order": 5
          },
          {
            "id": "top-mains-gs1-hist-6-gandhian-era",
            "name": "Gandhian Era",
            "display_order": 6
          },
          {
            "id": "top-mains-gs1-hist-7-revolutionary-movement",
            "name": "Revolutionary Movement",
            "display_order": 7
          },
          {
            "id": "top-mains-gs1-hist-8-constitutional-development",
            "name": "Constitutional Development",
            "display_order": 8
          },
          {
            "id": "top-mains-gs1-hist-9-independence-and-partition",
            "name": "Independence and Partition",
            "display_order": 9
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs1-world",
    "name": "World History",
    "exam": "Mains",
    "paper": "GS1",
    "display_order": 103,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs1-world",
        "name": "Major Events & Political Ideologies",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs1-world-1-renaissance",
            "name": "Renaissance",
            "display_order": 1
          },
          {
            "id": "top-mains-gs1-world-2-reformation",
            "name": "Reformation",
            "display_order": 2
          },
          {
            "id": "top-mains-gs1-world-3-enlightenment",
            "name": "Enlightenment",
            "display_order": 3
          },
          {
            "id": "top-mains-gs1-world-4-american-revolution",
            "name": "American Revolution",
            "display_order": 4
          },
          {
            "id": "top-mains-gs1-world-5-french-revolution",
            "name": "French Revolution",
            "display_order": 5
          },
          {
            "id": "top-mains-gs1-world-6-industrial-revolution",
            "name": "Industrial Revolution",
            "display_order": 6
          },
          {
            "id": "top-mains-gs1-world-7-nationalism",
            "name": "Nationalism",
            "display_order": 7
          },
          {
            "id": "top-mains-gs1-world-8-unification-of-europe",
            "name": "Unification of Europe",
            "display_order": 8
          },
          {
            "id": "top-mains-gs1-world-9-unification-of-germany",
            "name": "Unification of Germany",
            "display_order": 9
          },
          {
            "id": "top-mains-gs1-world-10-unification-of-italy",
            "name": "Unification of Italy",
            "display_order": 10
          },
          {
            "id": "top-mains-gs1-world-11-imperialism",
            "name": "Imperialism",
            "display_order": 11
          },
          {
            "id": "top-mains-gs1-world-12-colonialism",
            "name": "Colonialism",
            "display_order": 12
          },
          {
            "id": "top-mains-gs1-world-13-world-war-i",
            "name": "World War I",
            "display_order": 13
          },
          {
            "id": "top-mains-gs1-world-14-russian-revolution",
            "name": "Russian Revolution",
            "display_order": 14
          },
          {
            "id": "top-mains-gs1-world-15-world-war-ii",
            "name": "World War II",
            "display_order": 15
          },
          {
            "id": "top-mains-gs1-world-16-decolonization",
            "name": "Decolonization",
            "display_order": 16
          },
          {
            "id": "top-mains-gs1-world-17-cold-war",
            "name": "Cold War",
            "display_order": 17
          },
          {
            "id": "top-mains-gs1-world-18-political-ideologies",
            "name": "Political Ideologies",
            "display_order": 18
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs1-society",
    "name": "Indian Society",
    "exam": "Mains",
    "paper": "GS1",
    "display_order": 104,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs1-society",
        "name": "Social Structure, Diversity & Issues",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs1-society-1-salient-features",
            "name": "Salient Features",
            "display_order": 1
          },
          {
            "id": "top-mains-gs1-society-2-diversity",
            "name": "Diversity",
            "display_order": 2
          },
          {
            "id": "top-mains-gs1-society-3-women",
            "name": "Women",
            "display_order": 3
          },
          {
            "id": "top-mains-gs1-society-4-population",
            "name": "Population",
            "display_order": 4
          },
          {
            "id": "top-mains-gs1-society-5-poverty",
            "name": "Poverty",
            "display_order": 5
          },
          {
            "id": "top-mains-gs1-society-6-urbanization",
            "name": "Urbanization",
            "display_order": 6
          },
          {
            "id": "top-mains-gs1-society-7-globalization",
            "name": "Globalization",
            "display_order": 7
          },
          {
            "id": "top-mains-gs1-society-8-communalism",
            "name": "Communalism",
            "display_order": 8
          },
          {
            "id": "top-mains-gs1-society-9-regionalism",
            "name": "Regionalism",
            "display_order": 9
          },
          {
            "id": "top-mains-gs1-society-10-secularism",
            "name": "Secularism",
            "display_order": 10
          },
          {
            "id": "top-mains-gs1-society-11-social-empowerment",
            "name": "Social Empowerment",
            "display_order": 11
          },
          {
            "id": "top-mains-gs1-society-12-social-issues",
            "name": "Social Issues",
            "display_order": 12
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs1-geo",
    "name": "Geography",
    "exam": "Mains",
    "paper": "GS1",
    "display_order": 105,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs1-geo",
        "name": "World & Indian Geography (Mains)",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs1-geo-1-distribution-of-key-natural-re",
            "name": "Distribution of Key Natural Resources",
            "display_order": 1
          },
          {
            "id": "top-mains-gs1-geo-2-factors-responsible-for-locati",
            "name": "Factors Responsible for Location of Industries",
            "display_order": 2
          },
          {
            "id": "top-mains-gs1-geo-3-important-geophysical-phenomen",
            "name": "Important Geophysical Phenomena",
            "display_order": 3
          },
          {
            "id": "top-mains-gs1-geo-4-geographical-features-and-envi",
            "name": "Geographical Features and Environmental Changes",
            "display_order": 4
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs2-const",
    "name": "Constitution",
    "exam": "Mains",
    "paper": "GS2",
    "display_order": 201,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs2-const",
        "name": "Constitutional Framework & Organs",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs2-const-1-constitutional-framework",
            "name": "Constitutional Framework",
            "display_order": 1
          },
          {
            "id": "top-mains-gs2-const-2-constitutional-amendments",
            "name": "Constitutional Amendments",
            "display_order": 2
          },
          {
            "id": "top-mains-gs2-const-3-federalism",
            "name": "Federalism",
            "display_order": 3
          },
          {
            "id": "top-mains-gs2-const-4-separation-of-powers",
            "name": "Separation of Powers",
            "display_order": 4
          },
          {
            "id": "top-mains-gs2-const-5-parliament",
            "name": "Parliament",
            "display_order": 5
          },
          {
            "id": "top-mains-gs2-const-6-judiciary",
            "name": "Judiciary",
            "display_order": 6
          },
          {
            "id": "top-mains-gs2-const-7-executive",
            "name": "Executive",
            "display_order": 7
          },
          {
            "id": "top-mains-gs2-const-8-constitutional-bodies",
            "name": "Constitutional Bodies",
            "display_order": 8
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs2-gov",
    "name": "Polity & Governance",
    "exam": "Mains",
    "paper": "GS2",
    "display_order": 202,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs2-gov",
        "name": "Governance & Accountability",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs2-gov-1-parliament",
            "name": "Parliament",
            "display_order": 1
          },
          {
            "id": "top-mains-gs2-gov-2-executive",
            "name": "Executive",
            "display_order": 2
          },
          {
            "id": "top-mains-gs2-gov-3-judiciary",
            "name": "Judiciary",
            "display_order": 3
          },
          {
            "id": "top-mains-gs2-gov-4-elections",
            "name": "Elections",
            "display_order": 4
          },
          {
            "id": "top-mains-gs2-gov-5-governance",
            "name": "Governance",
            "display_order": 5
          },
          {
            "id": "top-mains-gs2-gov-6-transparency",
            "name": "Transparency",
            "display_order": 6
          },
          {
            "id": "top-mains-gs2-gov-7-accountability",
            "name": "Accountability",
            "display_order": 7
          },
          {
            "id": "top-mains-gs2-gov-8-e-governance",
            "name": "E-Governance",
            "display_order": 8
          },
          {
            "id": "top-mains-gs2-gov-9-civil-services",
            "name": "Civil Services",
            "display_order": 9
          },
          {
            "id": "top-mains-gs2-gov-10-ngos",
            "name": "NGOs",
            "display_order": 10
          },
          {
            "id": "top-mains-gs2-gov-11-pressure-groups",
            "name": "Pressure Groups",
            "display_order": 11
          },
          {
            "id": "top-mains-gs2-gov-12-citizen-charters",
            "name": "Citizen Charters",
            "display_order": 12
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs2-socjus",
    "name": "Social Justice",
    "exam": "Mains",
    "paper": "GS2",
    "display_order": 203,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs2-socjus",
        "name": "Social Welfare & Human Development",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs2-socjus-1-health",
            "name": "Health",
            "display_order": 1
          },
          {
            "id": "top-mains-gs2-socjus-2-education",
            "name": "Education",
            "display_order": 2
          },
          {
            "id": "top-mains-gs2-socjus-3-poverty",
            "name": "Poverty",
            "display_order": 3
          },
          {
            "id": "top-mains-gs2-socjus-4-hunger",
            "name": "Hunger",
            "display_order": 4
          },
          {
            "id": "top-mains-gs2-socjus-5-vulnerable-sections",
            "name": "Vulnerable Sections",
            "display_order": 5
          },
          {
            "id": "top-mains-gs2-socjus-6-welfare-schemes",
            "name": "Welfare Schemes",
            "display_order": 6
          },
          {
            "id": "top-mains-gs2-socjus-7-social-sector",
            "name": "Social Sector",
            "display_order": 7
          },
          {
            "id": "top-mains-gs2-socjus-8-human-development",
            "name": "Human Development",
            "display_order": 8
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs2-ir",
    "name": "International Relations",
    "exam": "Mains",
    "paper": "GS2",
    "display_order": 204,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs2-ir",
        "name": "Foreign Policy & International Institutions",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs2-ir-1-india-and-neighbours",
            "name": "India and Neighbours",
            "display_order": 1
          },
          {
            "id": "top-mains-gs2-ir-2-india-and-major-powers",
            "name": "India and Major Powers",
            "display_order": 2
          },
          {
            "id": "top-mains-gs2-ir-3-regional-organizations",
            "name": "Regional Organizations",
            "display_order": 3
          },
          {
            "id": "top-mains-gs2-ir-4-international-organizations",
            "name": "International Organizations",
            "display_order": 4
          },
          {
            "id": "top-mains-gs2-ir-5-united-nations",
            "name": "United Nations",
            "display_order": 5
          },
          {
            "id": "top-mains-gs2-ir-6-wto",
            "name": "WTO",
            "display_order": 6
          },
          {
            "id": "top-mains-gs2-ir-7-imf",
            "name": "IMF",
            "display_order": 7
          },
          {
            "id": "top-mains-gs2-ir-8-world-bank",
            "name": "World Bank",
            "display_order": 8
          },
          {
            "id": "top-mains-gs2-ir-9-bilateral-relations",
            "name": "Bilateral Relations",
            "display_order": 9
          },
          {
            "id": "top-mains-gs2-ir-10-multilateral-relations",
            "name": "Multilateral Relations",
            "display_order": 10
          },
          {
            "id": "top-mains-gs2-ir-11-global-issues",
            "name": "Global Issues",
            "display_order": 11
          },
          {
            "id": "top-mains-gs2-ir-12-indian-diaspora",
            "name": "Indian Diaspora",
            "display_order": 12
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs3-eco",
    "name": "Economy",
    "exam": "Mains",
    "paper": "GS3",
    "display_order": 301,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs3-eco",
        "name": "Economic Growth & Public Finance",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs3-eco-1-growth",
            "name": "Growth",
            "display_order": 1
          },
          {
            "id": "top-mains-gs3-eco-2-development",
            "name": "Development",
            "display_order": 2
          },
          {
            "id": "top-mains-gs3-eco-3-employment",
            "name": "Employment",
            "display_order": 3
          },
          {
            "id": "top-mains-gs3-eco-4-inclusive-growth",
            "name": "Inclusive Growth",
            "display_order": 4
          },
          {
            "id": "top-mains-gs3-eco-5-budget",
            "name": "Budget",
            "display_order": 5
          },
          {
            "id": "top-mains-gs3-eco-6-taxation",
            "name": "Taxation",
            "display_order": 6
          },
          {
            "id": "top-mains-gs3-eco-7-infrastructure",
            "name": "Infrastructure",
            "display_order": 7
          },
          {
            "id": "top-mains-gs3-eco-8-investment",
            "name": "Investment",
            "display_order": 8
          },
          {
            "id": "top-mains-gs3-eco-9-banking",
            "name": "Banking",
            "display_order": 9
          },
          {
            "id": "top-mains-gs3-eco-10-financial-markets",
            "name": "Financial Markets",
            "display_order": 10
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs3-agri",
    "name": "Agriculture",
    "exam": "Mains",
    "paper": "GS3",
    "display_order": 302,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs3-agri",
        "name": "Cropping, Tech & Food Security",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs3-agri-1-cropping-patterns",
            "name": "Cropping Patterns",
            "display_order": 1
          },
          {
            "id": "top-mains-gs3-agri-2-irrigation",
            "name": "Irrigation",
            "display_order": 2
          },
          {
            "id": "top-mains-gs3-agri-3-agricultural-marketing",
            "name": "Agricultural Marketing",
            "display_order": 3
          },
          {
            "id": "top-mains-gs3-agri-4-msp",
            "name": "MSP",
            "display_order": 4
          },
          {
            "id": "top-mains-gs3-agri-5-food-processing",
            "name": "Food Processing",
            "display_order": 5
          },
          {
            "id": "top-mains-gs3-agri-6-land-reforms",
            "name": "Land Reforms",
            "display_order": 6
          },
          {
            "id": "top-mains-gs3-agri-7-subsidies",
            "name": "Subsidies",
            "display_order": 7
          },
          {
            "id": "top-mains-gs3-agri-8-agricultural-technology",
            "name": "Agricultural Technology",
            "display_order": 8
          },
          {
            "id": "top-mains-gs3-agri-9-animal-husbandry",
            "name": "Animal Husbandry",
            "display_order": 9
          },
          {
            "id": "top-mains-gs3-agri-10-fisheries",
            "name": "Fisheries",
            "display_order": 10
          },
          {
            "id": "top-mains-gs3-agri-11-food-security",
            "name": "Food Security",
            "display_order": 11
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs3-scitech",
    "name": "Science & Technology",
    "exam": "Mains",
    "paper": "GS3",
    "display_order": 303,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs3-scitech",
        "name": "Technological Developments & Applications",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs3-scitech-1-space",
            "name": "Space",
            "display_order": 1
          },
          {
            "id": "top-mains-gs3-scitech-2-biotechnology",
            "name": "Biotechnology",
            "display_order": 2
          },
          {
            "id": "top-mains-gs3-scitech-3-nanotechnology",
            "name": "Nanotechnology",
            "display_order": 3
          },
          {
            "id": "top-mains-gs3-scitech-4-ai",
            "name": "AI",
            "display_order": 4
          },
          {
            "id": "top-mains-gs3-scitech-5-robotics",
            "name": "Robotics",
            "display_order": 5
          },
          {
            "id": "top-mains-gs3-scitech-6-defence-technology",
            "name": "Defence Technology",
            "display_order": 6
          },
          {
            "id": "top-mains-gs3-scitech-7-cyber-technology",
            "name": "Cyber Technology",
            "display_order": 7
          },
          {
            "id": "top-mains-gs3-scitech-8-emerging-technologies",
            "name": "Emerging Technologies",
            "display_order": 8
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs3-env",
    "name": "Environment",
    "exam": "Mains",
    "paper": "GS3",
    "display_order": 304,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs3-env",
        "name": "Ecology & Climate Action",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs3-env-1-biodiversity",
            "name": "Biodiversity",
            "display_order": 1
          },
          {
            "id": "top-mains-gs3-env-2-conservation",
            "name": "Conservation",
            "display_order": 2
          },
          {
            "id": "top-mains-gs3-env-3-climate-change",
            "name": "Climate Change",
            "display_order": 3
          },
          {
            "id": "top-mains-gs3-env-4-pollution",
            "name": "Pollution",
            "display_order": 4
          },
          {
            "id": "top-mains-gs3-env-5-environmental-governance",
            "name": "Environmental Governance",
            "display_order": 5
          },
          {
            "id": "top-mains-gs3-env-6-renewable-energy",
            "name": "Renewable Energy",
            "display_order": 6
          },
          {
            "id": "top-mains-gs3-env-7-sustainable-development",
            "name": "Sustainable Development",
            "display_order": 7
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs3-dm",
    "name": "Disaster Management",
    "exam": "Mains",
    "paper": "GS3",
    "display_order": 305,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs3-dm",
        "name": "Disaster Preparedness & Response",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs3-dm-1-disaster-types",
            "name": "Disaster Types",
            "display_order": 1
          },
          {
            "id": "top-mains-gs3-dm-2-disaster-preparedness",
            "name": "Disaster Preparedness",
            "display_order": 2
          },
          {
            "id": "top-mains-gs3-dm-3-mitigation",
            "name": "Mitigation",
            "display_order": 3
          },
          {
            "id": "top-mains-gs3-dm-4-response",
            "name": "Response",
            "display_order": 4
          },
          {
            "id": "top-mains-gs3-dm-5-recovery",
            "name": "Recovery",
            "display_order": 5
          },
          {
            "id": "top-mains-gs3-dm-6-institutional-framework",
            "name": "Institutional Framework",
            "display_order": 6
          },
          {
            "id": "top-mains-gs3-dm-7-ndma",
            "name": "NDMA",
            "display_order": 7
          },
          {
            "id": "top-mains-gs3-dm-8-sendai-framework",
            "name": "Sendai Framework",
            "display_order": 8
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs3-sec",
    "name": "Internal Security",
    "exam": "Mains",
    "paper": "GS3",
    "display_order": 306,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs3-sec",
        "name": "Security Challenges & Forces",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs3-sec-1-terrorism",
            "name": "Terrorism",
            "display_order": 1
          },
          {
            "id": "top-mains-gs3-sec-2-extremism",
            "name": "Extremism",
            "display_order": 2
          },
          {
            "id": "top-mains-gs3-sec-3-insurgency",
            "name": "Insurgency",
            "display_order": 3
          },
          {
            "id": "top-mains-gs3-sec-4-cyber-security",
            "name": "Cyber Security",
            "display_order": 4
          },
          {
            "id": "top-mains-gs3-sec-5-money-laundering",
            "name": "Money Laundering",
            "display_order": 5
          },
          {
            "id": "top-mains-gs3-sec-6-border-management",
            "name": "Border Management",
            "display_order": 6
          },
          {
            "id": "top-mains-gs3-sec-7-organized-crime",
            "name": "Organized Crime",
            "display_order": 7
          },
          {
            "id": "top-mains-gs3-sec-8-security-forces",
            "name": "Security Forces",
            "display_order": 8
          },
          {
            "id": "top-mains-gs3-sec-9-maritime-security",
            "name": "Maritime Security",
            "display_order": 9
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-gs4-ethics",
    "name": "Ethics, Integrity & Aptitude",
    "exam": "Mains",
    "paper": "GS4",
    "display_order": 401,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-gs4-interface",
        "name": "Ethics & Human Interface",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-gs4-interface-1-ethics",
            "name": "Ethics",
            "display_order": 1
          },
          {
            "id": "top-mains-gs4-interface-2-morality",
            "name": "Morality",
            "display_order": 2
          },
          {
            "id": "top-mains-gs4-interface-3-human-values",
            "name": "Human Values",
            "display_order": 3
          },
          {
            "id": "top-mains-gs4-interface-4-ethical-dilemmas",
            "name": "Ethical Dilemmas",
            "display_order": 4
          },
          {
            "id": "top-mains-gs4-interface-5-attitude",
            "name": "Attitude",
            "display_order": 5
          },
          {
            "id": "top-mains-gs4-interface-6-emotional-intelligence",
            "name": "Emotional Intelligence",
            "display_order": 6
          }
        ]
      },
      {
        "id": "sec-mains-gs4-thinkers",
        "name": "Thinkers",
        "display_order": 2,
        "topics": [
          {
            "id": "top-mains-gs4-thinkers-1-indian-thinkers",
            "name": "Indian Thinkers",
            "display_order": 1
          },
          {
            "id": "top-mains-gs4-thinkers-2-western-thinkers",
            "name": "Western Thinkers",
            "display_order": 2
          },
          {
            "id": "top-mains-gs4-thinkers-3-philosophical-ideas",
            "name": "Philosophical Ideas",
            "display_order": 3
          }
        ]
      },
      {
        "id": "sec-mains-gs4-pubadmin",
        "name": "Public Administration Ethics",
        "display_order": 3,
        "topics": [
          {
            "id": "top-mains-gs4-pubadmin-1-integrity",
            "name": "Integrity",
            "display_order": 1
          },
          {
            "id": "top-mains-gs4-pubadmin-2-impartiality",
            "name": "Impartiality",
            "display_order": 2
          },
          {
            "id": "top-mains-gs4-pubadmin-3-objectivity",
            "name": "Objectivity",
            "display_order": 3
          },
          {
            "id": "top-mains-gs4-pubadmin-4-accountability",
            "name": "Accountability",
            "display_order": 4
          },
          {
            "id": "top-mains-gs4-pubadmin-5-transparency",
            "name": "Transparency",
            "display_order": 5
          },
          {
            "id": "top-mains-gs4-pubadmin-6-code-of-conduct",
            "name": "Code of Conduct",
            "display_order": 6
          },
          {
            "id": "top-mains-gs4-pubadmin-7-code-of-ethics",
            "name": "Code of Ethics",
            "display_order": 7
          },
          {
            "id": "top-mains-gs4-pubadmin-8-corruption",
            "name": "Corruption",
            "display_order": 8
          },
          {
            "id": "top-mains-gs4-pubadmin-9-probity",
            "name": "Probity",
            "display_order": 9
          }
        ]
      },
      {
        "id": "sec-mains-gs4-cases",
        "name": "Case Studies",
        "display_order": 4,
        "topics": [
          {
            "id": "top-mains-gs4-cases-1-ethical-dilemmas",
            "name": "Ethical Dilemmas",
            "display_order": 1
          },
          {
            "id": "top-mains-gs4-cases-2-administrative-cases",
            "name": "Administrative Cases",
            "display_order": 2
          },
          {
            "id": "top-mains-gs4-cases-3-conflict-of-interest",
            "name": "Conflict of Interest",
            "display_order": 3
          },
          {
            "id": "top-mains-gs4-cases-4-public-service-values",
            "name": "Public Service Values",
            "display_order": 4
          },
          {
            "id": "top-mains-gs4-cases-5-decision-making",
            "name": "Decision Making",
            "display_order": 5
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-essay",
    "name": "Essay",
    "exam": "Mains",
    "paper": "Essay",
    "display_order": 501,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-essay-themes",
        "name": "Broad Essay Themes",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-essay-themes-1-society",
            "name": "Society",
            "display_order": 1
          },
          {
            "id": "top-mains-essay-themes-2-economy",
            "name": "Economy",
            "display_order": 2
          },
          {
            "id": "top-mains-essay-themes-3-governance",
            "name": "Governance",
            "display_order": 3
          },
          {
            "id": "top-mains-essay-themes-4-politics",
            "name": "Politics",
            "display_order": 4
          },
          {
            "id": "top-mains-essay-themes-5-philosophy",
            "name": "Philosophy",
            "display_order": 5
          },
          {
            "id": "top-mains-essay-themes-6-ethics",
            "name": "Ethics",
            "display_order": 6
          },
          {
            "id": "top-mains-essay-themes-7-science-technology",
            "name": "Science & Technology",
            "display_order": 7
          },
          {
            "id": "top-mains-essay-themes-8-environment",
            "name": "Environment",
            "display_order": 8
          },
          {
            "id": "top-mains-essay-themes-9-education",
            "name": "Education",
            "display_order": 9
          },
          {
            "id": "top-mains-essay-themes-10-women",
            "name": "Women",
            "display_order": 10
          },
          {
            "id": "top-mains-essay-themes-11-international-relations",
            "name": "International Relations",
            "display_order": 11
          },
          {
            "id": "top-mains-essay-themes-12-democracy",
            "name": "Democracy",
            "display_order": 12
          },
          {
            "id": "top-mains-essay-themes-13-development",
            "name": "Development",
            "display_order": 13
          },
          {
            "id": "top-mains-essay-themes-14-social-issues",
            "name": "Social Issues",
            "display_order": 14
          }
        ]
      }
    ]
  },
  {
    "id": "subj-mains-optional",
    "name": "Optional Subject",
    "exam": "Mains",
    "paper": "Optional",
    "display_order": 601,
    "active": true,
    "sections": [
      {
        "id": "sec-mains-opt-paper1",
        "name": "Paper I (Theory & Foundations)",
        "display_order": 1,
        "topics": [
          {
            "id": "top-mains-opt-paper1-1-foundations-core-concepts",
            "name": "Foundations & Core Concepts",
            "display_order": 1
          },
          {
            "id": "top-mains-opt-paper1-2-advanced-theories-models",
            "name": "Advanced Theories & Models",
            "display_order": 2
          },
          {
            "id": "top-mains-opt-paper1-3-thinkers-major-contribution",
            "name": "Thinkers & Major Contributions",
            "display_order": 3
          },
          {
            "id": "top-mains-opt-paper1-4-applied-approaches-methods",
            "name": "Applied Approaches & Methods",
            "display_order": 4
          }
        ]
      },
      {
        "id": "sec-mains-opt-paper2",
        "name": "Paper II (Indian Context & Application)",
        "display_order": 2,
        "topics": [
          {
            "id": "top-mains-opt-paper2-1-historical-institutional-ev",
            "name": "Historical & Institutional Evolution",
            "display_order": 1
          },
          {
            "id": "top-mains-opt-paper2-2-indian-perspective-dimensio",
            "name": "Indian Perspective & Dimensions",
            "display_order": 2
          },
          {
            "id": "top-mains-opt-paper2-3-contemporary-policies-issue",
            "name": "Contemporary Policies & Issues",
            "display_order": 3
          },
          {
            "id": "top-mains-opt-paper2-4-case-studies-empirical-anal",
            "name": "Case Studies & Empirical Analysis",
            "display_order": 4
          }
        ]
      }
    ]
  }
];

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
