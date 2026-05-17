export type Language = "ar" | "en";
export type UserRole = "doctor" | "receptionist" | "super_admin";

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  clinic_id: string;
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  age?: number;
  gender?: "male" | "female";
  address?: string;
  notes?: string;
  updated_at: string;
  outstanding_remaining: number;
  visits?: Visit[];
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  patient_id: string;
  date: string;
  prescriber: string;
  lens_type: string;
  frame_details?: string;
  od_sphere?: string;
  od_cylinder?: string;
  od_axis?: string;
  os_sphere?: string;
  os_cylinder?: string;
  os_axis?: string;
  pd?: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  next_visit_date?: string;
  diagnosis?: string;
  total_amount: number;
  amount_paid: number;
  remaining: number;
  lens_type?: string;
  frame_brand?: string;
  // ... other fields as seen in the user's JS
}

export interface LensItem {
  id: string;
  lens_type: string;
  material: string;
  coating: string;
  sphere: number;
  cylinder: number;
  quantity: number;
  min_stock: number;
  cost_price: number;
  sell_price: number;
  label?: string; // Optional label representing the product full name
}

export interface CatalogItem {
  label: string;
  value: string;
  is_active: boolean;
  sort_order?: number;
}

export interface LensCatalog {
  type: CatalogItem[];
  material: CatalogItem[];
  coating: CatalogItem[];
  frame_type: CatalogItem[];
  frame_material: CatalogItem[];
}

export type Section = "dashboard" | "patients" | "followups" | "prescriptions" | "lenses" | "frames" | "inventory" | "reports" | "settings" | "audit" | "superadmin";

export interface InventoryItem {
  id: string;
  name: string;
  category: "lens" | "frame" | "accessory" | "other";
  sku?: string;
  stock_level: number;
  reorder_point: number;
  unit_price: number;
  supplier_id?: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
}

export interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: "create" | "update" | "delete";
  entity_type: "patient" | "visit" | "prescription" | "inventory" | "supplier" | "settings";
  entity_id: string;
  entity_name: string;
  details?: string;
  timestamp: string;
}

export interface Clinic {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  wa_template_1?: string;
  wa_template_2?: string;
  wa_template_3?: string;
  default_followup_months?: number;
}
