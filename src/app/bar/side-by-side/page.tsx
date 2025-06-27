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
  Tooltip,
  ZoomAndPan
} from 'devextreme-react/chart';
import {
  DragEvent,
  ChangeEvent,
  useEffect,
  useRef,
  useState,
  Dispatch,
  SetStateAction
} from 'react';
import { calculateNumber } from '@/utils/calculateNumber';
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
type Inventory = Record<string, (string | number)[]>;
type SetInventory = Dispatch<SetStateAction<Inventory>>;

export default function Home() {
  const inventory = useRef<Record<string, number>>({});
  const [xInventory, setXInventory] = useState<Record<string, string[]>>({});
  const [yInventory, setYInventory] = useState<Inventory>({});
  const [seriesInventory, setSeriesInventory] = useState<
    Record<string, string[]>
  >({});
  const [remainInventory, setRemainInventory] = useState<
    Record<string, number>
  >({});
  const [excel, setExcel] = useState<(string | number)[][]>([]);
  const [dataSource, setDataSource] = useState<
    Record<string, string | number>[]
  >([]);
  const [propertyChange, setPropertyChange] = useState<string>('');
  const nameChange = useRef<HTMLInputElement>(null);
  const dragStartIdx = useRef<number>(-1);
  const dragEndIdx = useRef<number>(-1);

  useEffect(() => {
    if (!Object.keys(xInventory).length || !Object.keys(yInventory).length) {
      setDataSource([]);
      return;
    }
    const xkeys = Object.keys(seriesInventory).concat(
      ...Object.keys(xInventory)
    );
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
        item[key] = calculateNumber(
          yInventory[key][2] as PropertyType,
          item[key] as number[]
        );
      });
      return item as Record<string, string | number>;
    });
    console.log('check graph data', final);
    setDataSource(final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xInventory, yInventory, seriesInventory]);

  function InventoryBox() {
    const onDrop = (
      e: DragEvent<HTMLDivElement>,
      to: 'unselected' | 'x' | 'y' | 'series'
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
              : from === 'y'
                ? [yInventory, setYInventory]
                : [seriesInventory, setSeriesInventory];
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
              [item]: [item, String(inventory.current[item])],
              ...right
            });
          } else
            setXInventory(prev => ({
              ...prev,
              [item]: [item, String(inventory.current[item])]
            }));
          break;
        case 'y':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(yInventory);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setYInventory({
              ...left,
              [item]: [item, inventory.current[item], '합계'],
              ...right
            });
          } else
            setYInventory(prev => ({
              ...prev,
              [item]: [item, inventory.current[item], '합계']
            }));
          break;
        case 'series':
          if (dragEndIdx.current !== -1) {
            const total = Object.entries(seriesInventory);
            const left = Object.fromEntries(total.slice(0, dragEndIdx.current));
            const right = Object.fromEntries(total.slice(dragEndIdx.current));
            setSeriesInventory({
              ...left,
              [item]: [item, String(inventory.current[item])],
              ...right
            });
          } else
            setSeriesInventory(prev => ({
              ...prev,
              [item]: [item, String(inventory.current[item])]
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
        case 'series':
          setSeriesInventory(prev => {
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
      from: 'unselected' | 'x' | 'y' | 'series',
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
          prev[propertyChange][0], // alias
          prev[propertyChange][1], // value
          e.target.value as PropertyType
        ]
      }));
    }

    function settingOpen(name: string) {
      setPropertyChange(name);
    }

    function handleNameChange() {
      const newName = nameChange.current?.value as string;
      let inventoryState: Inventory;
      let setInventoryState: SetInventory;
      if (Object.prototype.hasOwnProperty.call(xInventory, propertyChange)) {
        inventoryState = xInventory;
        setInventoryState = setXInventory as SetInventory;
      } else if (
        Object.prototype.hasOwnProperty.call(yInventory, propertyChange)
      ) {
        inventoryState = yInventory;
        setInventoryState = setYInventory as SetInventory;
      } else {
        inventoryState = seriesInventory;
        setInventoryState = setSeriesInventory as SetInventory;
      }
      const prevValue = inventoryState[propertyChange].slice(1);
      const prevInventory = { ...inventoryState };
      prevInventory[propertyChange] = [newName, ...prevValue];
      setInventoryState(prevInventory);
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
                <div>{xInventory[item][0]}</div>
                <h5 style={{ color: 'red' }} onClick={() => settingOpen(item)}>
                  set
                </h5>
              </div>
            ))}
            <div
              onDragEnter={() => onDragEnter(Object.keys(xInventory).length)}
              style={{ height: '5px' }}
            />
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
                <div>
                  {yInventory[item][0]} ({yInventory[item][2]})
                </div>
                <h5 style={{ color: 'red' }} onClick={() => settingOpen(item)}>
                  set
                </h5>
              </div>
            ))}
            <div
              onDragEnter={() => onDragEnter(Object.keys(yInventory).length)}
              style={{ height: '5px' }}
            />
          </div>
          <div
            className={styles.inventorySection}
            onDrop={e => onDrop(e, 'series')}
            onDragOver={onDragOver}
          >
            <h2>series</h2>
            {Object.keys(seriesInventory).map((item, idx) => (
              <div
                key={item}
                className={styles.inventoryItem}
                draggable
                onDragStart={e => onDragStart(e, item, 'series', idx)}
                onDragEnter={() => onDragEnter(idx)}
              >
                <div>{seriesInventory[item][0]}</div>
                <h5 style={{ color: 'red' }} onClick={() => settingOpen(item)}>
                  set
                </h5>
              </div>
            ))}
            <div
              onDragEnter={() =>
                onDragEnter(Object.keys(seriesInventory).length)
              }
              style={{ height: '5px' }}
            />
          </div>
        </div>
        {propertyChange !== '' ? (
          <div>
            {Object.keys(yInventory).includes(propertyChange) ? (
              <>
                <h5>계산 속성 선택</h5>
                <select
                  defaultValue={yInventory[propertyChange][2]}
                  onChange={handlePropertyChange}
                >
                  {NumberProperty.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <h5>이름 변경</h5>
            <div>
              <input
                type="text"
                ref={nameChange}
                placeholder={propertyChange}
              />
              <h4
                onClick={handleNameChange}
                style={{ color: 'red', cursor: 'pointer' }}
              >
                name change
              </h4>
            </div>
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

  function customizeTooltip(arg: {
    argumentText: string;
    seriesName: string;
    valueText: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    point: any;
  }) {
    const keys = Object.keys(arg.point.data);
    const xName = Object.keys(seriesInventory)
      .concat(Object.keys(xInventory))
      .join('/');
    const texts = keys
      .map(item => {
        if (xName.includes(item)) return `<br />${arg.point.data[item]}`;
        return `<br />${item}: ${arg.point.data[item]}`;
      })
      .join('');
    return Object.keys(seriesInventory).length
      ? { text: `${texts}` }
      : {
          text: `${arg.argumentText}<br />${arg.seriesName}: ${arg.valueText} `
        };
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={e =>
          handleFileUpload(e, inventory, setRemainInventory, setExcel, [
            setXInventory,
            setYInventory,
            setSeriesInventory
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
          argumentField={Object.keys(xInventory)
            .concat(Object.keys(seriesInventory))
            .join('/')}
          type="bar"
          hoverMode={
            Object.keys(seriesInventory).length
              ? 'allArgumentPoints'
              : 'onlyPoint'
          }
          selectionMode={
            Object.keys(seriesInventory).length
              ? 'allArgumentPoints'
              : 'onlyPoint'
          }
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
            argumentField={Object.keys(seriesInventory)
              .concat(Object.keys(xInventory))
              .join('/')} // x value
            name={yInventory[item][0]}
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

        <Tooltip enabled={true} customizeTooltip={customizeTooltip} />
        <ZoomAndPan argumentAxis="both" valueAxis="both" />
        <Export enabled={true} />
      </Chart>
    </>
  );
}
