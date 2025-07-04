'use client';

import { DragEvent, useState, useEffect, useRef } from 'react';
import Chart, {
  CommonSeriesSettings,
  Series,
  ValueAxis,
  Export,
  Legend,
  Tooltip,
  ZoomAndPan
} from 'devextreme-react/chart';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';

export default function Range() {
  const inventory = useRef<Record<string, number>>({});
  const [xInventory, setXInventory] = useState<Record<string, string>>({});
  const [valueStart, setValueStart] = useState<Record<string, number>>({});
  const [valueEnd, setValueEnd] = useState<Record<string, number>>({});
  const [pair, setPair] = useState<string[][]>([]);
  const [remainInventory, setRemainInventory] = useState<
    Record<string, number>
  >({});
  const [excel, setExcel] = useState<(string | number)[][]>([]);
  const [dataSource, setDataSource] = useState<
    Record<string, string | number>[]
  >([]);
  const dragStartIdx = useRef<number>(-1);
  const dragEndIdx = useRef<number>(-1);

  useEffect(() => {
    if (
      !Object.keys(xInventory).length ||
      !Object.keys(valueStart).length ||
      !Object.keys(valueEnd).length ||
      Object.keys(valueStart).length !== Object.keys(valueEnd).length
    ) {
      setPair([]);
      setDataSource([]);
      return;
    }

    const xkey = Object.keys(xInventory)[0];
    const valueStarts = Object.keys(valueStart);
    const valueEnds = Object.keys(valueEnd);
    const format: Record<string, string | number>[] = [];
    const match: Record<string, number> = {};
    let cnt = 0;

    const newPair: string[][] = [];
    for (let i = 0; i < valueStarts.length; i++) {
      newPair.push([valueStarts[i], valueEnds[i], i] as string[]);
    }
    setPair(newPair);

    // 형식에 맞지 않는 엑셀일때는 기존 값(valueStart, valueEnd)에 더함
    // 디버그 필요
    excel.forEach(item => {
      let idx = 0;
      if (item[inventory.current[xkey]] in match)
        idx = match[item[inventory.current[xkey]]];
      else {
        match[item[inventory.current[xkey]]] = cnt;
        idx = cnt;
        cnt++;
        const newFormat = { [xkey]: item[inventory.current[xkey]] };
        valueStarts.forEach(item => (newFormat[item] = 0));
        valueEnds.forEach(item => (newFormat[item] = 0));
        format.push(newFormat);
      }
      valueStarts.forEach(
        key =>
          (format[idx][key] =
            Number(format[idx][key]) + Number(item[inventory.current[key]]))
      );
      valueEnds.forEach(
        key =>
          (format[idx][key] =
            Number(format[idx][key]) + Number(item[inventory.current[key]]))
      );
    });
    console.log(format);
    setDataSource(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xInventory, valueStart, valueEnd]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'x' | 'valueStart' | 'valueEnd'
    ) => {
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
              : from === 'valueStart'
                ? [valueStart, setValueStart]
                : [valueEnd, setValueEnd];
        const prevInventory = { ...changeInventory };
        delete prevInventory[item];
        const total = Object.entries(prevInventory);
        const left = Object.fromEntries(total.slice(0, splitIdx));
        const right = Object.fromEntries(total.slice(splitIdx));
        setChangeInventory({
          ...left,
          [item]: inventory.current[item],
          ...right
        });
        dragStartIdx.current = -1;
        dragEndIdx.current = -1;
        return;
      }

      if (
        ['valueStart', 'valueEnd'].includes(to) &&
        typeof excel[0][inventory.current[item]] !== 'number'
      ) {
        alert('값은 숫자여야 합니다.');
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
          if (Object.keys(xInventory).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(xInventory)[0]]:
                inventory.current[Object.keys(xInventory)[0]]
            }));
          setXInventory({
            [String(item)]: String(inventory.current[item])
          });
          break;
        case 'valueStart':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(valueStart);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setValueStart({
              ...left,
              [item]: inventory.current[item],
              ...right
            });
          } else
            setValueStart(prev => ({
              ...prev,
              [String(item)]: Number(inventory.current[item])
            }));
          break;
        case 'valueEnd':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(valueEnd);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setValueEnd({
              ...left,
              [item]: inventory.current[item],
              ...right
            });
          } else
            setValueEnd(prev => ({
              ...prev,
              [String(item)]: Number(inventory.current[item])
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
          setXInventory({});
          break;
        case 'valueStart':
          setValueStart(prev => {
            const newRemainValue = { ...prev };
            delete newRemainValue[item];
            return newRemainValue;
          });
          break;
        case 'valueEnd':
          setValueEnd(prev => {
            const newRemainValue = { ...prev };
            delete newRemainValue[item];
            return newRemainValue;
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
      from: 'unselected' | 'x' | 'valueStart' | 'valueEnd',
      idx: number
    ) => {
      e.dataTransfer.setData('item', item);
      e.dataTransfer.setData('from', from);
      dragStartIdx.current = idx;
    };

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
          <div
            onDragEnter={() => onDragEnter(Object.keys(remainInventory).length)}
            style={{ height: '5px' }}
          />
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
            <div
              onDragEnter={() => onDragEnter(Object.keys(xInventory).length)}
              style={{ height: '5px' }}
            />
          </div>
          <h5>valueStart, valueEnd</h5>
          <h5>개수는 동일해야 합니다.</h5>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'valueStart')}
            onDragOver={onDragOver}
          >
            <h2>valueStart</h2>
            {Object.keys(valueStart).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'valueStart', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
            <div
              onDragEnter={() => onDragEnter(Object.keys(valueStart).length)}
              style={{ height: '5px' }}
            />
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'valueEnd')}
            onDragOver={onDragOver}
          >
            <h2>valueEnd</h2>
            {Object.keys(valueEnd).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'valueEnd', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
            <div
              onDragEnter={() => onDragEnter(Object.keys(valueEnd).length)}
              style={{ height: '5px' }}
            />
          </div>
        </div>
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
            setValueStart,
            setValueEnd
          ])
        }
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <Chart dataSource={dataSource} palette="Violet" title="Range">
        <CommonSeriesSettings
          argumentField={Object.keys(xInventory)[0]}
          type="rangebar"
          minBarSize={2}
        />

        {pair.map(item => (
          <Series
            key={item[2]}
            rangeValue1Field={item[0]}
            rangeValue2Field={item[1]}
            name={item[2]}
          />
        ))}

        {/* y value */}
        <ValueAxis title="Number View" />

        {/* location of chart property */}
        <Legend verticalAlignment="bottom" horizontalAlignment="center" />

        <Export enabled={true} />
        <Tooltip enabled={true} />
        <ZoomAndPan argumentAxis="both" valueAxis="both" />
      </Chart>
    </>
  );
}
