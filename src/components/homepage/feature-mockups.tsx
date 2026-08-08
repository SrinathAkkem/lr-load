import {
  Bell,
  CheckCircle2,
  Download,
  MapPin,
  Package,
  Pencil,
  Phone,
  Search,
  Share2,
  UserPlus,
} from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-3 shadow-sm ${className}`}>{children}</div>
  );
}

export function InstantLrCreationMock() {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[400px]">
      <Card className="absolute left-0 top-0 z-10 w-[210px]">
        <p className="flex items-center gap-1 text-[10px] font-semibold text-black">
          <Package className="h-2.5 w-2.5 text-[#3C60B6]" /> Shipment Details
        </p>
        <p className="mt-2 text-[8px] text-[#9CA3AF]">Date of Dispatch*</p>
        <div className="mt-0.5 rounded-md bg-[#F5F5F7] px-2 py-1.5 text-[8px] text-black">13/01/2026</div>
        <div className="mt-2 flex gap-1.5">
          <div className="flex-1">
            <p className="text-[7px] text-[#9CA3AF]">From</p>
            <div className="mt-0.5 flex items-center gap-1 rounded-md bg-[#F5F5F7] px-2 py-1.5 text-[7.5px] text-black">
              <Search className="h-2 w-2 text-[#9CA3AF]" /> Jaipur, RJ
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[7px] text-[#9CA3AF]">To</p>
            <div className="mt-0.5 flex items-center gap-1 rounded-md bg-[#F5F5F7] px-2 py-1.5 text-[7.5px] text-black">
              <MapPin className="h-2 w-2 text-[#9CA3AF]" /> Lucknow, UP
            </div>
          </div>
        </div>
        <p className="mt-2 text-[7px] text-[#9CA3AF]">Vehicle Number*</p>
        <div className="mt-0.5 rounded-md bg-[#F5F5F7] px-2 py-1.5 text-[8px] text-black">OJ27 AZ 8990</div>
      </Card>
      <Card className="absolute left-[150px] top-[50px] z-0 w-[170px] shadow-md">
        <p className="text-[9px] font-semibold text-black">Goods Description*</p>
        <p className="mt-1.5 text-[7px] leading-snug text-[#6B7280]">
          Aero-Glide Pro Running Shoes (Midnight Black, Size 10)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-[6.5px] text-[#9CA3AF]">No. Of Packages</p>
            <div className="mt-0.5 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[7px] text-black">500</div>
          </div>
          <div>
            <p className="text-[6.5px] text-[#9CA3AF]">Declared Value</p>
            <div className="mt-0.5 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[7px] text-black">500</div>
          </div>
        </div>
        <p className="mt-2 text-[6.5px] text-[#9CA3AF]">Payment Mode</p>
        <div className="mt-1 flex gap-1">
          {["To be Billed", "Paid", "To Pay"].map((mode, i) => (
            <span
              key={mode}
              className={`rounded-full px-1.5 py-0.5 text-[5.5px] font-semibold ${
                i === 1 ? "bg-black text-white" : "bg-[#F5F5F7] text-[#6B7280]"
              }`}
            >
              {mode}
            </span>
          ))}
        </div>
        <div className="mt-2">
          <p className="text-[6.5px] text-[#9CA3AF]">Special Instruction</p>
          <div className="mt-0.5 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[6.5px] text-black">Extra Wrap Also Make Sure of Safety.</div>
        </div>
      </Card>
      <div className="absolute left-[30px] top-[250px] z-20 rounded-full bg-black px-5 py-2 text-[8px] font-semibold text-white shadow-lg">
        Submit LR
      </div>
    </div>
  );
}

export function CentralizedLrRecordsMock() {
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-[440px]">
      <Card className="absolute left-0 top-[70px] z-0 w-[240px] shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold text-black">LRs History</p>
          <span className="flex items-center gap-0.5 rounded-full bg-[#5E3EA1] px-2 py-0.5 text-[6.5px] font-semibold text-white">
            <Pencil className="h-1.5 w-1.5" /> Edit
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[6.5px] text-[#9CA3AF]">
          <Package className="h-1.5 w-1.5 text-[#3C60B6]" /> Created on 12 July 2026
        </p>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="text-[8.5px] font-bold text-[#0C6B24]">ABC/2026/0252</p>
          <span className="rounded-full bg-[#0C6B24]/10 px-1.5 py-0.5 text-[6.5px] font-semibold text-[#0C6B24]">
            Approved
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          <div className="flex items-center justify-center gap-1 rounded-md bg-black py-1 text-center text-[6.5px] font-semibold text-white">
            <Share2 className="h-1.5 w-1.5" /> Share
          </div>
          <div className="flex items-center justify-center gap-1 rounded-md border border-black/10 py-1 text-center text-[6.5px] font-semibold text-black">
            <Download className="h-1.5 w-1.5" /> Download PDF
          </div>
        </div>
        <div className="mt-1 flex items-center justify-center gap-1 rounded-md bg-[#0C6B24] py-1 text-center text-[6.5px] font-semibold text-white">
          <CheckCircle2 className="h-1.5 w-1.5" /> Mark As Delivered
        </div>
        <div className="mt-1.5 flex gap-2">
          <div className="flex-1">
            <p className="text-[6px] text-[#9CA3AF]">From</p>
            <div className="mt-0.5 flex items-center gap-1 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[6.5px] text-black">
              <Search className="h-1.5 w-1.5 text-[#9CA3AF]" /> Jaipur, RJ
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[6px] text-[#9CA3AF]">To</p>
            <div className="mt-0.5 flex items-center gap-1 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[6.5px] text-black">
              <MapPin className="h-1.5 w-1.5 text-[#9CA3AF]" /> Lucknow, UP
            </div>
          </div>
        </div>
      </Card>
      <Card className="absolute right-0 top-0 z-10 w-[190px] shadow-lg">
        <div className="flex flex-wrap gap-1">
          {[
            { label: "Pending (1)", tone: "text-[#967E1C] bg-[#F7CE25]/20" },
            { label: "Rejected (1)", tone: "text-[#961C1C] bg-[#961C1C]/10" },
            { label: "Approved (2)", tone: "text-[#0C6B24] bg-[#0C6B24]/10" },
            { label: "Delivered (2)", tone: "text-[#3C60B6] bg-[#3C60B6]/10" },
          ].map((pill) => (
            <span key={pill.label} className={`rounded-full px-1.5 py-0.5 text-[5px] font-semibold ${pill.tone}`}>
              {pill.label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[8px] font-bold text-black">Latest LR</p>
        {[
          { id: "ABC/2026/0250", status: "Pending", tone: "text-[#967E1C] bg-[#F7CE25]/20" },
          { id: "ABC/2026/0250", status: "Approved", tone: "text-[#0C6B24] bg-[#0C6B24]/10" },
          { id: "ABC/2026/0250", status: "Delivered", tone: "text-[#3C60B6] bg-[#3C60B6]/10" },
          { id: "ABC/2026/0250", status: "Rejected", tone: "text-[#961C1C] bg-[#961C1C]/10" },
        ].map((row, i) => (
          <div key={i} className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-black/10 p-1.5">
            <Package className="mt-0.5 h-2 w-2 shrink-0 text-[#3C60B6]" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[7px] font-bold text-[#0C6B24]">{row.id}</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[5.5px] font-semibold ${row.tone}`}>{row.status}</span>
              </div>
              <p className="mt-0.5 text-[6px] text-[#9CA3AF]">Vijaywada → Ahmedabad</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function RealTimeTrackingMock() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-3">
      <Card className="w-[180px]">
        <p className="text-[9px] font-bold text-black">Timeline</p>
        {[
          { label: "LR Submitted", sub: "Just Now", done: true },
          { label: "Pending Approval", sub: "Admin side approval pending", done: false },
          { label: "Approved & Pdf Generate Ready", sub: "You'll be notify once ready to download", done: false },
        ].map((e, i) => (
          <div key={i} className="mt-2 flex items-start gap-1.5">
            <span
              className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${e.done ? "bg-[#0C6B24]" : "bg-[#F5F5F7] border border-black/10"}`}
            />
            <div>
              <p className="text-[7px] font-semibold text-black">{e.label}</p>
              <p className="text-[6px] leading-tight text-[#9CA3AF]">{e.sub}</p>
            </div>
          </div>
        ))}
      </Card>
      <Card className="w-[170px] translate-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold text-black">Notifications</p>
          <span className="rounded-full bg-[#5E3EA1] px-1.5 py-0.5 text-[6px] font-semibold text-white">3 New</span>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mt-1.5 flex items-center gap-1.5 border-t border-black/5 pt-1.5 first:border-0 first:pt-0">
            <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-[#F2EFFA]">
              <Bell className="h-1.5 w-1.5 text-[#5E3EA1]" />
            </span>
            <p className="text-[6.5px] text-[#4D4D4D]">Update on Request ABC/2026/0250</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function ScalableMock() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-3">
      <Card className="w-[170px] translate-y-8">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold text-black">Branch Expenses</p>
        </div>
        <p className="text-[6.5px] text-[#9CA3AF]">Freight Amount</p>
        <span className="mt-1 inline-block rounded-full border border-[#5E3EA1]/30 px-1.5 py-0.5 text-[6px] font-semibold text-[#5E3EA1]">
          Last Month
        </span>
        <div className="mt-3 flex items-center justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background:
                "conic-gradient(#5E3EA1 0% 63%, #CDC3E2 63% 81%, #EFECF6 81% 90%, #9CA3AF 90% 100%)",
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-center">
              <span className="text-[7px] font-bold leading-tight text-[#5E3EA1]">
                6.2 L
                <br />
                <span className="text-[5px] font-medium text-[#9CA3AF]">Freight</span>
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[5.5px] text-[#6B7280]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5E3EA1]" /> 63% Base Rate
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EFECF6] border border-black/10" /> 9% Accessorial
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#CDC3E2]" /> 18% Fuel Charges
          </span>
        </div>
      </Card>
      <Card className="w-[190px]">
        <p className="text-[9px] font-bold text-black">Invite Executive</p>
        <p className="mt-1 text-[6.5px] text-[#9CA3AF]">They&apos;ll get access on first OTP login.</p>
        <p className="mt-2 text-[6.5px] text-[#9CA3AF]">Mobile Number*</p>
        <div className="mt-0.5 flex items-center gap-1 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[7px] text-black">
          <Phone className="h-1.5 w-1.5 text-[#9CA3AF]" /> +91
        </div>
        <p className="mt-2 text-[6.5px] text-[#9CA3AF]">Executive Name*</p>
        <div className="mt-0.5 flex items-center gap-1 rounded-md bg-[#F5F5F7] px-1.5 py-1 text-[7px] text-black">
          <UserPlus className="h-1.5 w-1.5 text-[#9CA3AF]" /> Ravi Kumar
        </div>
        <p className="mt-2 text-[6.5px] text-[#9CA3AF]">Branch*</p>
        <div className="mt-1 flex gap-1">
          <span className="rounded-full bg-[#5E3EA1] px-1.5 py-0.5 text-[5.5px] font-semibold text-white">
            Hyderabad Branch
          </span>
          <span className="rounded-full px-1.5 py-0.5 text-[5.5px] font-semibold text-black">Chennai Branch</span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <div className="flex-1 rounded-full border border-black/15 py-1.5 text-center text-[6.5px] font-semibold text-black">
            Cancel
          </div>
          <div className="flex-1 rounded-full bg-black py-1.5 text-center text-[6.5px] font-semibold text-white">
            Send Invite
          </div>
        </div>
      </Card>
    </div>
  );
}
