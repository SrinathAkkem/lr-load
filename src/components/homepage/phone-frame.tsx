export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[380px] w-[190px] rounded-[28px] border-[6px] border-black bg-black shadow-xl">
      <div className="absolute left-1/2 top-0 h-4 w-20 -translate-x-1/2 rounded-b-lg bg-black" />
      <div className="h-full w-full overflow-hidden rounded-[22px] bg-white">
        <div className="flex items-center justify-between bg-[#5E3EA1] px-3 pb-2 pt-2 text-[9px] font-semibold text-white">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-2.5 rounded-sm border border-white" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
