import { Container, Text } from "@mantine/core";
import { FeaturesSection } from "../components/FeaturesSection";
import { HowItWorks } from "../components/HowItWorks";
import { WhyChooseUs } from "../components/WhyChooseUs";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { useLang } from "../context/LanguageContext";

export function AboutPage() {
  const { language, t } = useLang();

  return (
    <>
      <PageHero title={t.about.title} subtitle={t.about.lead} />
      <Container size="md" py={40}>
        <Text size="lg" c="dimmed" ta="center">
          {t.about.body}
        </Text>
      </Container>
      <WhyChooseUs language={language} t={t} />
      <FeaturesSection language={language} t={t} />
      <HowItWorks language={language} t={t} />
      <CTASection language={language} t={t} />
    </>
  );
}
