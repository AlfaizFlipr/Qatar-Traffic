import {
  Languages,
  LayoutGrid,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import type { FAQItem, FeatureItem, Language, Violation } from "../types";

export const featureContent: Record<Language, FeatureItem[]> = {
  ar: [
    {
      icon: ShieldCheck,
      title: "تجربة استعلام رسمية",
      description: "واجهة موثوقة تدعم التحقق الدقيق والشفاف من البيانات.",
    },
    {
      icon: Zap,
      title: "بحث سريع",
      description:
        "اعثر على المعلومات المطلوبة خلال خطوات قليلة مع نتائج فورية.",
    },
    {
      icon: LockKeyhole,
      title: "حماية للبيانات",
      description: "بياناتك محمية وفق أعلى معايير الخصوصية.",
    },
    {
      icon: Languages,
      title: "دعم متعدد اللغات",
      description:
        "يمكنك التبديل بسهولة بين العربية والإنجليزية دون فقدان السياق.",
    },
    {
      icon: Smartphone,
      title: "متوافق مع الهاتف",
      description: "مُحسّن للهواتف الذكية والأجهزة اللوحية والشاشات الكبيرة.",
    },
    {
      icon: LayoutGrid,
      title: "تنقل سهل",
      description: "تدفقات واضحة وموجهات بسيطة تجعل التفاعل سهلًا ومباشرًا.",
    },
  ],
  en: [
    {
      icon: ShieldCheck,
      title: "Official Inquiry Experience",
      description:
        "A reliable interface built to support accurate and transparent checks.",
    },
    {
      icon: Zap,
      title: "Fast Search",
      description:
        "Find the needed information in just a few steps with instant feedback.",
    },
    {
      icon: LockKeyhole,
      title: "Secure Data Handling",
      description:
        "Your inputs are protected with privacy-first design principles.",
    },
    {
      icon: Languages,
      title: "Multi-language Support",
      description:
        "Switch smoothly between Arabic and English without losing context.",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description:
        "Optimized for smartphones, tablets, and large screens alike.",
    },
    {
      icon: LayoutGrid,
      title: "Easy Navigation",
      description:
        "Simple flows and clear guidance keep every interaction intuitive.",
    },
  ],
};

export const faqContent: Record<Language, FAQItem[]> = {
  ar: [
    {
      question: "كيف يمكنني التحقق من المخالفات المرورية؟",
      answer:
        "استخدم رقم المركبة أو الرقم الشخصي أو رقم المنشأة لاستعراض أي مخالفات نشطة.",
    },
    {
      question: "هل بياناتي آمنة؟",
      answer:
        "نعم. تم تصميم المنصة لتوفير حماية خاصة للبيانات مع الالتزام بأعلى المعايير.",
    },
    {
      question: "هل يمكنني البحث باستخدام الرقم الشخصي؟",
      answer: "بالتأكيد. يمكنك استخدام خيار البحث بالرقم الشخصي للبحث مباشرة.",
    },
    {
      question: "ما المعلومات المطلوبة؟",
      answer:
        "قد تحتاج إلى رقم المركبة أو الرقم الشخصي أو رقم المنشأة أو رمز التحقق المطلوب.",
    },
  ],
  en: [
    {
      question: "How can I check traffic violations?",
      answer:
        "Use the vehicle number, personal number, or establishment ID search form to review any active violations.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. The platform is designed with privacy-focused practices and secure handling of all information.",
    },
    {
      question: "Can I search using my personal number?",
      answer:
        "Absolutely. The personal number inquiry option allows you to search directly using your ID information.",
    },
    {
      question: "What information is required?",
      answer:
        "You may need the vehicle number, personal number, establishment registration, or the required verification code.",
    },
  ],
};

export const mockViolationsContent: Record<Language, Violation[]> = {
  ar: [
    {
      id: "V-1024",
      title: "مخالفة تجاوز السرعة",
      date: "2026-05-14",
      location: "طريق الريان السريع",
      amount: 600,
      status: "Pending",
      category: "مرورية",
    },
    {
      id: "V-1025",
      title: "مخالفة وقوف في منطقة محظورة",
      date: "2026-05-02",
      location: "الواي ست باي",
      amount: 300,
      status: "Pending",
      category: "وقوف",
    },
    {
      id: "V-1026",
      title: "مخالفة إشارة",
      date: "2026-04-20",
      location: "طريق الدوحة السريع",
      amount: 200,
      status: "Paid",
      category: "مرورية",
    },
  ],
  en: [
    {
      id: "V-1024",
      title: "Speeding violation",
      date: "2026-05-14",
      location: "Al Rayyan Highway",
      amount: 600,
      status: "Pending",
      category: "Traffic",
    },
    {
      id: "V-1025",
      title: "Parking in restricted zone",
      date: "2026-05-02",
      location: "West Bay",
      amount: 300,
      status: "Pending",
      category: "Parking",
    },
    {
      id: "V-1026",
      title: "Signal violation",
      date: "2026-04-20",
      location: "Doha Expressway",
      amount: 200,
      status: "Paid",
      category: "Traffic",
    },
  ],
};
