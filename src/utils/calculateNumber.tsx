// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NumberProperty = [
  '합계',
  '카운트',
  '고유 카운트',
  '최소값',
  '최대값',
  '평균',
  '표준편차',
  '모집단 표준편차',
  '분산',
  '모집단 분산',
  '중간값',
  '최빈값'
] as const;

type PropertyType = (typeof NumberProperty)[number];

export function calculateNumber(flag: PropertyType, arr: number[]): number {
  const Sum = arr.reduce((a, b) => a + b, 0);
  const Len = arr.length;
  const Avg = Sum / Len;
  switch (flag) {
    case '합계':
      return Sum;
    case '카운트':
      return Len;
    case '고유 카운트':
      return new Set(arr).size;
    case '최소값':
      return Math.min(...arr);
    case '최대값':
      return Math.max(...arr);
    case '평균':
      return Avg;
    case '표준편차':
      return Math.sqrt(arr.reduce((a, b) => a + (b - Avg) ** 2, 0) / (Len - 1));
    case '모집단 표준편차':
      return Math.sqrt(arr.reduce((a, b) => a + (b - Avg) ** 2, 0) / Len);
    case '분산':
      return arr.reduce((a, b) => a + (b - Avg) ** 2, 0) / (Len - 1);
    case '모집단 분산':
      return arr.reduce((a, b) => a + (b - Avg) ** 2, 0) / Len;
    case '중간값':
      if (Len === 0) return 0;
      if (Len === 1) return arr[0];
      const sorted = arr.sort((a, b) => a - b);
      return Len % 2 === 0
        ? (sorted[Math.floor(Len / 2) - 1] + sorted[Math.floor(Len / 2)]) / 2
        : sorted[Math.floor(Len / 2)];
    case '최빈값':
      const freq: Record<number, number> = {};
      for (const num of arr) {
        freq[num] = (freq[num] || 0) + 1;
      }
      const maxFreq = Math.max(...Object.values(freq));
      const modes = Object.entries(freq)
        .filter(([, v]) => v === maxFreq)
        .map(([k]) => Number(k));
      return modes[0];
    default:
      console.error('error');
      return 0;
  }
}
