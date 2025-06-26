'use client';

import { DragEvent, useEffect, useRef, useState } from 'react';
import {
  Chart,
  Series,
  CommonSeriesSettings,
  Legend,
  ValueAxis,
  ArgumentAxis,
  Label,
  Border,
  Tooltip,
  Export
} from 'devextreme-react/chart';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';

export default function Home() {
  const inventory = useRef<Record<string, number>>({});
  const names = useRef<string[]>([]);
  const [category, setCategory] = useState<Record<string, string>>({});
  const [xInventory, setXInventory] = useState<Record<string, number>>({});
  const [yInventory, setYInventory] = useState<Record<string, number>>({});
  const [size, setSize] = useState<Record<string, number>>({});
  const [tag, setTag] = useState<Record<string, string>>({});
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
      !Object.keys(category).length ||
      !Object.keys(xInventory).length ||
      !Object.keys(yInventory).length ||
      !Object.keys(size).length ||
      !Object.keys(tag).length
    ) {
      setDataSource([]);
      return;
    }
    const categorykey = Object.keys(category)[0];
    const xkey = Object.keys(xInventory)[0];
    const ykey = Object.keys(yInventory)[0];
    const sizekey = Object.keys(size)[0];
    const tagkey = Object.keys(tag)[0];
    const format: Record<string, string | number>[] = [];
    const match: Record<string, boolean> = {};
    names.current = [];
    excel.forEach(item => {
      const categoryItem = item[inventory.current[categorykey]];
      if (!(categoryItem in match)) {
        match[categoryItem] = true;
        names.current.push(String(categoryItem));
      }
      const sizeValue =
        Number(item[inventory.current[sizekey]]) > 0 &&
        Number(item[inventory.current[sizekey]]) < 1
          ? Number(
              String(item[inventory.current[sizekey]])
                .substring(2)
                .substring(0, 2)
            )
          : Number(String(item[inventory.current[sizekey]]).substring(0, 2));
      format.push({
        category: categoryItem,
        [`x-${categoryItem}`]: item[inventory.current[xkey]],
        [`y-${categoryItem}`]: item[inventory.current[ykey]],
        // temporarily
        [`size-${categoryItem}`]: sizeValue,
        [`tag-${categoryItem}`]: item[inventory.current[tagkey]]
      });
    });
    console.log(format);
    setDataSource(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, xInventory, yInventory, size, tag]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'category' | 'x' | 'y' | 'size' | 'tag'
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
            : from === 'category'
              ? [category, setCategory]
              : from === 'x'
                ? [xInventory, setXInventory]
                : from === 'y'
                  ? [yInventory, setYInventory]
                  : from === 'size'
                    ? [size, setSize]
                    : [tag, setTag];
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
        ['x', 'y', 'size'].includes(to) &&
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
        case 'category':
          if (Object.keys(category).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(category)[0]]:
                inventory.current[Object.keys(category)[0]]
            }));
          setCategory({
            [item]: String(inventory.current[item])
          });
          break;
        case 'x':
          if (Object.keys(xInventory).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(xInventory)[0]]:
                inventory.current[Object.keys(xInventory)[0]]
            }));
          setXInventory({
            [item]: inventory.current[item]
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
            [item]: Number(inventory.current[item])
          });
          break;
        case 'size':
          if (Object.keys(size).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(size)[0]]: inventory.current[Object.keys(size)[0]]
            }));
          setSize({
            [item]: Number(inventory.current[item])
          });
          break;
        case 'tag':
          if (Object.keys(tag).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(tag)[0]]: inventory.current[Object.keys(tag)[0]]
            }));
          setTag({
            [item]: String(inventory.current[item])
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
        case 'category':
          setCategory({});
          break;
        case 'x':
          setXInventory({});
          break;
        case 'y':
          setYInventory({});
          break;
        case 'size':
          setSize({});
          break;
        case 'tag':
          setTag({});
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
      from: 'unselected' | 'category' | 'x' | 'y' | 'size' | 'tag',
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
            onDrop={e => onDrop(e, 'category')}
            onDragOver={onDragOver}
          >
            <h2>category</h2>
            {Object.keys(category).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'category', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
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
                draggable
                onDragStart={e => onDragStart(e, item, 'y', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'size')}
            onDragOver={onDragOver}
          >
            <h2>size</h2>
            {Object.keys(size).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'size', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'tag')}
            onDragOver={onDragOver}
          >
            <h2>tag</h2>
            {Object.keys(tag).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'tag', idx)}
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customizeTooltip = (pointInfo: any) => ({
    text: `${pointInfo.point.tag}<br/>x: ${pointInfo.argumentText}<br/>y: ${pointInfo.valueText}}<br/>size: (${pointInfo.size}%)`
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function seriesClick(e: any) {
    const series = e.target;
    if (series.isVisible()) {
      series.hide();
    } else {
      series.show();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customizeText = (e: any) => `${e.value}`;

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={e =>
          handleFileUpload(e, inventory, setRemainInventory, setExcel, [
            setCategory,
            setXInventory,
            setYInventory,
            setSize,
            setTag
          ])
        }
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <Chart
        title="bubble"
        // temporarily
        palette={[
          '#00ced1',
          '#008000',
          '#ffd700',
          '#ff7f50',
          '#abcdef',
          '#a9523f',
          '#4d59d8',
          '#d74dd8',
          '#d84d6c'
        ]}
        // control series view
        onSeriesClick={seriesClick}
        dataSource={dataSource}
      >
        <Tooltip
          enabled={true}
          location="edge"
          customizeTooltip={customizeTooltip}
        />
        <CommonSeriesSettings type="bubble" />

        {/* y value */}
        <ValueAxis title="y">
          <Label customizeText={customizeText} />
        </ValueAxis>

        {/* x value */}
        <ArgumentAxis title="x">
          <Label customizeText={customizeText} />
        </ArgumentAxis>

        {names.current.map(item => (
          <Series
            key={item}
            name={item}
            argumentField={`x-${item}`}
            valueField={`y-${item}`}
            sizeField={`size-${item}`}
            tagField={`tag-${item}`}
          />
        ))}

        {/* location of chart property */}
        <Legend position="inside" horizontalAlignment="left">
          <Border visible={true} />
        </Legend>

        <Export enabled={true} />
      </Chart>
    </>
  );
}
