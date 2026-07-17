import { useCallback, useEffect, useRef, useState } from "react";
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
import { RotateCw, Search, X } from "lucide-react";
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
import { LoadingOverlay } from "./LoadingOverlay";
import styles from "./SearchTabs.module.scss";

export function SearchTabs() {
  const { t } = useLang();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SearchType>("vehicle");
  const [busy, setBusy] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

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
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const captchaRequestIdRef = useRef(0);

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

  const buildInput = (overrideTab?: SearchType): ViolationSearchInput => ({
    searchType: overrideTab ?? activeTab,
    country: t.search.countryValue,
    plateType: plateType ?? undefined,
    plateNumber: (overrideTab ?? activeTab) === "vehicle" ? plateNumber : undefined,
    personalNumber: (overrideTab ?? activeTab) === "personal" ? personalNumber : undefined,
    establishmentId:
      (overrideTab ?? activeTab) === "establishment" ? establishmentId : undefined,
  });

  const loadCaptcha = useCallback(
    async (tab: SearchType) => {
      // Guard against out-of-order responses: if the user switches tabs or
      // hits Refresh again before this call resolves, a second loadCaptcha
      // starts. Without this, whichever call happens to resolve LAST wins
      // and overwrites sessionId/captchaImage — even if it's the stale one —
      // so the image on screen ends up paired with a session for a
      // different captcha. The user types exactly what they see and still
      // gets "verification code incorrect" because it's checked against the
      // wrong (overwritten) session.
      const myRequestId = ++captchaRequestIdRef.current;
      setCaptchaImage("");
      setCaptchaInput("");
      setSessionId("");
      setCaptchaLoading(true);
      try {
        const data = await violationsApi.captchaStart(buildInput(tab));
        if (captchaRequestIdRef.current !== myRequestId) return; // superseded — discard
        if (data.cached) {
          navigate("/pay", { state: { result: data.result } });
          return;
        }
        setSessionId(data.sessionId);
        setCaptchaImage(data.captchaImage);
      } catch {
      } finally {
        if (captchaRequestIdRef.current === myRequestId) setCaptchaLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    loadCaptcha(activeTab);
  }, [activeTab]);

  const refreshCaptcha = () => loadCaptcha(activeTab);

  const showResult = (result: ViolationSearchResult) => {
    setShowLoading(false);
    navigate("/pay", { state: { result } });
  };

  const handleInquire = async () => {
    if (!currentIdentifier.trim()) {
      notifications.show({ color: "yellow", message: t.payment.required });
      return;
    }
    if (!captchaInput.trim()) {
      notifications.show({ color: "yellow", message: t.search.captchaHint });
      return;
    }
    if (!sessionId) {
      notifications.show({
        color: "yellow",
        message:
          t.search.loadingCaptcha,
      });
      return;
    }

    setBusy(true);
    setShowLoading(true);

    try {
      const data = await violationsApi.captchaSubmit(
        sessionId,
        captchaInput.trim(),
        currentIdentifier.trim(),
      );
      showResult(data);
    } catch (err) {
      setShowLoading(false);
      const msg = err instanceof ApiError ? err.message : "Network error";
      notifications.show({
        color: "red",
        title: t.search.captchaError,
        message: msg,
      });
      await loadCaptcha(activeTab);
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setShowLoading(false);
    await loadCaptcha(activeTab);
  };

  const handleClear = () => {
    setPlateNumber("");
    setPersonalNumber("");
    setEstablishmentId("");
    setCaptchaInput("");
    loadCaptcha(activeTab);
  };

  return (
    <>
      <LoadingOverlay
        visible={showLoading}
        onRetry={handleRetry}
        onCancel={() => {
          setShowLoading(false);
          setBusy(false);
        }}
      />

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
                      if (tab.value !== activeTab) {
                        setActiveTab(tab.value);
                      }
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

              {/* ── CAPTCHA — always visible, loads automatically ── */}
              <Box mt="lg" className={styles.captchaPanel}>
                <Group gap={8} mb={8}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                      stroke="#16294e"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path d="M9 12l2 2 4-4" stroke="#16294e" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <Text fw={600} size="sm">
                    {t.search.captcha}
                  </Text>
                </Group>
                <div className={styles.captchaControls}>
                  {captchaLoading ? (
                    <div className={styles.captchaBox}>
                      <span className={styles.captchaSpinner} />
                    </div>
                  ) : captchaImage ? (
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
                    disabled={captchaLoading}
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
                    if (e.key === "Enter") handleInquire();
                  }}
                />
                <Text size="xs" c="dimmed" mt={6}>
                  {t.search.captchaHint}
                </Text>
              </Box>

              <Group gap="sm" mt="xl" grow>
                <Button
                  variant="outline"
                  radius="sm"
                  leftSection={<X size={16} />}
                  onClick={handleClear}
                >
                  {t.search.clear}
                </Button>
                <Button
                  radius="sm"
                  leftSection={<Search size={16} />}
                  loading={busy}
                  onClick={handleInquire}
                >
                  {busy ? t.search.searching : t.search.search}
                </Button>
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
    </>
  );
}
