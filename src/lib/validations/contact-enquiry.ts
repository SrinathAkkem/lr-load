import { z } from "zod";

export const contactEnquirySchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  customerId: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().min(10, "Enter a valid mobile number").max(15),
  subject: z.string().min(1, "Choose a subject"),
  message: z.string().min(10, "Please enter a message"),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;

export const SUBJECT_LABELS: Record<string, string> = {
  pricing: "What's your pricing?",
  sales: "I want to talk to sales",
  support: "I need technical support",
  account: "Help with my account",
  demo: "Request a Demo",
  other: "Something else...",
};

export function subjectLabel(key: string) {
  return SUBJECT_LABELS[key] ?? key;
}
