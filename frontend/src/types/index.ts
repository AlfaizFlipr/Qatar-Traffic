import type { LucideIcon } from "lucide-react";

export type Language = "ar" | "en";

export type SearchTab = "vehicle" | "personal" | "establishment";

export interface Violation {
  id: string;
  title: string;
  date: string;
  location: string;
  amount: number;
  status: "Paid" | "Pending" | "Disputed";
  category: string;
}

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
