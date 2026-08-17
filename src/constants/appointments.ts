export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_TYPES = [
  "consultation",
  "checkup",
  "treatment",
  "follow_up",
  "hygiene",
  "emergency",
  "other",
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const QUEUE_STATUSES: AppointmentStatus[] = ["checked_in", "in_progress"];

export const TERMINAL_STATUSES: AppointmentStatus[] = ["completed", "no_show", "cancelled"];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  in_progress: "In progress",
  completed: "Completed",
  no_show: "No show",
  cancelled: "Cancelled",
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: "Consultation",
  checkup: "Checkup",
  treatment: "Treatment",
  follow_up: "Follow-up",
  hygiene: "Hygiene",
  emergency: "Emergency",
  other: "Other",
};

export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["in_progress", "completed", "no_show", "cancelled"],
  in_progress: ["completed", "no_show", "cancelled"],
  completed: [],
  no_show: [],
  cancelled: [],
};
