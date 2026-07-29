const FIELD_LABELS: Record<string, string> = {
  lrCode: "LR code",
  maxExecutives: "Max executives",
  maxBranches: "Max branches",
  maxLrPerMonth: "Max LRs / month",
  mobile: "Mobile",
  branchId: "Branch",
  reason: "Reason",
  name: "Name",
  city: "City",
  status: "Status",
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Turn audit metadata into readable sentences for the admin UI. */
export function formatAuditDetails(
  action: string,
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  switch (action) {
    case "company.create":
      if (typeof metadata.lrCode === "string") {
        return `LR code set to ${metadata.lrCode}`;
      }
      break;
    case "company.limits.update": {
      const parts: string[] = [];
      if (metadata.maxExecutives != null) {
        parts.push(`Executives: ${metadata.maxExecutives}`);
      }
      if (metadata.maxBranches != null) {
        parts.push(`Branches: ${metadata.maxBranches}`);
      }
      if (metadata.maxLrPerMonth != null) {
        parts.push(`LRs / month: ${metadata.maxLrPerMonth}`);
      }
      if (parts.length) return parts.join(" · ");
      break;
    }
    case "lr.reject":
      if (typeof metadata.reason === "string" && metadata.reason.trim()) {
        return metadata.reason.trim();
      }
      break;
    case "executive.invite": {
      const parts: string[] = [];
      if (typeof metadata.mobile === "string") {
        parts.push(`Mobile +91 ${metadata.mobile}`);
      }
      if (typeof metadata.branchId === "string") {
        parts.push(`Branch ID ${metadata.branchId}`);
      }
      if (parts.length) return parts.join(" · ");
      break;
    }
    case "company.activate":
    case "company.suspend":
      return null;
    default:
      break;
  }

  const parts = Object.entries(metadata)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${labelFor(k)}: ${String(v)}`);

  return parts.length > 0 ? parts.join(" · ") : null;
}
