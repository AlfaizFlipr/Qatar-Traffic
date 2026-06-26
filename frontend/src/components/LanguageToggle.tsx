import { Group, Text, UnstyledButton } from "@mantine/core";
import { Languages } from "lucide-react";
import { useLang } from "../context/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLang();

  return (
    <UnstyledButton
      onClick={toggleLanguage}
      aria-label="Toggle language"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.78)",
        border: "1px solid rgba(22, 41, 78, 0.12)",
        borderRadius: 999,
        padding: "8px 14px",
        transition: "background 0.15s ease",
      }}
    >
      <Group gap={6} wrap="nowrap">
        <Languages size={16} color="#16294e" />
        <Text size="sm" fw={700} c="#1c1410">
          {language === "ar" ? "EN" : "ع"}
        </Text>
      </Group>
    </UnstyledButton>
  );
}
