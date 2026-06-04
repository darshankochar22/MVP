export interface AttendanceVoucherEntry {
  entry_id?: number;
  attendance_voucher_id?: number;
  employee_id: number;
  employee_name?: string;
  employee_number?: string;
  attendance_type_id: number;
  attendance_type_name?: string;
  value: number;
}

export interface AttendanceVoucher {
  attendance_voucher_id?: number;
  company_id: number;
  voucher_number?: string;
  date: string;
  narration?: string | null;
  entries?: AttendanceVoucherEntry[];
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceAPI {
  attendance: {
    create: (data: AttendanceVoucher) => Promise<{ success: boolean; attendance_voucher_id?: number; voucher_number?: string; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; vouchers?: AttendanceVoucher[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; voucher?: AttendanceVoucher; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
    getNextNumber: (company_id: number) => Promise<{ success: boolean; nextNumber?: string; error?: string }>;
  };
}
