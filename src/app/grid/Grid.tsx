'use client';

import DataGrid, {
  Grouping,
  GroupPanel,
  SearchPanel,
  Pager,
  Paging
} from 'devextreme-react/data-grid';
import 'devextreme/dist/css/dx.light.css';
import { DragEvent, useEffect, useState, useRef } from 'react';
import { handleFileUpload } from '@/utils/handleFileUpload';
import styles from '@/app/page.module.css';

export default function Grid() {
  const inventory = useRef<Record<string, number>>({});
  const [selectedInventory, setSelectedInventory] = useState<
    Record<string, number>
  >({});
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
    if (!excel.length) return;
    setDataSource(
      excel.map(item => {
        const source: Record<string, string | number> = {};
        const keys = Object.keys(selectedInventory);
        keys.forEach(key => {
          source[key] = item[selectedInventory[key]];
        });
        return source;
      })
    );
  }, [excel, selectedInventory]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'selected'
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
            : [selectedInventory, setSelectedInventory];
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

      if (from === 'unselected') {
        setRemainInventory(prev => {
          const newRemainInventory = { ...prev };
          delete newRemainInventory[item];
          return newRemainInventory;
        });
        if (dragEndIdx.current !== -1) {
          const total = Object.entries(selectedInventory);
          const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
          const right = Object.fromEntries(total.slice(dragEndIdx.current));
          setSelectedInventory({
            ...left,
            [item]: inventory.current[item],
            ...right
          });
        } else
          setSelectedInventory(prev => ({
            ...prev,
            [item]: inventory.current[item]
          }));
      } else {
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
        setSelectedInventory(prev => {
          const newSelectedInventory = { ...prev };
          delete newSelectedInventory[item];
          return newSelectedInventory;
        });
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
      from: 'unselected' | 'selected',
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
        <div
          className={styles.inventorySection}
          onDrop={e => onDrop(e, 'selected')}
          onDragOver={onDragOver}
        >
          <h2>selected</h2>
          {Object.keys(selectedInventory).map((item, idx) => (
            <div
              key={item}
              className={styles.inventoryItem}
              draggable
              onDragStart={e => onDragStart(e, item, 'selected', idx)}
              onDragEnter={() => onDragEnter(idx)}
            >
              {item}
            </div>
          ))}
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
          handleFileUpload(e, inventory, setSelectedInventory, setExcel, [
            setRemainInventory
          ])
        }
        style={{
          height: '100px',
          border: '1px solid blue',
          marginBlock: '20px'
        }}
      />
      {Object.keys(inventory.current).length > 0 ? <InventoryBox /> : null}
      <DataGrid
        dataSource={dataSource}
        rowAlternationEnabled={true} // Use the gray background to highlight even grid rows and improve readability
        showBorders={true}
        allowColumnReordering={true}
        width="95%"
      >
        <SearchPanel visible={true} highlightCaseSensitive={true} />

        {/* Drag a column header to group by that column */}
        <GroupPanel visible={true} />
        <Grouping autoExpandAll={false} />

        <Pager
          visible={true}
          allowedPageSizes={[10, 20, 30, 40, 50]}
          showPageSizeSelector={true}
        />
        <Paging defaultPageSize={10} />
      </DataGrid>
    </>
  );
}
