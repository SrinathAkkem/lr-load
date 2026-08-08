import { Clock, AlertTriangle } from "lucide-react";

export function PendingApprovalBanner({
  status,
  rejectionReason,
}: {
  status: "pending" | "suspended";
  rejectionReason?: string;
}) {
  if (status === "suspended") {
    return (
      <div className="flex items-center gap-2.5 border-b border-[#961C1C]/20 bg-[#961C1C]/5 px-4 py-2.5 md:px-8">
        <AlertTriangle className="h-4 w-4 shrink-0 text-[#961C1C]" />
        <p className="text-xs font-semibold text-[#961C1C]">
          Your company account is suspended.
          {rejectionReason ? ` Reason: ${rejectionReason}` : ""} Contact Rono support for help.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 border-b border-[#F7CE25]/30 bg-[#FEF9E7] px-4 py-2.5 md:px-8">
      <Clock className="h-4 w-4 shrink-0 text-[#967E1C]" />
      <p className="text-xs font-semibold text-[#967E1C]">
        Your company registration is pending approval. You can set up branches, executives, and
        your profile now — LR creation will unlock once a Rono admin approves your account.
      </p>
    </div>
  );
}
