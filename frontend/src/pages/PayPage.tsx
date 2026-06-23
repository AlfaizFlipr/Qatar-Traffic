import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  NumberFormatter,
  Select,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { CheckCircle2, RotateCw } from "lucide-react";
import * as yup from "yup";
import { paymentsApi } from "../api/payments";
import { ApiError } from "../api/client";
import { useLang } from "../context/LanguageContext";
import type { ViolationItem, ViolationSearchResult } from "../api/types";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji } from "../constants/countries";
import styles from "./PayPage.module.scss";
import type { OptionsFilter } from "@mantine/core";

// Compact label (flag + dial) for the closed select; full name is searchable below.
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.iso,
  label: `${flagEmoji(c.iso)} ${c.dial}`,
}));

const countrySearch: OptionsFilter = ({ options, search }) => {
  const q = search.trim().toLowerCase();
  if (!q) return options;

  return options.filter((o) => {
    // ComboboxParsedItem can be a group — skip groups
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

type FormErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "phone" | "captcha", string>
>;

export function PayPage() {
  const { t, language, isArabic } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  let result = (location.state as { result?: ViolationSearchResult } | null)
    ?.result;
  if (!result && new URLSearchParams(location.search).has("demo")) {
    result = {
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
  }

  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        (result?.violations ?? [])
          .filter((v) => v.status !== "Paid")
          .map((v) => v.reference),
      ),
  );
  const [detailItem, setDetailItem] = useState<ViolationItem | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY.iso);
  const dialCode =
    COUNTRIES.find((c) => c.iso === phoneCountry)?.dial ?? DEFAULT_COUNTRY.dial;
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectError, setSelectError] = useState("");
  const [captcha, setCaptcha] = useState(randomCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [busy, setBusy] = useState(false);

  const total = useMemo(
    () =>
      (result?.violations ?? [])
        .filter((v) => selected.has(v.reference))
        .reduce((s, v) => s + v.amount, 0),
    [result, selected],
  );

  if (!result) {
    return (
      <div className={styles.empty}>
        <p>
          {isArabic
            ? "لا توجد بيانات للدفع. يرجى إجراء استعلام أولاً."
            : "No payment data. Please run an inquiry first."}
        </p>
        <Button onClick={() => navigate("/")}>{t.details.back}</Button>
      </div>
    );
  }

  // No violations on the record — nothing to pay, show a friendly state.
  if (result.violations.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle2 size={40} color="#16a34a" />
        <p>{t.results.noViolations}</p>
        <Button onClick={() => navigate("/")}>{t.common.backHome}</Button>
      </div>
    );
  }

  const toggle = (ref: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      return next;
    });

  const toggleAll = () => {
    const payable = result.violations.filter((v) => v.status !== "Paid");
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

  // Validation lives on the input fields (Yup) — never in notifications.
  const validate = (): boolean => {
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

  const handlePay = async () => {
    if (!validate()) return;

    if (selected.size === 0) {
      setSelectError(t.details.selectOne);
      return;
    }
    setSelectError("");

    setBusy(true);
    try {
      await paymentsApi.create({
        referenceId: result.referenceId,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        mobile: `${dialCode}${form.phone}`,
        email: form.email || undefined,
        identifier: result.identifier,
        amount: total,
        violationRefs: [...selected],
        language,
      });
      notifications.show({
        color: "green",
        title: t.payment.successTitle,
        message: t.payment.successMsg,
      });
      navigate("/");
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

  const payable = result.violations.filter((v) => v.status !== "Paid");

  return (
    <div className={styles.page}>
      <div className={styles.titleBand}>{t.details.pageTitle}</div>

      <div className={styles.wrap}>
        {/* Vehicle Information */}
        <div className={styles.vehicleCard}>
          <h2 className={styles.vehicleHeading}>{t.details.vehicleInfo}</h2>
          <div className={styles.vehicleGrid}>
            <div>
              <span className={styles.vLabel}>{t.details.idNumber}</span>
              <span className={styles.vValue}>{result.identifier}</span>
            </div>
            <div>
              <span className={styles.vLabel}>{t.details.licenseExpiry}</span>
              <span className={styles.vValue}>-</span>
            </div>
            <div>
              <span className={styles.vLabel}>{t.details.type}</span>
              <span className={styles.vValue}>-</span>
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
                  leftSection={
                    <span className={styles.phonePrefix}>{dialCode}</span>
                  }
                  leftSectionWidth={Math.max(44, dialCode.length * 11 + 14)}
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

            {result.violations.map((v) => (
              <div key={v.reference} className={styles.trow}>
                <span className={styles.cCheck}>
                  <Checkbox
                    color="teal"
                    checked={selected.has(v.reference)}
                    disabled={v.status === "Paid"}
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
                </span>
                <span className={styles.cAmount}>
                  <NumberFormatter value={v.amount} thousandSeparator />{" "}
                  {t.common.currency}
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
            ))}
          </div>

          {selectError && <p className={styles.selectError}>{selectError}</p>}

          {/* Footer row */}
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
                onClick={() => setCaptcha(randomCaptcha())}
                aria-label="refresh"
              >
                <RotateCw size={16} />
              </button>
              <span className={styles.captchaBox}>{captcha}</span>
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
              <Button radius="sm" loading={busy} onClick={handlePay}>
                {t.details.pay}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full violation details modal */}
      <Modal
        opened={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={t.details.violationInfo}
        centered
        radius="md"
      >
        {detailItem && (
          <div className={styles.modalBody}>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.details.violationNo}</span>
              <span className={styles.modalValue}>{detailItem.reference}</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.results.type}</span>
              <span className={styles.modalValue}>
                {isArabic ? detailItem.typeAr : detailItem.type}
              </span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.details.description}</span>
              <span className={styles.modalValue}>
                {isArabic
                  ? detailItem.descriptionAr || detailItem.typeAr
                  : detailItem.description || detailItem.type}
              </span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.results.date}</span>
              <span className={styles.modalValue}>{detailItem.date}</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.results.location}</span>
              <span className={styles.modalValue}>
                {isArabic ? detailItem.locationAr : detailItem.location}
              </span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.results.points}</span>
              <span className={styles.modalValue}>{detailItem.points}</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>{t.details.status}</span>
              <span className={styles.modalValue}>
                {statusLabel(detailItem.status)}
              </span>
            </div>
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
    </div>
  );
}
