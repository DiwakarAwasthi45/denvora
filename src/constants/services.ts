export interface DefaultService {
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
}

export const SERVICE_CATEGORIES = [
  "Consultation",
  "Diagnostic",
  "Preventive",
  "Restorative",
  "Endodontics",
  "Surgery",
  "Prosthodontics",
  "Orthodontics",
  "Pediatric",
  "Periodontics",
  "Implantology",
  "Cosmetic",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/**
 * Default catalog seeded for every clinic during onboarding.
 * Prices are in the clinic's configured currency (NPR by default) and can
 * be edited by the clinic later.
 */
export const DEFAULT_SERVICES: DefaultService[] = [
  { name: "Consultation & Checkup", category: "Consultation", price: 500, durationMinutes: 20 },
  { name: "Consultation & Checkup (Children)", category: "Pediatric", price: 400, durationMinutes: 20 },
  { name: "Digital X-Ray (Single)", category: "Diagnostic", price: 600, durationMinutes: 10 },
  { name: "OPG (Panoramic X-Ray)", category: "Diagnostic", price: 1500, durationMinutes: 15 },
  { name: "Teeth Scaling & Polishing", category: "Preventive", price: 2000, durationMinutes: 45 },
  { name: "Fluoride Application", category: "Preventive", price: 800, durationMinutes: 20 },
  { name: "Pit & Fissure Sealant (per tooth)", category: "Preventive", price: 500, durationMinutes: 15 },
  { name: "Dental Filling (Composite)", category: "Restorative", price: 2500, durationMinutes: 40 },
  { name: "Dental Filling (GIC)", category: "Restorative", price: 1500, durationMinutes: 30 },
  { name: "Glass Ionomer Cement Filling", category: "Restorative", price: 1500, durationMinutes: 30 },
  { name: "Root Canal Treatment (Front Tooth)", category: "Endodontics", price: 5000, durationMinutes: 60 },
  { name: "Root Canal Treatment (Premolar)", category: "Endodontics", price: 6000, durationMinutes: 60 },
  { name: "Root Canal Treatment (Molar)", category: "Endodontics", price: 8000, durationMinutes: 75 },
  { name: "Tooth Extraction (Simple)", category: "Surgery", price: 1500, durationMinutes: 30 },
  { name: "Wisdom Tooth Extraction", category: "Surgery", price: 5000, durationMinutes: 60 },
  { name: "Surgical Extraction", category: "Surgery", price: 4000, durationMinutes: 45 },
  { name: "Crown (Metal Ceramic)", category: "Prosthodontics", price: 6000, durationMinutes: 45 },
  { name: "Crown (Zirconia)", category: "Prosthodontics", price: 12000, durationMinutes: 45 },
  { name: "Veneers (Per Tooth)", category: "Cosmetic", price: 10000, durationMinutes: 60 },
  { name: "Teeth Whitening (Bleaching)", category: "Cosmetic", price: 8000, durationMinutes: 60 },
  { name: "Partial Denture (Acrylic)", category: "Prosthodontics", price: 9000, durationMinutes: 45 },
  { name: "Complete Denture (Full Set)", category: "Prosthodontics", price: 25000, durationMinutes: 60 },
  { name: "Braces (Full Treatment)", category: "Orthodontics", price: 80000, durationMinutes: 60 },
  { name: "Retainer", category: "Orthodontics", price: 3500, durationMinutes: 20 },
  { name: "Dental Implant (Basic)", category: "Implantology", price: 45000, durationMinutes: 90 },
  { name: "Gum Treatment (Per Quadrant)", category: "Periodontics", price: 3000, durationMinutes: 45 },
];
