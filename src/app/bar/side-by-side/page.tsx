'use client';

import {
  ArgumentAxis,
  Chart,
  CommonSeriesSettings,
  Export,
  Format,
  Label,
  Legend,
  Series,
  ZoomAndPan
} from 'devextreme-react/chart';
import { DragEvent, ChangeEvent, useEffect, useRef, useState } from 'react';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';

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

export default function Home() {
  const inventory = useRef<Record<string, number>>({});
  const [xInventory, setXInventory] = useState<Record<string, string>>({});
  const [yInventory, setYInventory] = useState<
    Record<string, (number | string)[]>
  >({});
  const [remainInventory, setRemainInventory] = useState<
    Record<string, number>
  >({});
  const [excel, setExcel] = useState<(string | number)[][]>([]);
  const [dataSource, setDataSource] = useState<
    Record<string, string | number>[]
  >([]);
  const [propertyChange, setPropertyChange] = useState<string>('');
  const dragStartIdx = useRef<number>(-1);
  const dragEndIdx = useRef<number>(-1);

  useEffect(() => {
    if (!Object.keys(xInventory).length || !Object.keys(yInventory).length) {
      setDataSource([]);
      return;
    }
    const xkeys = Object.keys(xInventory);
    const ykeys = Object.keys(yInventory);
    const format: Record<string, string | number | number[]>[] = [];
    const match: Record<string, number> = {};
    let cnt = 0;
    excel.forEach(item => {
      let idx = 0;
      const keyword = xkeys.map(key => item[inventory.current[key]]).join('/');
      if (keyword in match) idx = match[keyword];
      else {
        match[keyword] = cnt;
        idx = cnt;
        cnt++;
        const newFormat: Record<string, string | number | number[]> = {
          [xkeys.join('/')]: keyword
        };
        ykeys.forEach(item => (newFormat[item] = []));
        format.push(newFormat);
      }
      ykeys.forEach(key =>
        (format[idx][key] as number[]).push(
          Number(item[inventory.current[key]])
        )
      );
    });

    const final: Record<string, string | number>[] = format.map(item => {
      ykeys.forEach(key => {
        item[key] = item[key] as number[];
        const Sum = item[key].reduce((a, b) => a + b, 0);
        const Len = item[key].length;
        const Avg = Sum / Len;
        switch (yInventory[key][1]) {
          case '합계':
            item[key] = Sum;
            break;
          case '카운트':
            item[key] = Len;
            break;
          case '고유 카운트':
            item[key] = new Set(item[key]).size;
            break;
          case '최소값':
            item[key] = Math.min(...item[key]);
            break;
          case '최대값':
            item[key] = Math.max(...item[key]);
            break;
          case '평균':
            item[key] = Avg;
            break;
          case '표준편차':
            item[key] = Math.sqrt(
              item[key].reduce((a, b) => a + (b - Avg) ** 2, 0) / (Len - 1)
            );
            break;
          case '모집단 표준편차':
            item[key] = Math.sqrt(
              item[key].reduce((a, b) => a + (b - Avg) ** 2, 0) / Len
            );
            break;
          case '분산':
            item[key] =
              item[key].reduce((a, b) => a + (b - Avg) ** 2, 0) / (Len - 1);
            break;
          case '모집단 분산':
            item[key] = item[key].reduce((a, b) => a + (b - Avg) ** 2, 0) / Len;
            break;
          case '중간값':
            if (Len === 0) {
              item[key] = 0;
              break;
            }
            if (Len === 1) {
              item[key] = item[key][0];
              break;
            }
            const sorted = item[key].sort((a, b) => a - b);
            item[key] =
              Len % 2 === 0
                ? (sorted[Math.floor(Len / 2) - 1] +
                    sorted[Math.floor(Len / 2)]) /
                  2
                : sorted[Math.floor(Len / 2)];
            break;
          case '최빈값':
            const freq: Record<number, number> = {};
            for (const num of item[key]) {
              freq[num] = (freq[num] || 0) + 1;
            }
            const maxFreq = Math.max(...Object.values(freq));
            const modes = Object.entries(freq)
              .filter(([, v]) => v === maxFreq)
              .map(([k]) => Number(k));
            item[key] = modes[0];
            break;
          default:
            console.error('error');
        }
      });
      return item as Record<string, string | number>;
    });
    console.log('check graph data', final);
    setDataSource(final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xInventory, yInventory]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'x' | 'y'
    ) => {
      setPropertyChange('');
      const item = e.dataTransfer.getData('item');
      const from = e.dataTransfer.getData('from');

      if (from === to) {
        if (
          dragStartIdx.current === -1 ||
          dragEndIdx.current === -1 ||
          dragStartIdx.current === dragEndIdx.current
        ) {
          dragStartIdx.current = -1;
          dragEndIdx.current = -1;
          return;
        }

        const splitIdx =
          dragStartIdx.current > dragEndIdx.current
            ? dragEndIdx.current
            : dragEndIdx.current - 1;
        const [changeInventory, setChangeInventory] =
          from === 'unselected'
            ? [remainInventory, setRemainInventory]
            : from === 'x'
              ? [xInventory, setXInventory]
              : [yInventory, setYInventory];
        const prevInventory = { ...changeInventory };
        delete prevInventory[item];
        const total = Object.entries(prevInventory);
        const left = Object.fromEntries(total.slice(0, splitIdx));
        const right = Object.fromEntries(total.slice(splitIdx));
        setChangeInventory({
          ...left,
          [item]: changeInventory[item],
          ...right
        });
        dragStartIdx.current = -1;
        dragEndIdx.current = -1;
        return;
      }

      if (to === 'y' && typeof excel[0][inventory.current[item]] !== 'number') {
        alert('y값은 숫자여야 합니다.');
        dragStartIdx.current = -1;
        dragEndIdx.current = -1;
        return;
      }

      switch (to) {
        case 'unselected':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(remainInventory);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setRemainInventory({
              ...left,
              [item]: inventory.current[item],
              ...right
            });
          } else
            setRemainInventory(prev => ({
              ...prev,
              [item]: inventory.current[item]
            }));
          break;
        case 'x':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(xInventory);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setXInventory({
              ...left,
              [item]: String(inventory.current[item]),
              ...right
            });
          } else
            setXInventory(prev => ({
              ...prev,
              [item]: String(inventory.current[item])
            }));
          break;
        case 'y':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(yInventory);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setYInventory({
              ...left,
              [item]: [inventory.current[item], '합계'],
              ...right
            });
          } else
            setYInventory(prev => ({
              ...prev,
              [item]: [inventory.current[item], '합계']
            }));
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
          setXInventory(prev => {
            const newRemainInventory = { ...prev };
            delete newRemainInventory[item];
            return newRemainInventory;
          });
          break;
        case 'y':
          setYInventory(prev => {
            const newRemainInventory = { ...prev };
            delete newRemainInventory[item];
            return newRemainInventory;
          });
          break;
        default:
          console.error('error');
          break;
      }

      dragStartIdx.current = -1;
      dragEndIdx.current = -1;
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const onDragEnter = (idx: number) => (dragEndIdx.current = idx);

    const onDragStart = (
      e: DragEvent<HTMLDivElement>,
      item: string,
      from: 'unselected' | 'x' | 'y',
      idx: number
    ) => {
      e.dataTransfer.setData('item', item);
      e.dataTransfer.setData('from', from);
      dragStartIdx.current = idx;
    };

    function handlePropertyChange(e: ChangeEvent<HTMLSelectElement>) {
      setYInventory(prev => ({
        ...prev,
        [propertyChange]: [
          prev[propertyChange][0],
          e.target.value as PropertyType
        ]
      }));
    }

    function settingOpen(name: string) {
      setPropertyChange(name);
    }

    return (
      <div className={styles.inventoryBox}>
        <div
          className={styles.inventorySection}
          onDrop={e => onDrop(e, 'unselected')}
          onDragOver={onDragOver}
        >
          <h2>unSelected</h2>
          {Object.keys(remainInventory).map((item, idx) => (
            <div
              key={item}
              className={styles.inventoryItem}
              draggable
              onDragStart={e => onDragStart(e, item, 'unselected', idx)}
              onDragEnter={() => onDragEnter(idx)}
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
            {Object.keys(xInventory).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'x', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'y')}
            onDragOver={onDragOver}
          >
            <h2>y</h2>
            {Object.keys(yInventory).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                draggable
                onDragStart={e => onDragStart(e, item, 'y', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                <div>{item}</div>
                <h5 style={{ color: 'red' }} onClick={() => settingOpen(item)}>
                  set
                </h5>
              </div>
            ))}
          </div>
        </div>
        {propertyChange !== '' ? (
          <div>
            <select
              defaultValue={yInventory[propertyChange][1]}
              onChange={handlePropertyChange}
            >
              {NumberProperty.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <h3
              onClick={() => setPropertyChange('')}
              style={{ color: 'red', cursor: 'pointer' }}
            >
              X
            </h3>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={e =>
          handleFileUpload(e, inventory, setRemainInventory, setExcel, [
            setXInventory,
            setYInventory
          ])
        }
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <Chart id="chart" title="side by side bar" dataSource={dataSource}>
        <CommonSeriesSettings
          argumentField={Object.keys(xInventory).join('/')}
          type="bar"
          hoverMode="allArgumentPoints"
          selectionMode="allArgumentPoints"
        >
          {/* individual values in chart */}
          <Label visible={true}>
            <Format type="fixedPoint" precision={0} />
          </Label>
        </CommonSeriesSettings>

        {Object.keys(yInventory).map(item => (
          <Series
            key={item}
            valueField={item} // y value
            argumentField={Object.keys(xInventory).join('/')} // x value
            name={item}
          />
        ))}

        {/* customize x layer name */}
        <ArgumentAxis>
          <Label
            customizeText={({ valueText }: { valueText: string }) =>
              `X: ${valueText}`
            }
          />
        </ArgumentAxis>

        {/* location of chart property */}
        <Legend verticalAlignment="bottom" horizontalAlignment="center" />

        <ZoomAndPan argumentAxis="both" valueAxis="both" />
        <Export enabled={true} />
      </Chart>
    </>
  );
}
