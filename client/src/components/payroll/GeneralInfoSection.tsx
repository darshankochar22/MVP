import { FormRow } from "@/components/ui";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

export interface GeneralInfoData {
  employee_code?: string;
  designation?: string;
  function?: string;
  location?: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mobile?: string;
  phone?: string;
  email?: string;
}

interface Props {
  data: GeneralInfoData;
  onChange: (key: keyof GeneralInfoData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function GeneralInfoSection({ data, onChange }: Props) {
  return (
    <div className="p-3 border-t border-zinc-100 bg-white">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">General Information</div>
      <div className="space-y-1">
        <FormRow label="Employee Number" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.employee_code || ""} onChange={onChange("employee_code")} />
        </FormRow>
        <FormRow label="Designation" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.designation || ""} onChange={onChange("designation")} />
        </FormRow>
        <FormRow label="Function" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.function || ""} onChange={onChange("function")} />
        </FormRow>
        <FormRow label="Location" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.location || ""} onChange={onChange("location")} />
        </FormRow>
        <FormRow label="Gender" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <select className={selectCls} value={data.gender || ""} onChange={onChange("gender")}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </FormRow>
        <FormRow label="Date of Birth" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input type="date" className={inputCls} value={data.date_of_birth || ""} onChange={onChange("date_of_birth")} />
        </FormRow>
        <FormRow label="Blood Group" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <select className={selectCls} value={data.blood_group || ""} onChange={onChange("blood_group")}>
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </FormRow>
        <FormRow label="Father's Name" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.father_name || ""} onChange={onChange("father_name")} />
        </FormRow>
        <FormRow label="Mother's Name" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.mother_name || ""} onChange={onChange("mother_name")} />
        </FormRow>
        <FormRow label="Spouse's Name" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.spouse_name || ""} onChange={onChange("spouse_name")} />
        </FormRow>
        <div className="flex items-start min-h-[26px]">
          <span className="w-44 text-sm shrink-0 pt-1 text-zinc-500 font-medium">Address</span>
          <span className="text-zinc-400 mr-2 shrink-0 pt-1">:</span>
          <input className={`${inputCls} w-full`} value={data.address || ""} onChange={onChange("address")} />
        </div>
        <div className="flex items-center min-h-[26px] gap-2">
          <div className="flex-1 flex items-center">
            <span className="w-20 text-xs shrink-0 text-zinc-400">City</span>
            <span className="text-zinc-400 mr-1 shrink-0">:</span>
            <input className={inputCls} value={data.city || ""} onChange={onChange("city")} />
          </div>
          <div className="flex-1 flex items-center">
            <span className="w-16 text-xs shrink-0 text-zinc-400">State</span>
            <span className="text-zinc-400 mr-1 shrink-0">:</span>
            <input className={inputCls} value={data.state || ""} onChange={onChange("state")} />
          </div>
          <div className="flex-1 flex items-center">
            <span className="w-16 text-xs shrink-0 text-zinc-400">Pincode</span>
            <span className="text-zinc-400 mr-1 shrink-0">:</span>
            <input className={inputCls} value={data.pincode || ""} onChange={onChange("pincode")} />
          </div>
        </div>
        <FormRow label="Phone No." labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.phone || ""} onChange={onChange("phone")} />
        </FormRow>
        <FormRow label="Mobile" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.mobile || ""} onChange={onChange("mobile")} />
        </FormRow>
        <FormRow label="E-Mail" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.email || ""} onChange={onChange("email")} />
        </FormRow>
      </div>
    </div>
  );
}
