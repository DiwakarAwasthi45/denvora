export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const PATIENT_STATUSES = ["active", "inactive", "deceased"] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  deceased: "Deceased",
};

export interface ToothConditionInfo {
  label: string;
  color: string;
}

export const TOOTH_CONDITIONS = [
  "healthy",
  "decay",
  "filled",
  "crown",
  "bridge",
  "rootCanal",
  "missing",
  "implant",
  "impacted",
  "fracture",
  "sealant",
] as const;
export type ToothCondition = (typeof TOOTH_CONDITIONS)[number];

export const TOOTH_CONDITION_INFO: Record<ToothCondition, ToothConditionInfo> = {
  healthy: { label: "Healthy", color: "#e2e8f0" },
  decay: { label: "Decay", color: "#d97706" },
  filled: { label: "Filled", color: "#3b82f6" },
  crown: { label: "Crown", color: "#8b5cf6" },
  bridge: { label: "Bridge", color: "#6366f1" },
  rootCanal: { label: "Root canal", color: "#ec4899" },
  missing: { label: "Missing", color: "#94a3b8" },
  implant: { label: "Implant", color: "#14b8a6" },
  impacted: { label: "Impacted", color: "#f97316" },
  fracture: { label: "Fracture", color: "#ef4444" },
  sealant: { label: "Sealant", color: "#06b6d4" },
};

export const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);

export const MEDICAL_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart disease",
  "Bleeding disorder",
  "Asthma",
  "Epilepsy",
  "Thyroid disorder",
  "Kidney disease",
  "Liver disease",
  "Rheumatoid arthritis",
  "Osteoporosis",
  "Anemia",
  "Hepatitis",
  "HIV / AIDS",
  "Cancer",
  "Pregnancy",
] as const;

export const COMMON_ALLERGIES = [
  "Penicillin",
  "Amoxicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa drugs",
  "Metronidazole",
  "Local anesthetic",
  "Latex",
  "Codeine",
] as const;

export const HABITS = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "daily", label: "Daily" },
] as const;

export type HabitValue = (typeof HABITS)[number]["value"];

export const HABIT_VALUES = HABITS.map((h) => h.value) as readonly HabitValue[];

export const EMERGENCY_RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Relative",
  "Friend",
  "Other",
] as const;
