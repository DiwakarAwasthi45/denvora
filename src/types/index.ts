import type { ObjectId } from "mongoose";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]> | undefined;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface TenantContext {
  userId: string;
  clinicId: string | null;
  branchId: string | null;
  role: string | null;
  roleId: string | null;
  permissions: string[];
  isPlatform: boolean;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string | null;
  clinicId: string | null;
  emailVerified: boolean;
}

export interface SafeClinic {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logo?: string;
  address?: string;
  city?: string;
  status?: string;
  currency?: string;
  timezone?: string;
  vatEnabled?: boolean;
  vatRate?: number;
  language?: string;
}

export interface SafeStaff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string | null;
  roleId: string | null;
  roleName?: string | null;
  status: string;
  emailVerified: boolean;
  isPlatform: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface SafeInsurance {
  provider?: string;
  policyNumber?: string;
  memberId?: string;
}

export interface SafeEmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface SafePatient {
  id: string;
  name: string;
  dob?: string | null;
  gender?: string | null;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  bloodGroup?: string;
  status: string;
  tags: string[];
  notes?: string;
  avatar?: string | null;
  qrCode?: string | null;
  familyHead?: string | null;
  familyMembers?: string[];
  insurance?: SafeInsurance;
  emergencyContact?: SafeEmergencyContact;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToothEntry {
  tooth: number;
  condition: string;
  restored: boolean;
  note?: string;
}

export interface SafeMedicalHistory {
  patientId: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  smoking: string;
  alcohol: string;
  drugUse: string;
  pregnant: boolean;
  notes?: string;
  updatedBy?: string | null;
  updatedByName?: string | null;
  updatedAt?: string | null;
}

export interface SafePatientDetail extends SafePatient {
  toothChart: ToothEntry[];
  history?: SafeMedicalHistory | null;
}

export interface SafeAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  dentistId?: string | null;
  dentistName?: string | null;
  chairId?: string | null;
  chairName?: string | null;
  serviceId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: string;
  status: string;
  reason?: string;
  notes?: string;
  checkedInAt?: string | null;
  cancelReason?: string;
  queuePosition?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentFormData {
  patients: Array<{ id: string; name: string; phone?: string }>;
  staff: Array<{ id: string; name: string; role?: string }>;
  chairs: Array<{ id: string; name: string; location?: string }>;
  services: Array<{ id: string; name: string }>;
}

export type { ObjectId };
