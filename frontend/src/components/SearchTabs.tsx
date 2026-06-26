import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Group,
  Radio,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RotateCw, Search, ShieldCheck, ShieldQuestion, X } from "lucide-react";
import carIcon from "../assets/images/searchTab/car.png";
import idIcon from "../assets/images/searchTab/Id.png";
import establishmentIcon from "../assets/images/searchTab/establisment.png";
import { violationsApi } from "../api/violations";
import { ApiError } from "../api/client";
import { useLang } from "../context/LanguageContext";
import type {
  SearchType,
  ViolationSearchInput,
  ViolationSearchResult,
} from "../api/types";
import styles from "./SearchTabs.module.scss";

type Phase = "idle" | "captcha";

export function SearchTabs() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchType>("vehicle");
  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState(false);

  const [plateType, setPlateType] = useState<string | null>(
    t.search.plateTypes[0],
  );
  const [plateNumber, setPlateNumber] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [establishmentId, setEstablishmentId] = useState("");
  const [ownerType, setOwnerType] = useState("personal");

  const [sessionId, setSessionId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  useEffect(() => setPlateType(t.search.plateTypes[0]), [t]);

  const tabs = [
    { value: "vehicle" as const, label: t.search.tabVehicle, icon: carIcon },
    {
      value: "personal" as const,
      label: t.search.tabPersonal,
      icon: idIcon,
    },

    {
      value: "establishment" as const,
      label: t.search.tabEstablishment,
      icon: establishmentIcon,
    },
  ];

  const panelTitle =
    activeTab === "vehicle"
      ? t.search.panelVehicle
      : activeTab === "personal"
        ? t.search.panelPersonal
        : t.search.panelEstablishment;

  const currentIdentifier =
    activeTab === "vehicle"
      ? plateNumber
      : activeTab === "personal"
        ? personalNumber
        : establishmentId;

  const buildInput = (): ViolationSearchInput => ({
    searchType: activeTab,
    country: t.search.countryValue,
    plateType: plateType ?? undefined,
    plateNumber: activeTab === "vehicle" ? plateNumber : undefined,
    personalNumber: activeTab === "personal" ? personalNumber : undefined,
    establishmentId:
      activeTab === "establishment" ? establishmentId : undefined,
  });

  const resetTo = (p: Phase) => {
    setPhase(p);
    setSessionId("");
    setCaptchaImage("");
    setCaptchaInput("");
  };

  // Results are shown on the Result Details page, never inline here.
  const showResult = (result: ViolationSearchResult) => {
    resetTo("idle");
    navigate("/pay", { state: { result } });
  };

  // Step 1 — start the inquiry: cache hit returns results, otherwise a CAPTCHA challenge.
  const handleStart = async () => {
    if (!currentIdentifier.trim()) {
      notifications.show({ color: "yellow", message: t.payment.required });
      return;
    }
    setBusy(true);
    try {
      const data = await violationsApi.captchaStart(buildInput());
      if (data.cached) {
        showResult(data.result);
      } else {
        setSessionId(data.sessionId);
        setCaptchaImage(data.captchaImage);
        setCaptchaInput("");
        setPhase("captcha");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Network error — is the backend running?";
      notifications.show({ color: "red", title: "Error", message: msg });
    } finally {
      setBusy(false);
    }
  };

  // Step 2 — verify the typed CAPTCHA and fetch results.
  const handleVerify = async () => {
    if (!captchaInput.trim()) {
      notifications.show({ color: "yellow", message: t.search.captchaHint });
      return;
    }
    setBusy(true);
    try {
      const data = await violationsApi.captchaSubmit(
        sessionId,
        captchaInput.trim(),
      );
      showResult(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      notifications.show({
        color: "red",
        title: t.search.captchaError,
        message: msg,
      });
      await refreshCaptcha(); // wrong/expired -> issue a fresh challenge
    } finally {
      setBusy(false);
    }
  };

  const refreshCaptcha = async () => {
    try {
      const data = await violationsApi.captchaStart(buildInput());
      if (data.cached) {
        showResult(data.result);
      } else {
        setSessionId(data.sessionId);
        setCaptchaImage(data.captchaImage);
        setCaptchaInput("");
      }
    } catch {
      /* ignore */
    }
  };

  const handleClear = () => {
    setPlateNumber("");
    setPersonalNumber("");
    setEstablishmentId("");
    resetTo("idle");
  };

  return (
    <section id="search" className={styles.section}>
      <Container size="lg">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>{t.search.heading}</span>
          </div>

          <div className={styles.tabs}>
            {tabs.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                  onClick={() => {
                    setActiveTab(tab.value);
                    resetTo("idle");
                  }}
                >
                  <img src={tab.icon} alt="" className={styles.tabIcon} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.panelTitle}>
            <span>{panelTitle}</span>
          </div>

          <div className={styles.body}>
            {activeTab === "vehicle" && (
              <>
                <div className={styles.grid2}>
                  <Select
                    label={t.search.country}
                    data={[t.search.countryValue]}
                    value={t.search.countryValue}
                    readOnly
                  />
                  <Select
                    label={t.search.plateType}
                    data={[...t.search.plateTypes]}
                    value={plateType}
                    onChange={setPlateType}
                  />
                </div>
                <TextInput
                  mt="md"
                  label={t.search.plateNumber}
                  placeholder={t.search.plateNumberPlaceholder}
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.currentTarget.value)}
                />
                <Box mt="md">
                  <Text fw={600} size="sm" mb={6}>
                    {t.search.ownerInfo}
                  </Text>
                  <Radio.Group value={ownerType} onChange={setOwnerType}>
                    <Group gap={24}>
                      <Radio value="personal" label={t.search.personalNumber} />
                      <Radio
                        value="establishment"
                        label={t.search.establishmentId}
                      />
                    </Group>
                  </Radio.Group>
                </Box>
                <TextInput
                  mt="md"
                  label={
                    ownerType === "personal"
                      ? t.search.personalNumber
                      : t.search.establishmentId
                  }
                  placeholder={
                    ownerType === "personal"
                      ? t.search.personalNumberPlaceholder
                      : t.search.establishmentPlaceholder
                  }
                  value={personalNumber}
                  onChange={(e) => setPersonalNumber(e.currentTarget.value)}
                />
              </>
            )}

            {activeTab === "personal" && (
              <TextInput
                label={t.search.personalNumber}
                placeholder={t.search.personalNumberPlaceholder}
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.currentTarget.value)}
              />
            )}

            {activeTab === "establishment" && (
              <TextInput
                label={t.search.establishmentId}
                placeholder={t.search.establishmentPlaceholder}
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.currentTarget.value)}
              />
            )}

            {/* CAPTCHA challenge (appears after Search; image comes from the backend) */}
            {phase === "captcha" && (
              <Box mt="lg" className={styles.captchaPanel}>
                <Group gap={8} mb={8}>
                  <ShieldQuestion size={16} color="#16294e" />
                  <Text fw={600} size="sm">
                    {t.search.captcha}
                  </Text>
                </Group>
                <div className={styles.captchaControls}>
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="captcha"
                      className={styles.captchaImg}
                    />
                  ) : (
                    <div className={styles.captchaBox}>
                      {t.search.loadingCaptcha}
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={refreshCaptcha}
                  >
                    <RotateCw size={15} />
                    <span>{t.search.refresh}</span>
                  </button>
                </div>
                <TextInput
                  mt={10}
                  placeholder={t.search.captchaPlaceholder}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerify();
                  }}
                />
                <Text size="xs" c="dimmed" mt={6}>
                  {t.search.captchaHint}
                </Text>
              </Box>
            )}

            <Group gap="sm" mt="xl" grow>
              <Button
                variant="outline"
                radius="sm"
                leftSection={<X size={16} />}
                onClick={handleClear}
              >
                {t.search.clear}
              </Button>
              {phase === "captcha" ? (
                <Button
                  radius="sm"
                  leftSection={<ShieldCheck size={16} />}
                  loading={busy}
                  onClick={handleVerify}
                >
                  {t.search.verify}
                </Button>
              ) : (
                <Button
                  radius="sm"
                  leftSection={<Search size={16} />}
                  loading={busy}
                  onClick={handleStart}
                >
                  {busy ? t.search.searching : t.search.search}
                </Button>
              )}
            </Group>
          </div>
        </div>

        <div className={styles.note}>
          <Text size="sm">
            <strong>{t.search.noteLabel}:</strong> {t.search.note}
          </Text>
        </div>
      </Container>
    </section>
  );
}
