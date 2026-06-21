import { ViolationItem, ViolationSearchInput, ViolationSearchResult } from '../../types';

/**
 * Deterministic mock provider. Generates realistic-looking violation data
 * seeded from the search identifier so the same input always returns the
 * same result (mirrors how a real MOI lookup behaves on repeat queries).
 *
 * Swap this for a real upstream by setting VIOLATION_PROVIDER=http.
 */

const CATALOG = [
  { type: 'Speeding', typeAr: 'تجاوز السرعة المقررة', desc: 'Exceeding the posted speed limit', descAr: 'تجاوز الحد الأقصى للسرعة', amount: 600, points: 4 },
  { type: 'Red Light', typeAr: 'تجاوز الإشارة الحمراء', desc: 'Crossing on a red traffic signal', descAr: 'عبور الإشارة الضوئية الحمراء', amount: 6000, points: 7 },
  { type: 'Illegal Parking', typeAr: 'الوقوف في مكان ممنوع', desc: 'Parking in a restricted zone', descAr: 'الوقوف في منطقة محظورة', amount: 500, points: 0 },
  { type: 'No Seatbelt', typeAr: 'عدم ربط حزام الأمان', desc: 'Driver not wearing a seatbelt', descAr: 'عدم استخدام حزام الأمان أثناء القيادة', amount: 500, points: 0 },
  { type: 'Mobile Phone Use', typeAr: 'استخدام الهاتف أثناء القيادة', desc: 'Using a phone while driving', descAr: 'استخدام الهاتف المحمول أثناء القيادة', amount: 500, points: 0 },
  { type: 'Expired Registration', typeAr: 'انتهاء استمارة المركبة', desc: 'Driving with expired vehicle registration', descAr: 'قيادة مركبة منتهية الاستمارة', amount: 500, points: 0 },
];

const LOCATIONS = [
  { en: 'Al Rayyan Highway', ar: 'طريق الريان السريع' },
  { en: 'West Bay, Doha', ar: 'الخليج الغربي، الدوحة' },
  { en: 'Salwa Road', ar: 'طريق سلوى' },
  { en: 'Doha Expressway', ar: 'طريق الدوحة السريع' },
  { en: 'Al Wakrah', ar: 'الوكرة' },
  { en: 'Lusail Boulevard', ar: 'لوسيل بوليفارد' },
];

/** Simple deterministic string hash (FNV-1a style). */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function identifierOf(input: ViolationSearchInput): string {
  return (input.plateNumber || input.personalNumber || input.establishmentId || 'unknown').trim();
}

function pad(n: number, len: number): string {
  return n.toString().padStart(len, '0');
}

export function generateMockResult(input: ViolationSearchInput): ViolationSearchResult {
  const identifier = identifierOf(input);
  const seed = hash(identifier + input.searchType);

  // 0–4 violations depending on the seed; some identifiers are "clean".
  const count = seed % 5;
  const violations: ViolationItem[] = [];

  for (let i = 0; i < count; i++) {
    const s = hash(`${identifier}-${i}`);
    const cat = CATALOG[s % CATALOG.length];
    const loc = LOCATIONS[(s >> 3) % LOCATIONS.length];
    const daysAgo = (s % 240) + 1;
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    const status = (s % 7 === 0 ? 'Paid' : 'Pending') as ViolationItem['status'];

    violations.push({
      reference: `QTR-${pad(seed % 100000, 5)}-${pad(i + 1, 2)}`,
      type: cat.type,
      typeAr: cat.typeAr,
      description: cat.desc,
      descriptionAr: cat.descAr,
      date,
      location: loc.en,
      locationAr: loc.ar,
      amount: cat.amount,
      points: cat.points,
      status,
    });
  }

  const unpaid = violations.filter((v) => v.status !== 'Paid');
  const totalAmount = unpaid.reduce((sum, v) => sum + v.amount, 0);

  const nameSeed = seed % 6;
  const names = [
    { en: 'Ahmed Al-Sulaiti', ar: 'أحمد السليطي' },
    { en: 'Mohammed Al-Kuwari', ar: 'محمد الكواري' },
    { en: 'Fatima Al-Marri', ar: 'فاطمة المري' },
    { en: 'Khalid Al-Thani', ar: 'خالد آل ثاني' },
    { en: 'Sara Al-Mannai', ar: 'سارة المناعي' },
    { en: 'Yousef Al-Naimi', ar: 'يوسف النعيمي' },
  ];
  const owner = names[nameSeed];

  return {
    referenceId: `REF-${pad(seed % 1000000, 6)}`,
    searchType: input.searchType,
    identifier,
    owner: { name: owner.en, nameAr: owner.ar },
    violations,
    totalAmount,
    totalCount: violations.length,
    currency: 'QAR',
  };
}
