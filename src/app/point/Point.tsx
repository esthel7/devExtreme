'use client';

import { DragEvent, useEffect, useRef, useState } from 'react';
import {
  Chart,
  Series,
  CommonSeriesSettings,
  ValueAxis,
  ArgumentAxis,
  Grid,
  MinorGrid,
  CommonPaneSettings,
  Border,
  ZoomAndPan
} from 'devextreme-react/chart';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';

export default function Point() {
  const inventory = useRef<Record<string, number>>({});
  const [x1, setX1] = useState<Record<string, number>>({});
  const [y1, setY1] = useState<Record<string, number>>({});
  const [x2, setX2] = useState<Record<string, number>>({});
  const [y2, setY2] = useState<Record<string, number>>({});
  const [remainInventory, setRemainInventory] = useState<
    Record<string, number>
  >({});
  const [excel, setExcel] = useState<(string | number)[][]>([]);
  const [dataSource, setDataSource] = useState<
    Record<string, string | number | Date>[]
  >([]);
  const dragStartIdx = useRef<number>(-1);
  const dragEndIdx = useRef<number>(-1);

  useEffect(() => {
    if (
      !Object.keys(x1).length ||
      !Object.keys(y1).length ||
      !Object.keys(x2).length ||
      !Object.keys(y2).length
    ) {
      setDataSource([]);
      return;
    }
    const x1key = Object.keys(x1)[0];
    const y1key = Object.keys(y1)[0];
    const x2key = Object.keys(x2)[0];
    const y2key = Object.keys(y2)[0];
    const format: Record<string, number>[] = [];

    excel.forEach(item => {
      format.push({
        x1: Number(item[inventory.current[x1key]]),
        y1: Number(item[inventory.current[y1key]]),
        x2: Number(item[inventory.current[x2key]]),
        y2: Number(item[inventory.current[y2key]])
      });
    });
    console.log(format);
    setDataSource(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x1, y1, x2, y2]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'x1' | 'y1' | 'x2' | 'y2'
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
            : from === 'x1'
              ? [x1, setX1]
              : from === 'y1'
                ? [y1, setY1]
                : from === 'x2'
                  ? [x2, setX2]
                  : [y2, setY2];
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

      if (typeof excel[0][inventory.current[item]] !== 'number') {
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
        case 'x1':
          if (Object.keys(x1).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(x1)[0]]: inventory.current[Object.keys(x1)[0]]
            }));
          setX1({
            [item]: inventory.current[item]
          });
          break;
        case 'y1':
          if (Object.keys(y1).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(y1)[0]]: inventory.current[Object.keys(y1)[0]]
            }));
          setY1({
            [String(item)]: Number(inventory.current[item])
          });
          break;
        case 'x2':
          if (Object.keys(x2).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(x2)[0]]: inventory.current[Object.keys(x2)[0]]
            }));
          setX2({
            [String(item)]: Number(inventory.current[item])
          });
          break;
        case 'y2':
          if (Object.keys(y2).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(y2)[0]]: inventory.current[Object.keys(y2)[0]]
            }));
          setY2({
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
        case 'x1':
          setX1({});
          break;
        case 'y1':
          setY1({});
          break;
        case 'x2':
          setX2({});
          break;
        case 'y2':
          setY2({});
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
      from: 'unselected' | 'x1' | 'y1' | 'x2' | 'y2',
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
        </div>
        <div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'x1')}
            onDragOver={onDragOver}
          >
            <h2>x1</h2>
            {Object.keys(x1).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'x1', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'y1')}
            onDragOver={onDragOver}
          >
            <h2>y1</h2>
            {Object.keys(y1).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'y1', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'x2')}
            onDragOver={onDragOver}
          >
            <h2>x2</h2>
            {Object.keys(x2).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'x2', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'y2')}
            onDragOver={onDragOver}
          >
            <h2>y2</h2>
            {Object.keys(y2).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'y2', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
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
            setX1,
            setY1,
            setX2,
            setY2
          ])
        }
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <Chart dataSource={dataSource}>
        <CommonSeriesSettings type="scatter" />
        <Series argumentField="x1" valueField="y1" />
        <Series
          argumentField="x2"
          valueField="y2"
          point={{ symbol: 'triangleDown' }}
        />

        <ArgumentAxis tickInterval={5}>
          {/* vertical line */}
          <Grid visible={true} />
          {/* more vertical line */}
          <MinorGrid visible={true} />
        </ArgumentAxis>

        {/* y value */}
        <ValueAxis tickInterval={50} />

        {/* outline border of chart */}
        <CommonPaneSettings>
          <Border visible={false} />
        </CommonPaneSettings>

        <ZoomAndPan argumentAxis="both" valueAxis="both" />
      </Chart>
    </>
  );
}
