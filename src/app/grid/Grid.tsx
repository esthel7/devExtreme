'use client';

import DataGrid, {
  Grouping,
  GroupPanel,
  SearchPanel,
  Pager,
  Paging
} from 'devextreme-react/data-grid';
import 'devextreme/dist/css/dx.light.css';
import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function Grid() {
  const inventory = useRef<Record<string, number>>({});
  const [selectedInventory, setSelectedInventory] = useState<
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

  return (
    <>
      {Object.keys(inventory.current).length > 0 ? (
        <div>All Inventory: {Object.keys(inventory.current).join(' / ')}</div>
      ) : null}
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
