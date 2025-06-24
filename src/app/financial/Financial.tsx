'use client';

import { DragEvent, useEffect, useRef, useState } from 'react';
import Chart, {
  CommonSeriesSettings,
  Series,
  Reduction,
  ArgumentAxis,
  Label,
  Format,
  ValueAxis,
  Title,
  Export,
  Tooltip
} from 'devextreme-react/chart';
import * as XLSX from 'xlsx';
import styles from '@/app/page.module.css';

export default function Financial() {
  const inventory = useRef<Record<string, number>>({});
  const [xInventory, setXInventory] = useState<Record<string, Date>>({});
  const [open, setOpen] = useState<Record<string, number>>({});
  const [close, setClose] = useState<Record<string, number>>({});
  const [high, setHigh] = useState<Record<string, number>>({});
  const [low, setLow] = useState<Record<string, number>>({});
  const [remainInventory, setRemainInventory] = useState<
    Record<string, number>
  >({});
  const [excel, setExcel] = useState<(string | number)[][]>([]);
  const [dataSource, setDataSource] = useState<
    Record<string, string | number | Date>[]
  >([]);

  const formatCell = (value: unknown) => {
    if (!isNaN(Number(value)) && typeof value === 'string')
      return Number(value);
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return value as string;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = evt => {
      const binaryStr = evt.target?.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      inventory.current = {};
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
      setRemainInventory(inventory.current);
      const refined = jsonData.map(row =>
        row.map(cell => formatCell(cell))
      ) as (string | number)[][];
      setExcel(refined);
      console.log('check excel data', refined);
    };

    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (
      !Object.keys(xInventory).length ||
      !Object.keys(open).length ||
      !Object.keys(close).length ||
      !Object.keys(high).length ||
      !Object.keys(low).length
    ) {
      setDataSource([]);
      return;
    }
    const xkey = Object.keys(xInventory)[0];
    const openItem = Object.keys(open)[0];
    const closeItem = Object.keys(close)[0];
    const highItem = Object.keys(high)[0];
    const lowItem = Object.keys(low)[0];
    const format: Record<string, string | number | Date>[] = [];
    const match: Record<string, number> = {};
    let cnt = 0;

    // 형식에 맞지 않는 엑셀일때는 기존 값(open, close, high, low)에 더함
    // 디버그 필요
    excel.forEach(item => {
      let idx = 0;
      if (item[inventory.current[xkey]] in match)
        idx = match[item[inventory.current[xkey]]];
      else {
        match[item[inventory.current[xkey]]] = cnt;
        idx = cnt;
        cnt++;
        format.push({
          [xkey]: new Date(item[inventory.current[xkey]]),
          o: 0,
          c: 0,
          h: 0,
          l: 0
        });
      }
      format[idx]['o'] =
        Number(format[idx]['o']) + Number(item[inventory.current[openItem]]);
      format[idx]['c'] =
        Number(format[idx]['c']) + Number(item[inventory.current[closeItem]]);
      format[idx]['h'] =
        Number(format[idx]['h']) + Number(item[inventory.current[highItem]]);
      format[idx]['l'] =
        Number(format[idx]['l']) + Number(item[inventory.current[lowItem]]);
    });
    console.log(format);
    setDataSource(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xInventory, open, close, high, low]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'x' | 'open' | 'close' | 'high' | 'low'
    ) => {
      const item = e.dataTransfer.getData('item');
      const from = e.dataTransfer.getData('from');

      if (from === to) return; // move to same area
      if (
        to === 'x' &&
        !(
          typeof excel[0][inventory.current[item]] === 'string' &&
          /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(
            String(excel[0][inventory.current[item]])
          )
        )
      ) {
        alert('x값은 날짜여야 합니다.');
        return;
      }
      if (
        ['open', 'close', 'high', 'low'].includes(to) &&
        typeof excel[0][inventory.current[item]] !== 'number'
      ) {
        console.log(
          typeof excel[0][inventory.current[item]],
          excel[0][inventory.current[item]]
        );
        alert('값은 숫자여야 합니다.');
        return;
      }

      switch (to) {
        case 'unselected':
          setRemainInventory(prev => ({
            ...prev,
            [item]: inventory.current[item]
          }));
          break;
        case 'x':
          if (Object.keys(xInventory).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(xInventory)[0]]:
                inventory.current[Object.keys(xInventory)[0]]
            }));
          setXInventory({
            [item]: new Date(inventory.current[item])
          });
          break;
        case 'open':
          if (Object.keys(open).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(open)[0]]: inventory.current[Object.keys(open)[0]]
            }));
          setOpen({
            [String(item)]: Number(inventory.current[item])
          });
          break;
        case 'close':
          if (Object.keys(close).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(close)[0]]: inventory.current[Object.keys(close)[0]]
            }));
          setClose({
            [String(item)]: Number(inventory.current[item])
          });
          break;
        case 'high':
          if (Object.keys(high).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(high)[0]]: inventory.current[Object.keys(high)[0]]
            }));
          setHigh({
            [String(item)]: Number(inventory.current[item])
          });
          break;
        case 'low':
          if (Object.keys(low).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(low)[0]]: inventory.current[Object.keys(low)[0]]
            }));
          setLow({
            [String(item)]: Number(inventory.current[item])
          });
          break;
        default:
          console.error('error');
          break;
      }

      switch (from) {
        case 'unselected':
          setRemainInventory(prev => {
            const newRemainInventory = { ...prev };
            delete newRemainInventory[item];
            return newRemainInventory;
          });
          break;
        case 'x':
          setXInventory({});
          break;
        case 'open':
          setOpen({});
          break;
        case 'close':
          setClose({});
          break;
        case 'high':
          setHigh({});
          break;
        case 'low':
          setLow({});
          break;
        default:
          console.error('error');
          break;
      }
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const onDragStart = (
      e: DragEvent<HTMLDivElement>,
      item: string,
      from: 'unselected' | 'x' | 'open' | 'close' | 'high' | 'low'
    ) => {
      e.dataTransfer.setData('item', item);
      e.dataTransfer.setData('from', from);
    };

    return (
      <div className={styles.inventoryBox}>
        <div
          className={styles.inventorySection}
          onDrop={e => onDrop(e, 'unselected')}
          onDragOver={onDragOver}
        >
          <h2>unSelected</h2>
          {Object.keys(remainInventory).map(item => (
            <div
              key={item}
              className={styles.inventoryItem}
              draggable
              onDragStart={e => onDragStart(e, item, 'unselected')}
            >
              {item}
            </div>
          ))}
        </div>
        <div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'x')}
            onDragOver={onDragOver}
          >
            <h2>x</h2>
            {Object.keys(xInventory).map(item => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'x')}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'open')}
            onDragOver={onDragOver}
          >
            <h2>open</h2>
            {Object.keys(open).map(item => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'open')}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'close')}
            onDragOver={onDragOver}
          >
            <h2>close</h2>
            {Object.keys(close).map(item => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'close')}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'high')}
            onDragOver={onDragOver}
          >
            <h2>high</h2>
            {Object.keys(high).map(item => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'high')}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'low')}
            onDragOver={onDragOver}
          >
            <h2>low</h2>
            {Object.keys(low).map(item => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'low')}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function customizeTooltip(arg: {
    openValue: number;
    closeValue: number;
    highValue: number;
    lowValue: number;
  }) {
    return {
      text: `Open: ${arg.openValue}<br/>
Close: ${arg.closeValue}<br/>
High: ${arg.highValue}<br/>
Low: ${arg.lowValue}<br/>`
    };
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <Chart id="chart" title="Stock" dataSource={dataSource}>
        <CommonSeriesSettings
          argumentField={Object.keys(xInventory)[0]}
          type="stock"
        />
        <Series
          name={Object.keys(xInventory)[0]}
          openValueField="o"
          highValueField="h"
          lowValueField="l"
          closeValueField="c"
        >
          <Reduction color="red" />
        </Series>

        {/* format setting: 0/0/0000 */}
        <ArgumentAxis workdaysOnly={true}>
          <Label format="shortDate" />
        </ArgumentAxis>

        {/* y value interval */}
        <ValueAxis tickInterval={1}>
          <Title text="Number View" />
          <Label>
            <Format precision={0} />
          </Label>
        </ValueAxis>

        <Export enabled={true} />
        <Tooltip
          enabled={true}
          customizeTooltip={customizeTooltip}
          location="edge"
        />
      </Chart>
    </>
  );
}
