// import React, { useState, useMemo, useRef } from 'react';
// import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
// import {
//   ResponsiveContainer,
//   ScatterChart,
//   Scatter,
//   Cell,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ReferenceArea,
// } from 'recharts';

// interface PricingPoint {
//   variant_id: string;
//   variant_name: string;
//   pricing_id: string;
//   ex_showroom_price: number;
//   currency: string;
//   fuel_type: string | null;
//   engine_type: string | null;
//   transmission_type: string | null;
//   paint_type: string | null;
//   edition: string | null;
// }

// interface ChartViewProps {
//   rawPricing: PricingPoint[];
//   chartColor: string;
//   formatPriceShort: (price: number) => string;
//   onPricingClick?: (pricing: PricingPoint) => void;
//   carId: string;
//   carName: string;
//   isCombinedMode?: boolean;
//   allCarsData?: Array<{ carId: string; carName: string; pricing: PricingPoint[]; color: string }>;
//   onOrderChange?: (newOrder: Array<{ carId: string; carName: string; pricing: PricingPoint[]; color: string }>) => void;
// }

// const ChartView: React.FC<ChartViewProps> = ({
//   rawPricing,
//   chartColor,
//   formatPriceShort,
//   onPricingClick,
//   carId,
//   carName,
//   isCombinedMode = false,
//   allCarsData = [],
//   onOrderChange
// }) => {
//   const [orderedCars, setOrderedCars] = useState(allCarsData);
//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const prevCarIdsRef = useRef<string>('');

//   React.useEffect(() => {
//     const currentCarIds = allCarsData.map(c => `${c.carId}-${c.pricing.length}`).join(',');

//     if (currentCarIds !== prevCarIdsRef.current) {
//       setOrderedCars(allCarsData);
//       prevCarIdsRef.current = currentCarIds;
//     }
//   }, [allCarsData]);

//   const carsToUse = isCombinedMode ? orderedCars : allCarsData;

//   // Swap two cars by their indices
//   const swapCars = (index1: number, index2: number) => {
//     const newOrder = [...orderedCars];
//     [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];
//     setOrderedCars(newOrder);
//     if (onOrderChange) {
//       onOrderChange(newOrder);
//     }
//   };

//   // Move a car left or right
//   const moveCar = (index: number, direction: 'left' | 'right') => {
//     const newIndex = direction === 'left' ? index - 1 : index + 1;
//     if (newIndex >= 0 && newIndex < orderedCars.length) {
//       swapCars(index, newIndex);
//     }
//   };

//   const verticalChartData = useMemo(() => {
//     if (isCombinedMode && carsToUse.length > 0) {
//       const allData: any[] = [];
//       carsToUse.forEach((carData, carIndex) => {
//         carData.pricing.forEach((p) => {
//           allData.push({
//             x: carIndex + 1,
//             y: p.ex_showroom_price,
//             variant_name: p.variant_name,
//             fuel_type: p.fuel_type,
//             engine_type: p.engine_type,
//             transmission_type: p.transmission_type,
//             pricing_id: p.pricing_id,
//             fullData: p,
//             carName: carData.carName,
//             carColor: carData.color,
//             carId: carData.carId
//           });
//         });
//       });
//       return allData;
//     } else {
//       return rawPricing.map((p) => ({
//         x: 1,
//         y: p.ex_showroom_price,
//         variant_name: p.variant_name,
//         fuel_type: p.fuel_type,
//         engine_type: p.engine_type,
//         transmission_type: p.transmission_type,
//         pricing_id: p.pricing_id,
//         fullData: p,
//         carName: carName,
//         carColor: chartColor,
//         carId: carId
//       }));
//     }
//   }, [rawPricing, isCombinedMode, carsToUse, carName, chartColor, carId]);

//   const priceRange = useMemo(() => {
//     if (verticalChartData.length === 0) return { min: 0, max: 0 };
//     const prices = verticalChartData.map(d => d.y);
//     return {
//       min: Math.min(...prices),
//       max: Math.max(...prices)
//     };
//   }, [verticalChartData]);

//   const carGroups = useMemo(() => {
//     if (!isCombinedMode) return [];
//     const groups = new Map<string, any[]>();
//     verticalChartData.forEach(d => {
//       if (!groups.has(d.carId)) {
//         groups.set(d.carId, []);
//       }
//       groups.get(d.carId)!.push(d);
//     });
//     return Array.from(groups.entries()).map(([carId, data]) => ({
//       carId,
//       data,
//       carName: data[0].carName,
//       carColor: data[0].carColor,
//       min: Math.min(...data.map(d => d.y)),
//       max: Math.max(...data.map(d => d.y))
//     }));
//   }, [verticalChartData, isCombinedMode]);

//   const variantLabelPositions = useMemo(() => {
//     const variantMap = new Map<string, { x: number; y: number; name: string; variantId: string; carId: string }>();
//     verticalChartData.forEach((point) => {
//       const key = `${point.carId}-${point.fullData.variant_id}`;
//       if (!variantMap.has(key)) {
//         variantMap.set(key, {
//           x: point.x,
//           y: point.y,
//           name: point.variant_name,
//           variantId: point.fullData.variant_id,
//           carId: point.carId
//         });
//       } else {
//         const existing = variantMap.get(key)!;
//         if (point.y > existing.y) {
//           variantMap.set(key, {
//             x: point.x,
//             y: point.y,
//             name: point.variant_name,
//             variantId: point.fullData.variant_id,
//             carId: point.carId
//           });
//         }
//       }
//     });
//     return Array.from(variantMap.values());
//   }, [verticalChartData]);

//   const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0
//   }).format(p);

//   const CustomTooltip = ({ active, payload }: any) => {
//     if (!active || !payload || !payload.length) return null;
//     const data = payload[0]?.payload;
//     if (!data) return null;

//     return (
//       <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800">
//         {isCombinedMode && (
//           <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: data.carColor }}>
//             {data.carName}
//           </p>
//         )}
//         <p className="font-bold mb-2">{data.variant_name}</p>
//         <div className="space-y-1">
//           {data.fuel_type && (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Fuel:</span>
//               <span className="font-semibold">{data.fuel_type}</span>
//             </div>
//           )}
//           {data.transmission_type && (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Transmission:</span>
//               <span className="font-semibold">{data.transmission_type}</span>
//             </div>
//           )}
//           {data.fullData?.paint_type && (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Paint:</span>
//               <span className="font-semibold">{data.fullData.paint_type}</span>
//             </div>
//           )}
//           <div className="flex justify-between gap-4 pt-2 border-t mt-2">
//             <span className="text-slate-500">Price:</span>
//             <span className="font-bold text-blue-600">{formatPrice(data.y)}</span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const CustomLabel = ({ cx, cy, value }: any) => {
//     if (!value) return null;
//     const textWidth = value.length * 6.5 + 8;

//     return (
//       <g>
//         <rect
//           x={cx + 22}
//           y={cy - 9}
//           width={textWidth}
//           height={18}
//           fill="white"
//           fillOpacity={0.95}
//           stroke="#e2e8f0"
//           strokeWidth={1}
//           rx={3}
//         />
//         <text
//           x={cx + 26}
//           y={cy + 1}
//           fill="#0f172a"
//           fontSize={11}
//           fontWeight={600}
//           textAnchor="start"
//           dominantBaseline="middle"
//         >
//           {value}
//         </text>
//       </g>
//     );
//   };

//   const numCars = isCombinedMode ? carsToUse.length : 1;
//   const xDomain = [0.5, numCars + 1.5];

//   return (
//     <div className="w-full h-full flex flex-col">
//       {/* Position Control Buttons - Only show in combined mode with 2+ cars */}
//       {isCombinedMode && orderedCars.length >= 2 && (
//         <div className="absolute top-25 right-4 z-10 bg-white rounded-lg shadow-lg border p-0.5">
//           <div className="flex items-center gap-2">
//             <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reorder:</span>
//             {orderedCars.map((car, index) => (
//               <div key={car.carId} className="flex items-center gap-1">
//                 <div
//                   className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs font-bold"
//                   style={{
//                     borderColor: car.color,
//                     backgroundColor: `${car.color}15`
//                   }}
//                 >
//                   <button
//                     onClick={() => moveCar(index, 'left')}
//                     disabled={index === 0}
//                     className="p-0.1 hover:bg-white/50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
//                     title="Move left"
//                   >
//                     <ChevronLeft size={4} />
//                   </button>

//                   <span className="px-1" style={{ color: car.color }}>
//                     {index + 1}
//                   </span>

//                   <button
//                     onClick={() => moveCar(index, 'right')}
//                     disabled={index === orderedCars.length - 1}
//                     className="p-0.1 hover:bg-white/50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
//                     title="Move right"
//                   >
//                     <ChevronRight size={4} />
//                   </button>
//                 </div>

//                 {index < orderedCars.length - 1 && (
//                   <button
//                     onClick={() => swapCars(index, index + 1)}
//                     className="p-1 hover:bg-slate-100 rounded transition-colors"
//                     title={`Swap positions ${index + 1} and ${index + 2}`}
//                   >
//                     <ArrowLeftRight size={8} className="text-slate-500" />
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="flex-1 relative" ref={chartContainerRef}>
//         <ResponsiveContainer width="100%" height="100%">
//           <ScatterChart margin={{ top: 20, right: 250, left: 60, bottom: 20 }}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
//             <XAxis
//               type="number"
//               dataKey="x"
//               domain={xDomain}
//               ticks={isCombinedMode ? carsToUse.map((_, i) => i + 1) : [1]}
//               tickFormatter={(value) => {
//                 if (isCombinedMode) {
//                   const carData = carsToUse[value - 1];
//                   return carData ? carData.carName : '';
//                 }
//                 return carName;
//               }}
//               tick={{ fontSize: 12, fontWeight: 'bold' }}
//             />
//             <YAxis
//               type="number"
//               dataKey="y"
//               domain={[priceRange.min * 0.95, priceRange.max * 1.01]}
//               tick={{ fontSize: 10 }}
//               tickFormatter={(val) => formatPriceShort(val)}
//               width={60}
//             />
//             <Tooltip content={<CustomTooltip />} />

//             {isCombinedMode ? (
//               carGroups.map((group, index) => (
//                 <React.Fragment key={group.carId}>
//                   <ReferenceArea
//                     x1={index + 0.7}
//                     x2={index + 1.3}
//                     y1={group.min}
//                     y2={group.max}
//                     fill={group.carColor}
//                     fillOpacity={0.3}
//                     stroke={group.carColor}
//                     strokeOpacity={0.7}
//                     strokeWidth={2}
//                     strokeDasharray="5 5"
//                     {...({} as any)}
//                   />
//                 </React.Fragment>
//               ))
//             ) : (
//               verticalChartData.length > 0 && (
//                 <ReferenceArea
//                   x1={0.7}
//                   x2={1.3}
//                   y1={priceRange.min}
//                   y2={priceRange.max}
//                   fill={chartColor}
//                   fillOpacity={0.3}
//                   stroke={chartColor}
//                   strokeOpacity={0.7}
//                   strokeWidth={2}
//                   strokeDasharray="5 5"
//                   {...({} as any)}
//                 />
//               )
//             )}

//             <Scatter
//               data={verticalChartData}
//               fill="none"
//               shape={(props: any) => {
//                 const { cx, cy, payload } = props;
//                 return (
//                   <g>
//                     <circle
//                       cx={cx}
//                       cy={cy}
//                       r={6}
//                       fill="white"
//                       stroke={payload.carColor}
//                       strokeWidth={2}
//                     />
//                     <CustomLabel cx={cx} cy={cy} value={payload.variant_name} />
//                   </g>
//                 );
//               }}
//             >
//               {verticalChartData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} cursor="pointer" />
//               ))}
//             </Scatter>

//             {/* Remove the custom labels map */}
//           </ScatterChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default ChartView;




import React, { useState, useMemo, useRef } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from 'recharts';

interface PricingPoint {
  variant_id: string;
  variant_name: string;
  pricing_id: string;
  ex_showroom_price: number;
  currency: string;
  fuel_type: string | null;
  engine_type: string | null;
  transmission_type: string | null;
  paint_type: string | null;
  edition: string | null;
}

interface ChartViewProps {
  rawPricing: PricingPoint[];
  chartColor: string;
  formatPriceShort: (price: number) => string;
  onPricingClick?: (pricing: PricingPoint) => void;
  carId: string;
  carName: string;
  isCombinedMode?: boolean;
  allCarsData?: Array<{ carId: string; carName: string; pricing: PricingPoint[]; color: string }>;
  onOrderChange?: (newOrder: Array<{ carId: string; carName: string; pricing: PricingPoint[]; color: string }>) => void;
}

const ChartView: React.FC<ChartViewProps> = ({
  rawPricing,
  chartColor,
  formatPriceShort,
  onPricingClick,
  carId,
  carName,
  isCombinedMode = false,
  allCarsData = [],
  onOrderChange
}) => {
  const [orderedCars, setOrderedCars] = useState(allCarsData);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const prevCarIdsRef = useRef<string>('');

  React.useEffect(() => {
    const currentCarIds = allCarsData.map(c => `${c.carId}-${c.pricing.length}`).join(',');

    if (currentCarIds !== prevCarIdsRef.current) {
      setOrderedCars(allCarsData);
      prevCarIdsRef.current = currentCarIds;
    }
  }, [allCarsData]);

  const carsToUse = isCombinedMode ? orderedCars : allCarsData;

  const swapCars = (index1: number, index2: number) => {
    const newOrder = [...orderedCars];
    [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];
    setOrderedCars(newOrder);
    if (onOrderChange) {
      onOrderChange(newOrder);
    }
  };

  const moveCar = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < orderedCars.length) {
      swapCars(index, newIndex);
    }
  };

  const verticalChartData = useMemo(() => {
    if (isCombinedMode && carsToUse.length > 0) {
      const allData: any[] = [];
      carsToUse.forEach((carData, carIndex) => {
        carData.pricing.forEach((p) => {
          allData.push({
            x: carIndex + 1,
            y: p.ex_showroom_price,
            variant_name: p.variant_name,
            fuel_type: p.fuel_type,
            engine_type: p.engine_type,
            transmission_type: p.transmission_type,
            pricing_id: p.pricing_id,
            fullData: p,
            carName: carData.carName,
            carColor: carData.color,
            carId: carData.carId
          });
        });
      });
      return allData;
    } else {
      return rawPricing.map((p) => ({
        x: 1,
        y: p.ex_showroom_price,
        variant_name: p.variant_name,
        fuel_type: p.fuel_type,
        engine_type: p.engine_type,
        transmission_type: p.transmission_type,
        pricing_id: p.pricing_id,
        fullData: p,
        carName: carName,
        carColor: chartColor,
        carId: carId
      }));
    }
  }, [rawPricing, isCombinedMode, carsToUse, carName, chartColor, carId]);

  const priceRange = useMemo(() => {
    if (verticalChartData.length === 0) return { min: 0, max: 0 };
    const prices = verticalChartData.map(d => d.y);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [verticalChartData]);

  const carGroups = useMemo(() => {
    if (!isCombinedMode) return [];
    const groups = new Map<string, any[]>();
    verticalChartData.forEach(d => {
      if (!groups.has(d.carId)) {
        groups.set(d.carId, []);
      }
      groups.get(d.carId)!.push(d);
    });
    return Array.from(groups.entries()).map(([carId, data]) => ({
      carId,
      data,
      carName: data[0].carName,
      carColor: data[0].carColor,
      xPosition: data[0].x, // Preserve the original x-position
      min: Math.min(...data.map(d => d.y)),
      max: Math.max(...data.map(d => d.y))
    }));
  }, [verticalChartData, isCombinedMode]);

  const formatLakhsTruncate = (price: number) => {
    const lakhs = price / 100000;          // convert to lakhs
    const truncated = Math.floor(lakhs * 100) / 100; // truncate 2 decimals
    return truncated.toFixed(2);
  };
  const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(p);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800">
        {isCombinedMode && (
          <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: data.carColor }}>
            {data.carName}
          </p>
        )}
        <p className="font-bold mb-2">{data.variant_name}</p>
        <div className="space-y-1">
          {data.fuel_type && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Fuel:</span>
              <span className="font-semibold">{data.fuel_type}</span>
            </div>
          )}
          {data.transmission_type && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Transmission:</span>
              <span className="font-semibold">{data.transmission_type}</span>
            </div>
          )}
          {data.fullData?.paint_type && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Paint:</span>
              <span className="font-semibold">{data.fullData.paint_type}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-2 border-t mt-2">
            <span className="text-slate-500">Price:</span>
            <span className="font-bold text-blue-600">{formatPrice(data.y)}</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomLabel = ({ cx, cy, value }: any) => {
    if (!value) return null;
    // Tighter width calculation to prevent empty white box overlap
    // Approx 6px per char for 11px font + small padding
    const textWidth = value.length * 6 + 10;

    return (
      <g>
        <rect
          x={cx + 12}
          y={cy - 9}
          width={textWidth}
          height={18}
          fill="white"
          fillOpacity={0.95}
          stroke="#e2e8f0"
          strokeWidth={1}
          rx={3}
        />
        <text
          x={cx + 17}
          y={cy + 1}
          fill="#0f172a"
          fontSize={10}
          fontWeight={600}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {value}
        </text>
      </g>
    );
  };

  const numCars = isCombinedMode ? carsToUse.length : 1;
  const xDomain = [0.5, numCars + 1.5];

  return (
    <div className="w-full h-full flex flex-col">
      {isCombinedMode && orderedCars.length >= 2 && (
        <div className="absolute top-25 right-4 z-10 bg-white rounded-lg shadow-lg border p-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reorder:</span>
            {orderedCars.map((car, index) => (
              <div key={car.carId} className="flex items-center gap-1">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs font-bold"
                  style={{
                    borderColor: car.color,
                    backgroundColor: `${car.color}15`
                  }}
                >
                  <button
                    onClick={() => moveCar(index, 'left')}
                    disabled={index === 0}
                    className="p-0.1 hover:bg-white/50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move left"
                  >
                    <ChevronLeft size={4} />
                  </button>

                  <span className="px-1" style={{ color: car.color }}>
                    {index + 1}
                  </span>

                  <button
                    onClick={() => moveCar(index, 'right')}
                    disabled={index === orderedCars.length - 1}
                    className="p-0.1 hover:bg-white/50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move right"
                  >
                    <ChevronRight size={4} />
                  </button>
                </div>

                {index < orderedCars.length - 1 && (
                  <button
                    onClick={() => swapCars(index, index + 1)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title={`Swap positions ${index + 1} and ${index + 2}`}
                  >
                    <ArrowLeftRight size={8} className="text-slate-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative" ref={chartContainerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 250, left: 60, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              ticks={isCombinedMode ? carsToUse.map((_, i) => i + 1) : [1]}
              tickFormatter={(value) => {
                if (isCombinedMode) {
                  const carData = carsToUse[value - 1];
                  return carData ? carData.carName : '';
                }
                return carName;
              }}
              tick={{ fontSize: 12, fontWeight: 'bold' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[priceRange.min * 0.95, priceRange.max * 1.01]}
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => formatPriceShort(val)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* GAP ADJUSTED HERE */}
            {isCombinedMode ? (
              [...carGroups].reverse().map((group) => (
                <React.Fragment key={group.carId}>
                  <ReferenceArea
                    x1={group.xPosition - 0.2}
                    x2={group.xPosition + 0.2}
                    y1={group.min}
                    y2={group.max}
                    fill={group.carColor}
                    fillOpacity={0.3}
                    stroke={group.carColor}
                    strokeOpacity={0.7}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    {...({} as any)}
                  />
                </React.Fragment>
              ))
            ) : (
              verticalChartData.length > 0 && (
                <ReferenceArea
                  x1={0.8}
                  x2={1.2}
                  y1={priceRange.min}
                  y2={priceRange.max}
                  fill={chartColor}
                  fillOpacity={0.3}
                  stroke={chartColor}
                  strokeOpacity={0.7}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  {...({} as any)}
                />
              )
            )}

            <Scatter
              data={verticalChartData}
              fill="none"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const labelWithPrice = `${payload.variant_name} (${formatLakhsTruncate(payload.y)} L)`;


                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="white"
                      stroke={payload.carColor}
                      strokeWidth={2}
                    />
                    <CustomLabel cx={cx} cy={cy} value={labelWithPrice} />
                  </g>
                );
              }}
            >
              {verticalChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} cursor="pointer" />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartView;


// import React, { useState, useMemo } from 'react';
// import {
//   ResponsiveContainer,
//   ScatterChart,
//   Scatter,
//   Cell,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ReferenceArea,
//   Label
// } from 'recharts';

// interface PricingPoint {
//   variant_id: string;
//   variant_name: string;
//   pricing_id: string;
//   ex_showroom_price: number;
//   currency: string;
//   fuel_type: string | null;
//   engine_type: string | null;
//   transmission_type: string | null;
//   paint_type: string | null;
//   edition: string | null;
// }

// interface ChartViewProps {
//   rawPricing: PricingPoint[];
//   chartColor: string;
//   formatPriceShort: (price: number) => string;
//   onPricingClick?: (pricing: PricingPoint) => void;
//   carId: string;
//   carName: string;
//   // For combined mode
//   isCombinedMode?: boolean;
//   allCarsData?: Array<{ carId: string; carName: string; pricing: PricingPoint[]; color: string }>;
// }

// const ChartView: React.FC<ChartViewProps> = ({
//   rawPricing,
//   chartColor,
//   formatPriceShort,
//   onPricingClick,
//   carId,
//   carName,
//   isCombinedMode = false,
//   allCarsData = []
// }) => {
//   // Helper function to add jitter to avoid overlapping points
//   const addJitter = (baseX: number, index: number, totalPoints: number, carIndex: number = 0) => {
//     // Use a deterministic approach based on index for consistent positioning
//     const jitterStrength = 0.08; // Horizontal spread
//     const seed = index * 12345; // Pseudo-random seed based on index
//     const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
//     return baseX + (pseudoRandom * jitterStrength);
//   };

//   // Helper function to add vertical jitter for overlapping prices
//   const addVerticalJitter = (baseY: number, index: number, priceGroup: number[]) => {
//     // Find how many points share this exact price
//     const matchingPrices = priceGroup.filter(p => Math.abs(p - baseY) < 1000).length;

//     if (matchingPrices > 1) {
//       // Add small vertical offset for overlapping prices
//       const jitterStrength = 15000; // Small rupee offset
//       const seed = index * 67890;
//       const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
//       return baseY + (pseudoRandom * jitterStrength);
//     }
//     return baseY;
//   };

//   // Prepare data for vertical chart with jitter
//   const verticalChartData = useMemo(() => {
//     if (isCombinedMode && allCarsData.length > 0) {
//       // Combined mode: show all cars on same axis
//       const allData: any[] = [];
//       allCarsData.forEach((carData, carIndex) => {
//         const prices = carData.pricing.map(p => p.ex_showroom_price);
//         carData.pricing.forEach((p, index) => {
//           allData.push({
//             x: addJitter(carIndex + 1, index, carData.pricing.length, carIndex),
//             y: addVerticalJitter(p.ex_showroom_price, index, prices),
//             originalY: p.ex_showroom_price, // Keep original for tooltip
//             variant_name: p.variant_name,
//             fuel_type: p.fuel_type,
//             engine_type: p.engine_type,
//             transmission_type: p.transmission_type,
//             pricing_id: p.pricing_id,
//             fullData: p,
//             carName: carData.carName,
//             carColor: carData.color,
//             carId: carData.carId
//           });
//         });
//       });
//       return allData;
//     } else {
//       // Individual mode: single car
//       const prices = rawPricing.map(p => p.ex_showroom_price);
//       return rawPricing.map((p, index) => ({
//         x: addJitter(1, index, rawPricing.length),
//         y: addVerticalJitter(p.ex_showroom_price, index, prices),
//         originalY: p.ex_showroom_price, // Keep original for tooltip
//         variant_name: p.variant_name,
//         fuel_type: p.fuel_type,
//         engine_type: p.engine_type,
//         transmission_type: p.transmission_type,
//         pricing_id: p.pricing_id,
//         fullData: p,
//         carName: carName,
//         carColor: chartColor,
//         carId: carId
//       }));
//     }
//   }, [rawPricing, isCombinedMode, allCarsData, carName, chartColor, carId]);

//   // Calculate price range
//   const priceRange = useMemo(() => {
//     if (verticalChartData.length === 0) return { min: 0, max: 0 };
//     const prices = verticalChartData.map(d => d.originalY || d.y);
//     return {
//       min: Math.min(...prices),
//       max: Math.max(...prices)
//     };
//   }, [verticalChartData]);

//   // Group data by car for combined mode
//   const carGroups = useMemo(() => {
//     if (!isCombinedMode) return [];
//     const groups = new Map<string, any[]>();
//     verticalChartData.forEach(d => {
//       if (!groups.has(d.carId)) {
//         groups.set(d.carId, []);
//       }
//       groups.get(d.carId)!.push(d);
//     });
//     return Array.from(groups.entries()).map(([carId, data]) => ({
//       carId,
//       data,
//       carName: data[0].carName,
//       carColor: data[0].carColor,
//       min: Math.min(...data.map(d => d.originalY || d.y)),
//       max: Math.max(...data.map(d => d.originalY || d.y))
//     }));
//   }, [verticalChartData, isCombinedMode]);

//   const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0
//   }).format(p);

//   // Custom Tooltip
//   const CustomTooltip = ({ active, payload }: any) => {
//     if (!active || !payload || !payload.length) return null;
//     const data = payload[0]?.payload;
//     if (!data) return null;

//     // Use original price for display
//     const displayPrice = data.originalY || data.y;

//     return (
//       <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800">
//         {isCombinedMode && (
//           <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: data.carColor }}>
//             {data.carName}
//           </p>
//         )}
//         <p className="font-bold mb-2">{data.variant_name}</p>
//         <div className="space-y-1">
//           {data.fuel_type && (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Fuel:</span>
//               <span className="font-semibold">{data.fuel_type}</span>
//             </div>
//           )}
//           {data.engine_type && (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Engine:</span>
//               <span className="font-semibold">{data.engine_type}</span>
//             </div>
//           )}
//           {data.transmission_type && (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Transmission:</span>
//               <span className="font-semibold">{data.transmission_type}</span>
//             </div>
//           )}
//           <div className="flex justify-between gap-4 pt-2 border-t mt-2">
//             <span className="text-slate-500">Price:</span>
//             <span className="font-bold text-blue-600">{formatPrice(displayPrice)}</span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Custom label for each point showing variant name
//   const renderCustomLabel = (props: any) => {
//     const { x, y, payload } = props;
//     if (!payload || !payload.variant_name) return null;

//     return (
//       <g>
//         {/* White background for better readability */}
//         <rect
//           x={x + 18}
//           y={y - 8}
//           width={payload.variant_name.length * 6}
//           height={16}
//           fill="white"
//           fillOpacity={0.9}
//           rx={2}
//         />
//         {/* Variant name text */}
//         <text
//           x={x + 20}
//           y={y}
//           fill="#0f172a"
//           fontSize={11}
//           fontWeight={600}
//           textAnchor="start"
//           dominantBaseline="middle"
//         >
//           {payload.variant_name}
//         </text>
//       </g>
//     );
//   };

//   const numCars = isCombinedMode ? allCarsData.length : 1;
//   const xDomain = [0, numCars + 1];

//   return (
//     <div className="w-full h-full flex flex-col">
//       <div className="flex-1">
//         <ResponsiveContainer width="100%" height="100%">
//           <ScatterChart margin={{ top: 20, right: 250, left: 60, bottom: 20 }}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
//             <XAxis
//               type="number"
//               dataKey="x"
//               domain={xDomain}
//               ticks={isCombinedMode ? allCarsData.map((_, i) => i + 1) : [1]}
//               tickFormatter={(value) => {
//                 if (isCombinedMode) {
//                   const carData = allCarsData[Math.round(value) - 1];
//                   return carData ? carData.carName : '';
//                 }
//                 return carName;
//               }}
//               tick={{ fontSize: 12, fontWeight: 'bold' }}
//             />
//             <YAxis
//               type="number"
//               dataKey="y"
//               domain={[priceRange.min * 0.95, priceRange.max * 1.05]}
//               tick={{ fontSize: 10 }}
//               tickFormatter={(val) => formatPriceShort(val)}
//               width={60}
//             />
//             <Tooltip content={<CustomTooltip />} />

//             {/* Background boxes showing price range for each car */}
//             {isCombinedMode ? (
//               carGroups.map((group, index) => (
//                 <ReferenceArea
//                   key={group.carId}
//                   x1={index + 0.7}
//                   x2={index + 1.3}
//                   y1={group.min}
//                   y2={group.max}
//                   fill={group.carColor}
//                   fillOpacity={0.1}
//                   stroke={group.carColor}
//                   strokeOpacity={0.3}
//                   strokeWidth={2}
//                   strokeDasharray="5 5"
//                 />
//               ))
//             ) : (
//               verticalChartData.length > 0 && (
//                 <ReferenceArea
//                   x1={0.7}
//                   x2={1.3}
//                   y1={priceRange.min}
//                   y2={priceRange.max}
//                   fill={chartColor}
//                   fillOpacity={0.1}
//                   stroke={chartColor}
//                   strokeOpacity={0.3}
//                   strokeWidth={2}
//                   strokeDasharray="5 5"
//                 />
//               )
//             )}

//             <Scatter
//               data={verticalChartData}
//               fill="none"
//               label={renderCustomLabel}
//               shape="circle"
//             >
//               {verticalChartData.map((entry, index) => (
//                 <Cell
//                   key={`cell-${index}`}
//                   fill="white"
//                   stroke={entry.carColor}
//                   strokeWidth={2}
//                   cursor="pointer"
//                   onClick={() => onPricingClick && onPricingClick(entry.fullData)}
//                   opacity={0.8}
//                 />
//               ))}
//             </Scatter>
//           </ScatterChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default ChartView;