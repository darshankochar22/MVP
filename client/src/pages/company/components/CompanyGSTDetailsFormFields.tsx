import { INDIAN_STATES } from "@/constants/states";
import type { CompanyGSTFormData } from "../hooks/useCompanyGSTDetailsForm";

interface Props {
  form: CompanyGSTFormData;
  setField: (key: keyof CompanyGSTFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

interface FieldRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  italic?: boolean;
}

function FieldRow({ label, required, children, italic }: FieldRowProps) {
  return (
    <div className="flex items-center min-h-[26px]">
      <span className={`w-72 text-zinc-600 font-medium ${italic ? "italic" : ""}`}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <span className="text-zinc-400 mr-3 font-medium">:</span>
      <div className="flex-1 flex items-center">{children}</div>
    </div>
  );
}

const SELECT_CLS = "bg-transparent border border-zinc-200 focus:border-zinc-800 rounded px-2 py-0.5 outline-none bg-white w-56 text-[11px] font-bold text-zinc-950";
const INPUT_CLS  = "bg-transparent border border-zinc-200 hover:border-zinc-300 focus:border-zinc-800 rounded px-2 py-0.5 outline-none bg-white w-56 text-[11px] font-bold text-zinc-950";

export default function CompanyGSTDetailsFormFields({ form, setField }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 font-mono text-zinc-800 text-[11px] select-none">
      <div className="max-w-5xl mx-auto bg-white border border-zinc-200 rounded shadow-sm p-6">

        {/* Title */}
        <div className="text-center font-bold text-xs border-b border-zinc-200 pb-3 mb-6 tracking-wide text-zinc-900 uppercase">
          GST Rate and Other Details
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* HSN/SAC & Related Details */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-1 uppercase tracking-wider text-[10px]">
                HSN/SAC &amp; Related Details
              </div>

              <FieldRow label="HSN/SAC Details">
                <select className={SELECT_CLS} value={form.hsn_sac_details} onChange={setField("hsn_sac_details")}>
                  <option>Not Defined</option>
                  <option>Specify Details Here</option>
                  <option>Use GST Classification</option>
                </select>
              </FieldRow>

              {form.hsn_sac_details === "Specify Details Here" && (
                <>
                  <FieldRow label="HSN/SAC">
                    <input className={INPUT_CLS} placeholder="e.g. 9954" value={form.hsn_sac} onChange={setField("hsn_sac")} />
                  </FieldRow>
                  <FieldRow label="Description">
                    <input className={INPUT_CLS} placeholder="Description" value={form.description} onChange={setField("description")} />
                  </FieldRow>
                </>
              )}
            </div>

            {/* GST Rate & Related Details */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-1 uppercase tracking-wider text-[10px]">
                GST Rate &amp; Related Details
              </div>

              <FieldRow label="GST Rate Details">
                <select className={SELECT_CLS} value={form.gst_rate_details} onChange={setField("gst_rate_details")}>
                  <option>Not Defined</option>
                  <option>Specify Details Here</option>
                  <option>Use GST Classification</option>
                </select>
              </FieldRow>

              {form.gst_rate_details === "Specify Details Here" && (
                <>
                  <FieldRow label="Taxability Type">
                    <select className={SELECT_CLS} value={form.taxability_type} onChange={setField("taxability_type")}>
                      <option value="">Select</option>
                      <option>Taxable</option>
                      <option>Exempt</option>
                      <option>Nil Rated</option>
                      <option>Non-GST</option>
                    </select>
                  </FieldRow>
                  <FieldRow label="GST Rate">
                    <div className="flex items-center gap-1">
                      <input
                        className="bg-transparent border border-zinc-200 hover:border-zinc-300 focus:border-zinc-800 rounded px-2 py-0.5 outline-none bg-white w-20 text-[11px] font-bold text-zinc-950 text-right"
                        placeholder="0"
                        value={form.gst_rate}
                        onChange={setField("gst_rate")}
                      />
                      <span className="font-bold text-zinc-500">%</span>
                    </div>
                  </FieldRow>
                </>
              )}
            </div>

            {/* GST Details */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-1 uppercase tracking-wider text-[10px]">
                GST Registration Details
              </div>

              <FieldRow label="GSTIN/UIN">
                <input
                  className={INPUT_CLS + " uppercase tracking-wider"}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  value={form.gstin}
                  onChange={setField("gstin")}
                  maxLength={15}
                />
              </FieldRow>

              <FieldRow label="Registration Type">
                <select className={SELECT_CLS} value={form.registration_type} onChange={setField("registration_type")}>
                  <option>Regular</option>
                  <option>Composition</option>
                  <option>Regular - SEZ</option>
                  <option>Unregistered</option>
                </select>
              </FieldRow>

              <FieldRow label="State">
                <select className={SELECT_CLS} value={form.state_name} onChange={setField("state_name")}>
                  <option value="">Not Applicable</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldRow>

              <FieldRow label="Applicable From">
                <input type="date" className={INPUT_CLS} value={form.applicable_from} onChange={setField("applicable_from")} />
              </FieldRow>

              <FieldRow label="Periodicity of GSTR-1">
                <select className={SELECT_CLS} value={form.periodicity_of_gstr1} onChange={setField("periodicity_of_gstr1")}>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                </select>
              </FieldRow>

              <FieldRow label="Assessee of Other Territory">
                <select className={SELECT_CLS} value={form.assessee_of_other_territory} onChange={setField("assessee_of_other_territory")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FieldRow>
            </div>

            {/* e-Invoice */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-1 uppercase tracking-wider text-[10px]">
                e-Invoice Details
              </div>
              <FieldRow label="e-Invoicing Applicable">
                <select className={SELECT_CLS} value={form.enable_e_invoice} onChange={setField("enable_e_invoice")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FieldRow>
              {form.enable_e_invoice === "Yes" && (
                <FieldRow label="Applicable From">
                  <input type="date" className={INPUT_CLS} value={form.e_invoice_applicable_from} onChange={setField("e_invoice_applicable_from")} />
                </FieldRow>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* e-Way Bill */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-1 uppercase tracking-wider text-[10px]">
                e-Way Bill Details
              </div>
              <FieldRow label="e-Way Bill Applicable">
                <select className={SELECT_CLS} value={form.enable_e_way_bill} onChange={setField("enable_e_way_bill")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FieldRow>
              {form.enable_e_way_bill === "Yes" && (
                <>
                  <FieldRow label="Applicable From">
                    <input type="date" className={INPUT_CLS} value={form.e_way_bill_applicable_from} onChange={setField("e_way_bill_applicable_from")} />
                  </FieldRow>
                  <FieldRow label="Applicable for Intrastate">
                    <select className={SELECT_CLS} value={form.e_way_bill_for_intrastate} onChange={setField("e_way_bill_for_intrastate")}>
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </FieldRow>
                </>
              )}
            </div>

            {/* HSN Summary & Other Settings */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-950 border-b border-zinc-100 pb-1 uppercase tracking-wider text-[10px]">
                Other Settings
              </div>

              <FieldRow label="Create HSN/SAC summary for">
                <select className={SELECT_CLS} value={form.hsn_summary_for} onChange={setField("hsn_summary_for")}>
                  <option>All Sections</option>
                  <option>Value of Invoice</option>
                </select>
              </FieldRow>

              <FieldRow label="Minimum length of HSN/SAC" italic>
                <div className="flex flex-col gap-0.5">
                  <input
                    className="bg-transparent border border-zinc-200 hover:border-zinc-300 focus:border-zinc-800 rounded px-2 py-0.5 outline-none bg-white w-20 text-[11px] font-bold text-zinc-950 text-right"
                    placeholder="4"
                    value={form.min_hsn_sac_length}
                    onChange={setField("min_hsn_sac_length")}
                  />
                  <span className="text-zinc-400 text-[10px]">(based on annual turnover)</span>
                </div>
              </FieldRow>

              <FieldRow label="Show GST Advances for adjustments in transaction">
                <select className={SELECT_CLS} value={form.show_gst_advances} onChange={setField("show_gst_advances")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FieldRow>

              <FieldRow label="Update GST Status of Vouchers after Master Alteration" italic>
                <select className={SELECT_CLS} value={form.update_gst_on_master_alter} onChange={setField("update_gst_on_master_alter")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FieldRow>

              <FieldRow label="Set/Alter details for downloading GST Returns">
                <select className={SELECT_CLS} value={form.set_alter_gst_return_details} onChange={setField("set_alter_gst_return_details")}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </FieldRow>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
