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
import * as XLSX from 'xlsx';
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
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const originalInventory = jsonData.shift() as string[];
      originalInventory.forEach((item, index) => {
        inventory.current[item] = index;
      });
      setSelectedInventory(inventory.current);
      setExcel(jsonData as (string | number)[][]);
      console.log('check excel data', jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

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

      if (from === to) return; // move to same area

      if (from === 'unselected') {
        setRemainInventory(prev => {
          const newRemainInventory = { ...prev };
          delete newRemainInventory[item];
          return newRemainInventory;
        });
        setSelectedInventory(prev => ({
          ...prev,
          [item]: inventory.current[item]
        }));
      } else {
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
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const onDragStart = (
      e: DragEvent<HTMLDivElement>,
      item: string,
      from: 'unselected' | 'selected'
    ) => {
      e.dataTransfer.setData('item', item);
      e.dataTransfer.setData('from', from);
    };

    return (
      <div className={styles.inventoryBox}>
        <div
          className={styles.inventorySection}
          draggable
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
        <div
          className={styles.inventorySection}
          onDrop={e => onDrop(e, 'selected')}
          onDragOver={onDragOver}
        >
          <h2>selected</h2>
          {Object.keys(selectedInventory).map(item => (
            <div
              key={item}
              className={styles.inventoryItem}
              draggable
              onDragStart={e => onDragStart(e, item, 'selected')}
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
        onChange={handleFileUpload}
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
