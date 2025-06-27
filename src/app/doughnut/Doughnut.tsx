'use client';

import { DragEvent, useEffect, useRef, useState } from 'react';
import PieChart, {
  Legend,
  Series,
  Tooltip,
  Format,
  Label,
  Connector,
  Export
} from 'devextreme-react/pie-chart';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';

export default function Doughnut() {
  const inventory = useRef<Record<string, number>>({});
  const [category, setCategory] = useState<Record<string, string>>({});
  const [value, setValue] = useState<Record<string, number>>({});
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
    if (!Object.keys(category).length || !Object.keys(value).length) {
      setDataSource([]);
      return;
    }
    const xkey = Object.keys(category)[0];
    const ykey = Object.keys(value)[0];
    const format: Record<string, string | number>[] = [];
    const match: Record<string, number> = {};
    let cnt = 0;
    excel.forEach(item => {
      let idx = 0;
      if (item[inventory.current[xkey]] in match)
        idx = match[item[inventory.current[xkey]]];
      else {
        match[item[inventory.current[xkey]]] = cnt;
        idx = cnt;
        cnt++;
        const newFormat = { [xkey]: item[inventory.current[xkey]], val: 0 };
        format.push(newFormat);
      }
      format[idx]['val'] =
        Number(format[idx]['val']) + Number(item[inventory.current[ykey]]);
    });
    console.log(format);
    setDataSource(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, value]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'category' | 'value'
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
              : [value, setValue];
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
        to === 'value' &&
        typeof excel[0][inventory.current[item]] !== 'number'
      ) {
        alert('value값은 숫자여야 합니다.');
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
            [String(item)]: String(inventory.current[item])
          });
          break;
        case 'value':
          if (Object.keys(value).length)
            setRemainInventory(prev => ({
              ...prev,
              [Object.keys(value)[0]]: inventory.current[Object.keys(value)[0]]
            }));
          setValue({
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
        case 'category':
          setCategory({});
          break;
        case 'value':
          setValue({});
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
      from: 'unselected' | 'category' | 'value',
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
            <div
              onDragEnter={() => onDragEnter(Object.keys(category).length)}
              style={{ height: '5px' }}
            />
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'value')}
            onDragOver={onDragOver}
          >
            <h2>value</h2>
            {Object.keys(value).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'value', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                {item}
              </div>
            ))}
            <div
              onDragEnter={() => onDragEnter(Object.keys(value).length)}
              style={{ height: '5px' }}
            />
          </div>
        </div>
      </div>
    );
  }

  function customizeTooltip(arg: { valueText: string; percent: number }) {
    return {
      text: `${arg.valueText} - ${(arg.percent * 100).toFixed(2)}%`
    };
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={e =>
          handleFileUpload(e, inventory, setRemainInventory, setExcel, [
            setCategory,
            setValue
          ])
        }
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <PieChart
        id="pie"
        type="doughnut"
        title="Doughnut"
        palette="Soft Pastel"
        dataSource={dataSource}
      >
        <Series argumentField={Object.keys(category)[0]}>
          <Label visible={true} format="millions">
            <Connector visible={true} />
          </Label>
        </Series>
        <Export enabled={true} />
        <Legend
          margin={0}
          horizontalAlignment="right"
          verticalAlignment="top"
        />
        <Tooltip enabled={true} customizeTooltip={customizeTooltip}>
          {/* if remove format, can check the original data */}
          <Format type="millions" />
        </Tooltip>
      </PieChart>
    </>
  );
}
