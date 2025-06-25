'use client';

import {
  Chart,
  Series,
  Legend,
  ValueAxis,
  ZoomAndPan
} from 'devextreme-react/chart';
import { DragEvent, useEffect, useRef, useState } from 'react';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';
import dstyles from './drill-down.module.css';

export default function Home() {
  const inventory = useRef<Record<string, number>>({});
  const [xInventory, setXInventory] = useState<Record<string, string>>({});
  const [yInventory, setYInventory] = useState<Record<string, number>>({});
  const [remainInventory, setRemainInventory] = useState<
    Record<string, number>
  >({});
  const [excel, setExcel] = useState<(string | number)[][]>([]);
  const [dataSource, setDataSource] = useState<
    Record<string, string | number>[]
  >([]);
  const [isFirstLevel, setIsFirstLevel] = useState(true);
  const [area, setArea] = useState('');

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'x' | 'y'
    ) => {
      const item = e.dataTransfer.getData('item');
      const from = e.dataTransfer.getData('from');

      if (from === to) return; // move to same area
      if (to === 'y' && typeof excel[0][inventory.current[item]] !== 'number') {
        alert('y값은 숫자여야 합니다.');
        return;
      }
      if (to === 'x' && item !== '시도') {
        alert('drill-down 그래프에는 "시도"만 가능합니다.');
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
            [String(item)]: String(inventory.current[item])
          });
          break;
        case 'y':
          if (Object.keys(yInventory).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(yInventory)[0]]:
                inventory.current[Object.keys(yInventory)[0]]
            }));
          setYInventory({
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
        case 'y':
          setYInventory({});
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
      from: 'unselected' | 'x' | 'y'
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
            onDrop={e => onDrop(e, 'y')}
            onDragOver={onDragOver}
          >
            <h2>y</h2>
            {Object.keys(yInventory).map(item => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'y')}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onPointClick(e: any) {
    if (isFirstLevel) {
      setIsFirstLevel(false);
      setArea(e.target.originalArgument.toString());
    }
  }

  function customizePoint(): {
    color: string;
    hoverStyle?: {
      color?: string;
      hatching?: string;
    };
  } {
    const colors = ['#6babac', '#e55253'];
    return {
      color: colors[Number(isFirstLevel)],
      hoverStyle: !isFirstLevel
        ? {
            hatching: 'none'
          }
        : {}
    };
  }

  function onButtonClick() {
    if (!isFirstLevel) setIsFirstLevel(true);
  }

  useEffect(() => {
    if (!Object.keys(xInventory).length || !Object.keys(yInventory).length) {
      setDataSource([]);
      return;
    }
    const xkey = Object.keys(xInventory)[0];
    const ykey = Object.keys(yInventory)[0];
    const format: Record<string, string | number>[] = [];
    const match: Record<string, number> = {};
    let cnt = 0;
    excel.forEach(item => {
      if (!isFirstLevel && item[inventory.current[xkey]] !== area) return;
      const filterXkey = isFirstLevel ? '시도' : '시군구';
      let idx = 0;
      if (item[inventory.current[filterXkey]] in match)
        idx = match[item[inventory.current[filterXkey]]];
      else {
        match[item[inventory.current[filterXkey]]] = cnt;
        idx = cnt;
        cnt++;
        const newFormat = {
          arg: item[inventory.current[filterXkey]],
          val: 0,
          parentId: item[inventory.current['시도']]
        };
        format.push(newFormat);
      }
      format[idx]['val'] =
        Number(format[idx]['val']) + Number(item[inventory.current[ykey]]);
    });
    console.log('check graph data', format);
    setDataSource(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstLevel, xInventory, yInventory]);

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
      <div className={dstyles.chartBox}>
        <Chart
          id="chart"
          title="drill-down bar"
          dataSource={dataSource}
          // control graph view
          customizePoint={customizePoint}
          // start data filtering
          onPointClick={onPointClick}
          className={isFirstLevel ? 'pointer-on-bars' : ''}
        >
          <Series type="bar" />

          {/* chart value property */}
          <ValueAxis showZero={false} />

          {/* location of chart property */}
          <Legend visible={false} />

          <ZoomAndPan argumentAxis="both" valueAxis="both" />
        </Chart>
        {isFirstLevel ? null : (
          <button className={dstyles.backButton} onClick={onButtonClick}>
            Back
          </button>
        )}
      </div>
    </>
  );
}
