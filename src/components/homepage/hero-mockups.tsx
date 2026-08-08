import Image from "next/image";

/**
 * A lightweight, hand-built stand-in for a real dashboard/app screenshot.
 * Built from the same colors and structure as the actual company portal
 * (see `PortalSidebar`, `StatCard`, `DashboardLrTable`) rather than depending
 * on a live screenshot, which needs a signed-in session and a fully migrated
 * database that isn't available at build/deploy time.
 */
export function DashboardMockup() {
  return (
    <div className="flex h-full w-full text-black">
      <div className="hidden w-[70px] shrink-0 flex-col items-center gap-3 border-r border-black/5 bg-[#F9F8FC] py-3 sm:flex">
        <Image src="/rono-mark.svg" alt="" width={20} height={20} className="h-5 w-5" />
        {["bg-[#5E3EA1]", "bg-transparent", "bg-transparent", "bg-transparent"].map((c, i) => (
          <span key={i} className={`h-6 w-10 rounded-md ${c === "bg-transparent" ? "bg-black/[0.04]" : c}`} />
        ))}
      </div>
      <div className="flex-1 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold">Dashboard</span>
          <span className="h-4 w-16 rounded-full bg-black/[0.04]" />
        </div>
        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
          {[
            { label: "Total LRs", value: "240", color: "text-black" },
            { label: "Pending", value: "40", color: "text-[#967E1C]" },
            { label: "Approved", value: "200", color: "text-[#0C6B24]" },
            { label: "Delivered", value: "10", color: "text-[#3C60B6]" },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-black/5 bg-white p-1.5 shadow-sm">
              <p className="text-[5px] text-[#9CA3AF]">{s.label}</p>
              <p className={`text-[8px] font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-black/5 bg-white p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[6.5px] font-bold">All LR Requests</span>
            <span className="rounded-full bg-[#5E3EA1] px-1.5 py-0.5 text-[5px] font-semibold text-white">Filter</span>
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5 border-t border-black/5 py-1 first:border-0">
              <span className="h-1.5 w-10 rounded-full bg-black/[0.06]" />
              <span className="h-1.5 w-14 rounded-full bg-black/[0.06]" />
              <span className="h-1.5 w-10 rounded-full bg-black/[0.06]" />
              <span
                className={`ml-auto h-3 w-10 rounded-full ${
                  ["bg-[#0C6B24]/10", "bg-[#F7CE25]/20", "bg-[#961C1C]/10", "bg-[#3C60B6]/10"][i]
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileMockup() {
  return (
    <div className="flex h-full w-full flex-col bg-white text-black">
      <div className="bg-[#5E3EA1] px-2 pb-2 pt-2 text-white">
        <p className="text-[7px] font-semibold">Hello Rajan!</p>
        <p className="text-[5.5px] text-white/70">Executive Dashboard</p>
      </div>
      <div className="flex-1 p-2">
        <div className="grid grid-cols-2 gap-1">
          {["Total LRs", "Delivered"].map((label, i) => (
            <div key={label} className="rounded-md border border-black/5 p-1.5">
              <p className="text-[4.5px] text-[#9CA3AF]">{label}</p>
              <p className="text-[7px] font-bold text-[#5E3EA1]">{i === 0 ? "18" : "12"}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[6px] font-semibold">Recent LRs</p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-1 rounded-md border border-black/5 p-1.5">
            <p className="text-[5.5px] font-semibold text-[#0C6B24]">ABC/2026/025{i}</p>
            <p className="text-[4.5px] text-[#9CA3AF]">Jaipur → Lucknow</p>
          </div>
        ))}
      </div>
    </div>
  );
}
