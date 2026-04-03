const STORAGE_KEY = 'gugudan_records';

export interface Record {
  date: string;         // YYYY-MM-DD HH:MM
  avgTime: number;      // 문제당 평균 응답 시간(초)
  correct: number;
  total: number;
  accuracy: number;     // %
}

export function saveRecord(record: Record): void {
  const records = getRecords();
  records.unshift(record);
  // 최대 50개 보관
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
}

export function getRecords(): Record[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function formatDate(date: Date): string {
  const YY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${YY}-${MM}-${DD} ${hh}:${mm}`;
}
