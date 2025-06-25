import { ChangeEvent, Dispatch, SetStateAction, RefObject } from 'react';
import * as XLSX from 'xlsx';

type StringState = Dispatch<SetStateAction<Record<string, string>>>;
type NumberState = Dispatch<SetStateAction<Record<string, number>>>;
type DateState = Dispatch<SetStateAction<Record<string, Date>>>;

function formatCell(value: unknown) {
  if (!isNaN(Number(value)) && typeof value === 'string') return Number(value);
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return value as string;
}

export function handleFileUpload(
  e: ChangeEvent<HTMLInputElement>,
  inventory: RefObject<Record<string, number>>,
  setInventory: NumberState,
  setExcel: Dispatch<SetStateAction<(string | number)[][]>>,
  emptyInventory: (StringState | NumberState | DateState)[]
) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = evt => {
    const binaryStr = evt.target?.result;
    const workbook = XLSX.read(binaryStr, { type: 'binary' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    inventory.current = {};
    emptyInventory.forEach(item => item({}));
    const jsonData: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      cellDates: true,
      raw: false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const originalInventory = jsonData.shift() as string[];
    originalInventory.forEach((item, index) => {
      inventory.current[item] = index;
    });
    setInventory(inventory.current);
    const refined = jsonData.map(row => row.map(cell => formatCell(cell))) as (
      | string
      | number
    )[][];
    setExcel(refined);
    console.log('check excel data', refined);
  };

  reader.readAsArrayBuffer(file);
}
