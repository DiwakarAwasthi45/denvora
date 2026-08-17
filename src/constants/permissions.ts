export const PERMISSIONS = {
  // Auth / account
  "auth.view": "View own account",
  "auth.manage": "Manage own account",

  // Clinic
  "clinic.view": "View clinic profile",
  "clinic.update": "Update clinic profile",
  "clinic.manage": "Full clinic management",

  // Users / roles
  "users.view": "View users",
  "users.create": "Create users",
  "users.update": "Update users",
  "users.delete": "Delete users",
  "roles.view": "View roles",
  "roles.manage": "Manage roles and permissions",

  // Patients
  "patients.view": "View patients",
  "patients.create": "Create patients",
  "patients.update": "Update patients",
  "patients.delete": "Delete patients",
  "patients.export": "Export patient data",

  // Clinical history
  "history.view": "View medical and dental history",
  "history.update": "Update medical and dental history",

  // Teeth / dental chart
  "teeth.view": "View dental chart and tooth history",
  "teeth.update": "Update dental chart and tooth conditions",

  // Treatments / plans
  "treatments.view": "View treatments",
  "treatments.create": "Create treatments",
  "treatments.update": "Update treatments",
  "treatments.delete": "Delete treatments",
  "treatmentPlans.view": "View treatment plans",
  "treatmentPlans.create": "Create treatment plans",
  "treatmentPlans.update": "Update treatment plans",

  // Appointments
  "appointments.view": "View appointments",
  "appointments.create": "Create appointments",
  "appointments.update": "Update appointments",
  "appointments.delete": "Delete appointments",

  // Queue / chairs
  "queue.manage": "Manage queue and chairs",

  // Prescriptions
  "prescriptions.view": "View prescriptions",
  "prescriptions.create": "Create prescriptions",
  "prescriptions.update": "Update prescriptions",

  // Billing
  "billing.view": "View invoices and billing",
  "billing.create": "Create invoices",
  "billing.update": "Update invoices",
  "billing.delete": "Delete invoices",
  "payments.view": "View payments",
  "payments.create": "Record payments",
  "payments.refund": "Refund payments",

  // Inventory
  "inventory.view": "View inventory",
  "inventory.manage": "Manage inventory",

  // Lab
  "lab.view": "View lab cases",
  "lab.manage": "Manage lab cases",

  // Documents
  "documents.view": "View documents",
  "documents.upload": "Upload documents",
  "documents.delete": "Delete documents",

  // Recalls / follow-ups
  "recalls.view": "View recalls",
  "recalls.manage": "Manage recalls",

  // Leads / marketing
  "leads.view": "View leads",
  "leads.manage": "Manage leads",

  // Expenses / accounting
  "expenses.view": "View expenses",
  "expenses.manage": "Manage expenses",

  // Reports / analytics
  "reports.view": "View reports",
  "reports.export": "Export reports",

  // Settings
  "settings.manage": "Manage clinic settings",

  // Platform (super admin only)
  "admin.view": "View platform data",
  "admin.manage": "Manage platform",
  "admin.audit": "View audit logs",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];
