// import React, { useState, useMemo, useRef } from 'react';
// import { ArrowLeftRight, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
//   // Y-axis zoom: 1.0 = auto, <1.0 = zoomed in (tighter range), >1.0 = zoomed out
//   const [yZoomFactor, setYZoomFactor] = useState<number>(1.0);
//   const [yPanOffset, setYPanOffset] = useState<number>(0);

//   React.useEffect(() => {
//     const currentCarIds = allCarsData.map(c => `${c.carId}-${c.pricing.length}`).join(',');

//     if (currentCarIds !== prevCarIdsRef.current) {
//       setOrderedCars(allCarsData);
//       prevCarIdsRef.current = currentCarIds;
//       // Auto-reset zoom when data changes
//       setYZoomFactor(1.0);
//       setYPanOffset(0);
//     }
//   }, [allCarsData]);

//   const carsToUse = isCombinedMode ? orderedCars : allCarsData;

//   const swapCars = (index1: number, index2: number) => {
//     const newOrder = [...orderedCars];
//     [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];
//     setOrderedCars(newOrder);
//     if (onOrderChange) {
//       onOrderChange(newOrder);
//     }
//   };

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

//   // Compute the zoomed Y-axis domain
//   const yDomain = useMemo(() => {
//     if (priceRange.min === 0 && priceRange.max === 0) return [0, 1];
//     const center = (priceRange.min + priceRange.max) / 2;
//     const halfRange = ((priceRange.max - priceRange.min) / 2) * yZoomFactor;
//     const padding = halfRange * 0.05;
//     const lo = center - halfRange - padding + yPanOffset;
//     const hi = center + halfRange + padding + yPanOffset;
//     return [Math.max(0, lo), hi];
//   }, [priceRange, yZoomFactor, yPanOffset]);

//   const handleZoomIn = () => setYZoomFactor(prev => Math.max(0.1, parseFloat((prev * 0.7).toFixed(3))));
//   const handleZoomOut = () => setYZoomFactor(prev => Math.min(5, parseFloat((prev * 1.43).toFixed(3))));
//   const handlePanUp = () => setYPanOffset(prev => {
//     const step = (priceRange.max - priceRange.min) * 0.1 * yZoomFactor;
//     return prev + step;
//   });
//   const handlePanDown = () => setYPanOffset(prev => {
//     const step = (priceRange.max - priceRange.min) * 0.1 * yZoomFactor;
//     return Math.max(-(priceRange.max - priceRange.min), prev - step);
//   });
//   const handleResetZoom = () => { setYZoomFactor(1.0); setYPanOffset(0); };

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
//       xPosition: data[0].x, // Preserve the original x-position
//       min: Math.min(...data.map(d => d.y)),
//       max: Math.max(...data.map(d => d.y))
//     }));
//   }, [verticalChartData, isCombinedMode]);

//   const formatLakhsTruncate = (price: number) => {
//     const lakhs = price / 100000;          // convert to lakhs
//     const truncated = Math.floor(lakhs * 100) / 100; // truncate 2 decimals
//     return truncated.toFixed(2);
//   };
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
//     // Tighter width calculation to prevent empty white box overlap
//     // Using 5.2px per character for size 9 font to be very conservative
//     const textWidth = value.length * 5.2 + 10;

//     return (
//       <g>
//         <rect
//           x={cx + 18}
//           y={cy - 10}
//           width={textWidth}
//           height={20}
//           fill="white"
//           fillOpacity={0.9}
//           stroke="#cbd5e1"
//           strokeWidth={1}
//           rx={4}
//         />
//         <text
//           x={cx + 23}
//           y={cy + 1}
//           fill="#334155"
//           fontSize={9}
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
//       {/* Y-Axis Zoom Controls */}
//       <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
//         <div className="bg-white rounded-lg border border-slate-200 shadow-md p-1 flex flex-col gap-0.5">
//           <span className="text-[9px] font-bold text-slate-500 text-center px-1 pb-0.5 border-b border-slate-100">Y ZOOM</span>
//           <button
//             onClick={handleZoomIn}
//             className="p-1.5 hover:bg-blue-50 rounded text-slate-600 hover:text-blue-600 transition-colors"
//             title="Zoom In (narrow Y range)"
//           >
//             <ZoomIn size={13} />
//           </button>
//           <button
//             onClick={handlePanUp}
//             className="p-1.5 hover:bg-slate-50 rounded text-slate-600 hover:text-slate-800 transition-colors text-[11px] font-bold leading-none"
//             title="Pan Up"
//           >▲</button>
//           <button
//             onClick={handlePanDown}
//             className="p-1.5 hover:bg-slate-50 rounded text-slate-600 hover:text-slate-800 transition-colors text-[11px] font-bold leading-none"
//             title="Pan Down"
//           >▼</button>
//           <button
//             onClick={handleZoomOut}
//             className="p-1.5 hover:bg-blue-50 rounded text-slate-600 hover:text-blue-600 transition-colors"
//             title="Zoom Out (expand Y range)"
//           >
//             <ZoomOut size={13} />
//           </button>
//           <button
//             onClick={handleResetZoom}
//             className="p-1.5 hover:bg-orange-50 rounded text-slate-400 hover:text-orange-500 transition-colors"
//             title="Reset Zoom"
//           >
//             <RotateCcw size={11} />
//           </button>
//         </div>
//       </div>
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
//           <ScatterChart margin={{ top: 20, right: 300, left: 60, bottom: 20 }}>
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
//               domain={yDomain as [number, number]}
//               tick={{ fontSize: 10 }}
//               tickFormatter={(val) => formatPriceShort(val)}
//               width={60}
//             />
//             <Tooltip content={<CustomTooltip />} />

//             {/* GAP ADJUSTED HERE */}
//             {isCombinedMode ? (
//               [...carGroups].reverse().map((group) => (
//                 <React.Fragment key={group.carId}>
//                   <ReferenceArea
//                     x1={group.xPosition - 0.15}
//                     x2={group.xPosition + 0.15}
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
//                   x1={0.85}
//                   x2={1.15}
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
//                 const labelWithPrice = `${payload.variant_name} (${formatLakhsTruncate(payload.y)} L)`;


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
//                     <CustomLabel cx={cx} cy={cy} value={labelWithPrice} />
//                   </g>
//                 );
//               }}
//             >
//               {verticalChartData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} cursor="pointer" />
//               ))}
//             </Scatter>
//           </ScatterChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default ChartView;


// // import React, { useState, useMemo } from 'react';
// // import {
// //   ResponsiveContainer,
// //   ScatterChart,
// //   Scatter,
// //   Cell,
// //   CartesianGrid,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   ReferenceArea,
// //   Label
// // } from 'recharts';

// // interface PricingPoint {
// //   variant_id: string;
// //   variant_name: string;
// //   pricing_id: string;
// //   ex_showroom_price: number;
// //   currency: string;
// //   fuel_type: string | null;
// //   engine_type: string | null;
// //   transmission_type: string | null;
// //   paint_type: string | null;
// //   edition: string | null;
// // }

// // interface ChartViewProps {
// //   rawPricing: PricingPoint[];
// //   chartColor: string;
// //   formatPriceShort: (price: number) => string;
// //   onPricingClick?: (pricing: PricingPoint) => void;
// //   carId: string;
// //   carName: string;
// //   // For combined mode
// //   isCombinedMode?: boolean;
// //   allCarsData?: Array<{ carId: string; carName: string; pricing: PricingPoint[]; color: string }>;
// // }

// // const ChartView: React.FC<ChartViewProps> = ({
// //   rawPricing,
// //   chartColor,
// //   formatPriceShort,
// //   onPricingClick,
// //   carId,
// //   carName,
// //   isCombinedMode = false,
// //   allCarsData = []
// // }) => {
// //   // Helper function to add jitter to avoid overlapping points
// //   const addJitter = (baseX: number, index: number, totalPoints: number, carIndex: number = 0) => {
// //     // Use a deterministic approach based on index for consistent positioning
// //     const jitterStrength = 0.08; // Horizontal spread
// //     const seed = index * 12345; // Pseudo-random seed based on index
// //     const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
// //     return baseX + (pseudoRandom * jitterStrength);
// //   };

// //   // Helper function to add vertical jitter for overlapping prices
// //   const addVerticalJitter = (baseY: number, index: number, priceGroup: number[]) => {
// //     // Find how many points share this exact price
// //     const matchingPrices = priceGroup.filter(p => Math.abs(p - baseY) < 1000).length;

// //     if (matchingPrices > 1) {
// //       // Add small vertical offset for overlapping prices
// //       const jitterStrength = 15000; // Small rupee offset
// //       const seed = index * 67890;
// //       const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
// //       return baseY + (pseudoRandom * jitterStrength);
// //     }
// //     return baseY;
// //   };

// //   // Prepare data for vertical chart with jitter
// //   const verticalChartData = useMemo(() => {
// //     if (isCombinedMode && allCarsData.length > 0) {
// //       // Combined mode: show all cars on same axis
// //       const allData: any[] = [];
// //       allCarsData.forEach((carData, carIndex) => {
// //         const prices = carData.pricing.map(p => p.ex_showroom_price);
// //         carData.pricing.forEach((p, index) => {
// //           allData.push({
// //             x: addJitter(carIndex + 1, index, carData.pricing.length, carIndex),
// //             y: addVerticalJitter(p.ex_showroom_price, index, prices),
// //             originalY: p.ex_showroom_price, // Keep original for tooltip
// //             variant_name: p.variant_name,
// //             fuel_type: p.fuel_type,
// //             engine_type: p.engine_type,
// //             transmission_type: p.transmission_type,
// //             pricing_id: p.pricing_id,
// //             fullData: p,
// //             carName: carData.carName,
// //             carColor: carData.color,
// //             carId: carData.carId
// //           });
// //         });
// //       });
// //       return allData;
// //     } else {
// //       // Individual mode: single car
// //       const prices = rawPricing.map(p => p.ex_showroom_price);
// //       return rawPricing.map((p, index) => ({
// //         x: addJitter(1, index, rawPricing.length),
// //         y: addVerticalJitter(p.ex_showroom_price, index, prices),
// //         originalY: p.ex_showroom_price, // Keep original for tooltip
// //         variant_name: p.variant_name,
// //         fuel_type: p.fuel_type,
// //         engine_type: p.engine_type,
// //         transmission_type: p.transmission_type,
// //         pricing_id: p.pricing_id,
// //         fullData: p,
// //         carName: carName,
// //         carColor: chartColor,
// //         carId: carId
// //       }));
// //     }
// //   }, [rawPricing, isCombinedMode, allCarsData, carName, chartColor, carId]);

// //   // Calculate price range
// //   const priceRange = useMemo(() => {
// //     if (verticalChartData.length === 0) return { min: 0, max: 0 };
// //     const prices = verticalChartData.map(d => d.originalY || d.y);
// //     return {
// //       min: Math.min(...prices),
// //       max: Math.max(...prices)
// //     };
// //   }, [verticalChartData]);

// //   // Group data by car for combined mode
// //   const carGroups = useMemo(() => {
// //     if (!isCombinedMode) return [];
// //     const groups = new Map<string, any[]>();
// //     verticalChartData.forEach(d => {
// //       if (!groups.has(d.carId)) {
// //         groups.set(d.carId, []);
// //       }
// //       groups.get(d.carId)!.push(d);
// //     });
// //     return Array.from(groups.entries()).map(([carId, data]) => ({
// //       carId,
// //       data,
// //       carName: data[0].carName,
// //       carColor: data[0].carColor,
// //       min: Math.min(...data.map(d => d.originalY || d.y)),
// //       max: Math.max(...data.map(d => d.originalY || d.y))
// //     }));
// //   }, [verticalChartData, isCombinedMode]);

// //   const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', {
// //     style: 'currency',
// //     currency: 'INR',
// //     maximumFractionDigits: 0
// //   }).format(p);

// //   // Custom Tooltip
// //   const CustomTooltip = ({ active, payload }: any) => {
// //     if (!active || !payload || !payload.length) return null;
// //     const data = payload[0]?.payload;
// //     if (!data) return null;

// //     // Use original price for display
// //     const displayPrice = data.originalY || data.y;

// //     return (
// //       <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800">
// //         {isCombinedMode && (
// //           <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: data.carColor }}>
// //             {data.carName}
// //           </p>
// //         )}
// //         <p className="font-bold mb-2">{data.variant_name}</p>
// //         <div className="space-y-1">
// //           {data.fuel_type && (
// //             <div className="flex justify-between gap-4">
// //               <span className="text-slate-500">Fuel:</span>
// //               <span className="font-semibold">{data.fuel_type}</span>
// //             </div>
// //           )}
// //           {data.engine_type && (
// //             <div className="flex justify-between gap-4">
// //               <span className="text-slate-500">Engine:</span>
// //               <span className="font-semibold">{data.engine_type}</span>
// //             </div>
// //           )}
// //           {data.transmission_type && (
// //             <div className="flex justify-between gap-4">
// //               <span className="text-slate-500">Transmission:</span>
// //               <span className="font-semibold">{data.transmission_type}</span>
// //             </div>
// //           )}
// //           <div className="flex justify-between gap-4 pt-2 border-t mt-2">
// //             <span className="text-slate-500">Price:</span>
// //             <span className="font-bold text-blue-600">{formatPrice(displayPrice)}</span>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   // Custom label for each point showing variant name
// //   const renderCustomLabel = (props: any) => {
// //     const { x, y, payload } = props;
// //     if (!payload || !payload.variant_name) return null;

// //     return (
// //       <g>
// //         {/* White background for better readability */}
// //         <rect
// //           x={x + 18}
// //           y={y - 8}
// //           width={payload.variant_name.length * 6}
// //           height={16}
// //           fill="white"
// //           fillOpacity={0.9}
// //           rx={2}
// //         />
// //         {/* Variant name text */}
// //         <text
// //           x={x + 20}
// //           y={y}
// //           fill="#0f172a"
// //           fontSize={11}
// //           fontWeight={600}
// //           textAnchor="start"
// //           dominantBaseline="middle"
// //         >
// //           {payload.variant_name}
// //         </text>
// //       </g>
// //     );
// //   };

// //   const numCars = isCombinedMode ? allCarsData.length : 1;
// //   const xDomain = [0, numCars + 1];

// //   return (
// //     <div className="w-full h-full flex flex-col">
// //       <div className="flex-1">
// //         <ResponsiveContainer width="100%" height="100%">
// //           <ScatterChart margin={{ top: 20, right: 250, left: 60, bottom: 20 }}>
// //             <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
// //             <XAxis
// //               type="number"
// //               dataKey="x"
// //               domain={xDomain}
// //               ticks={isCombinedMode ? allCarsData.map((_, i) => i + 1) : [1]}
// //               tickFormatter={(value) => {
// //                 if (isCombinedMode) {
// //                   const carData = allCarsData[Math.round(value) - 1];
// //                   return carData ? carData.carName : '';
// //                 }
// //                 return carName;
// //               }}
// //               tick={{ fontSize: 12, fontWeight: 'bold' }}
// //             />
// //             <YAxis
// //               type="number"
// //               dataKey="y"
// //               domain={[priceRange.min * 0.95, priceRange.max * 1.05]}
// //               tick={{ fontSize: 10 }}
// //               tickFormatter={(val) => formatPriceShort(val)}
// //               width={60}
// //             />
// //             <Tooltip content={<CustomTooltip />} />

// //             {/* Background boxes showing price range for each car */}
// //             {isCombinedMode ? (
// //               carGroups.map((group, index) => (
// //                 <ReferenceArea
// //                   key={group.carId}
// //                   x1={index + 0.7}
// //                   x2={index + 1.3}
// //                   y1={group.min}
// //                   y2={group.max}
// //                   fill={group.carColor}
// //                   fillOpacity={0.1}
// //                   stroke={group.carColor}
// //                   strokeOpacity={0.3}
// //                   strokeWidth={2}
// //                   strokeDasharray="5 5"
// //                 />
// //               ))
// //             ) : (
// //               verticalChartData.length > 0 && (
// //                 <ReferenceArea
// //                   x1={0.7}
// //                   x2={1.3}
// //                   y1={priceRange.min}
// //                   y2={priceRange.max}
// //                   fill={chartColor}
// //                   fillOpacity={0.1}
// //                   stroke={chartColor}
// //                   strokeOpacity={0.3}
// //                   strokeWidth={2}
// //                   strokeDasharray="5 5"
// //                 />
// //               )
// //             )}

// //             <Scatter
// //               data={verticalChartData}
// //               fill="none"
// //               label={renderCustomLabel}
// //               shape="circle"
// //             >
// //               {verticalChartData.map((entry, index) => (
// //                 <Cell
// //                   key={`cell-${index}`}
// //                   fill="white"
// //                   stroke={entry.carColor}
// //                   strokeWidth={2}
// //                   cursor="pointer"
// //                   onClick={() => onPricingClick && onPricingClick(entry.fullData)}
// //                   opacity={0.8}
// //                 />
// //               ))}
// //             </Scatter>
// //           </ScatterChart>
// //         </ResponsiveContainer>
// //       </div>
// //     </div>
// //   );
// // };

// // export default ChartView;










/// src/components/ChartView.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import * as d3 from 'd3';

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

const MARGIN = { top: 30, right: 280, bottom: 50, left: 70 };
const MIN_LABEL_GAP = 24;     // px — minimum vertical space a label needs
const MIN_HEIGHT = 400;       // floor, never shorter than this

const ChartView: React.FC<ChartViewProps> = ({
  rawPricing,
  chartColor,
  formatPriceShort,
  onPricingClick,
  carId,
  carName,
  isCombinedMode = false,
  allCarsData = [],
  onOrderChange,
}) => {
  const [orderedCars, setOrderedCars] = useState(allCarsData);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCarIdsRef = useRef<string>('');
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  useEffect(() => {
    const currentCarIds = allCarsData.map(c => `${c.carId}-${c.pricing.length}`).join(',');
    if (currentCarIds !== prevCarIdsRef.current) {
      setOrderedCars(allCarsData);
      prevCarIdsRef.current = currentCarIds;
    }
  }, [allCarsData]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const carsToUse = isCombinedMode ? orderedCars : allCarsData;

  const swapCars = (index1: number, index2: number) => {
    const newOrder = [...orderedCars];
    [newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]];
    setOrderedCars(newOrder);
    if (onOrderChange) onOrderChange(newOrder);
  };

  const moveCar = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < orderedCars.length) swapCars(index, newIndex);
  };

  const rawPoints = useMemo(() => {
    if (isCombinedMode && carsToUse.length > 0) {
      const all: any[] = [];
      carsToUse.forEach((carData, carIndex) => {
        carData.pricing.forEach(p => {
          all.push({
            carSlot: carIndex,
            price: p.ex_showroom_price,
            variant_name: p.variant_name,
            fuel_type: p.fuel_type,
            engine_type: p.engine_type,
            transmission_type: p.transmission_type,
            pricing_id: p.pricing_id,
            fullData: p,
            carName: carData.carName,
            carColor: carData.color,
            carId: carData.carId,
          });
        });
      });
      return all;
    }
    return rawPricing.map(p => ({
      carSlot: 0,
      price: p.ex_showroom_price,
      variant_name: p.variant_name,
      fuel_type: p.fuel_type,
      engine_type: p.engine_type,
      transmission_type: p.transmission_type,
      pricing_id: p.pricing_id,
      fullData: p,
      carName,
      carColor: chartColor,
      carId,
    }));
  }, [rawPricing, isCombinedMode, carsToUse, carName, chartColor, carId]);

  const priceRange = useMemo(() => {
    if (rawPoints.length === 0) return { min: 0, max: 1 };
    const prices = rawPoints.map(d => d.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [rawPoints]);

  const numCars = isCombinedMode ? carsToUse.length : 1;

  // height auto-calculated from the densest column — always fits, no zoom needed
  const maxGroupSize = useMemo(() => {
    const counts = new Map<number, number>();
    rawPoints.forEach(p => counts.set(p.carSlot, (counts.get(p.carSlot) || 0) + 1));
    return counts.size === 0 ? 1 : Math.max(...Array.from(counts.values()));
  }, [rawPoints]);

  const chartHeight = useMemo(() => {
    const needed = maxGroupSize * MIN_LABEL_GAP + MARGIN.top + MARGIN.bottom + 40;
    return Math.max(MIN_HEIGHT, containerHeight, needed);
  }, [maxGroupSize, containerHeight]);

  const innerHeight = chartHeight - MARGIN.top - MARGIN.bottom;
  const innerWidth = Math.max(200, containerWidth - MARGIN.left - MARGIN.right);

  const yScale = useMemo(() => {
    const pad = (priceRange.max - priceRange.min) * 0.08 || priceRange.max * 0.1 || 1;
    return d3.scaleLinear()
      .domain([Math.max(0, priceRange.min - pad), priceRange.max + pad])
      .range([innerHeight, 0]);
  }, [priceRange, innerHeight]);

  const xSlotWidth = numCars > 0 ? innerWidth / numCars : innerWidth;
  const xCenter = (slot: number) => xSlotWidth * slot + xSlotWidth / 2;

  // collision-avoidance: circle stays at TRUE price, only label shifts
  const resolvedPoints = useMemo(() => {
    const groups = new Map<number, any[]>();
    rawPoints.forEach(p => {
      const trueY = yScale(p.price);
      const point = { ...p, trueY, labelY: trueY };
      if (!groups.has(p.carSlot)) groups.set(p.carSlot, []);
      groups.get(p.carSlot)!.push(point);
    });

    const result: any[] = [];
    groups.forEach(group => {
      group.sort((a, b) => a.trueY - b.trueY);
      for (let i = 1; i < group.length; i++) {
        if (group[i].labelY - group[i - 1].labelY < MIN_LABEL_GAP) {
          group[i].labelY = group[i - 1].labelY + MIN_LABEL_GAP;
        }
      }
      const overflow = group.length ? group[group.length - 1].labelY - innerHeight : 0;
      if (overflow > 0) {
        for (let i = 0; i < group.length; i++) group[i].labelY -= overflow;
        for (let i = 1; i < group.length; i++) {
          if (group[i].labelY - group[i - 1].labelY < MIN_LABEL_GAP) {
            group[i].labelY = group[i - 1].labelY + MIN_LABEL_GAP;
          }
        }
      }
      result.push(...group);
    });
    return result;
  }, [rawPoints, yScale, innerHeight]);

  const carGroups = useMemo(() => {
    if (!isCombinedMode) return [];
    const groups = new Map<string, any[]>();
    resolvedPoints.forEach(d => {
      if (!groups.has(d.carId)) groups.set(d.carId, []);
      groups.get(d.carId)!.push(d);
    });
    return Array.from(groups.entries()).map(([cId, data]) => ({
      carId: cId,
      carName: data[0].carName,
      carColor: data[0].carColor,
      slot: data[0].carSlot,
      minY: Math.min(...data.map(d => d.trueY)),
      maxY: Math.max(...data.map(d => d.trueY)),
    }));
  }, [resolvedPoints, isCombinedMode]);

  const formatLakhsTruncate = (price: number) => {
    const lakhs = price / 100000;
    return (Math.floor(lakhs * 100) / 100).toFixed(2);
  };
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  const yTicks = yScale.ticks(8);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Reorder controls — unchanged */}
      {isCombinedMode && orderedCars.length >= 2 && (
        <div className="absolute top-2 right-4 z-10 bg-white rounded-lg shadow-lg border p-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reorder:</span>
            {orderedCars.map((car, index) => (
              <div key={car.carId} className="flex items-center gap-1">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs font-bold"
                  style={{ borderColor: car.color, backgroundColor: `${car.color}15` }}
                >
                  <button onClick={() => moveCar(index, 'left')} disabled={index === 0} className="p-0.1 hover:bg-white/50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move left">
                    <ChevronLeft size={4} />
                  </button>
                  <span className="px-1" style={{ color: car.color }}>{index + 1}</span>
                  <button onClick={() => moveCar(index, 'right')} disabled={index === orderedCars.length - 1} className="p-0.1 hover:bg-white/50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move right">
                    <ChevronRight size={4} />
                  </button>
                </div>
                {index < orderedCars.length - 1 && (
                  <button onClick={() => swapCars(index, index + 1)} className="p-1 hover:bg-slate-100 rounded transition-colors" title={`Swap positions ${index + 1} and ${index + 2}`}>
                    <ArrowLeftRight size={8} className="text-slate-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static, auto-fit chart — no zoom, no scroll needed */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <svg width="100%" height={chartHeight} style={{ display: 'block' }}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {yTicks.map((t, i) => (
              <g key={i}>
                <line x1={0} x2={innerWidth} y1={yScale(t)} y2={yScale(t)} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={-10} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#64748b">
                  {formatPriceShort(t)}
                </text>
              </g>
            ))}

            {isCombinedMode
              ? carsToUse.map((c, i) => (
                <text key={c.carId} x={xCenter(i)} y={innerHeight + 28} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#0f172a">
                  {c.carName}
                </text>
              ))
              : (
                <text x={xCenter(0)} y={innerHeight + 28} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#0f172a">
                  {carName}
                </text>
              )}

            {isCombinedMode
              ? carGroups.map(g => (
                <rect
                  key={g.carId}
                  x={xCenter(g.slot) - xSlotWidth * 0.15}
                  y={g.minY}
                  width={xSlotWidth * 0.3}
                  height={Math.max(2, g.maxY - g.minY)}
                  fill={g.carColor} fillOpacity={0.12}
                  stroke={g.carColor} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="5 5" rx={4}
                />
              ))
              : resolvedPoints.length > 0 && (() => {
                const ys = resolvedPoints.map(d => d.trueY);
                return (
                  <rect
                    x={xCenter(0) - xSlotWidth * 0.15}
                    y={Math.min(...ys)}
                    width={xSlotWidth * 0.3}
                    height={Math.max(2, Math.max(...ys) - Math.min(...ys))}
                    fill={chartColor} fillOpacity={0.12}
                    stroke={chartColor} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="5 5" rx={4}
                  />
                );
              })()}

            {resolvedPoints.map((p, idx) => {
              const cx = xCenter(p.carSlot);
              const circleY = p.trueY;
              const labelY = p.labelY;
              const labelText = `${p.variant_name} (${formatLakhsTruncate(p.price)} L)`;
              const textWidth = labelText.length * 5.2 + 10;
              const hasOffset = Math.abs(labelY - circleY) > 1;

              return (
                <g
                  key={`${p.carId}-${p.pricing_id}-${idx}`}
                  className="cursor-pointer"
                  onClick={() => onPricingClick && onPricingClick(p.fullData)}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle cx={cx} cy={circleY} r={6} fill="white" stroke={p.carColor} strokeWidth={2} />

                  {hasOffset && (
                    <polyline
                      points={`${cx},${circleY} ${cx + 10},${circleY} ${cx + 14},${labelY}`}
                      fill="none"
                      stroke={p.carColor}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      opacity={0.7}
                    />
                  )}

                  <rect x={cx + 18} y={labelY - 10} width={textWidth} height={20} fill="white" fillOpacity={0.95} stroke="#cbd5e1" strokeWidth={1} rx={4} />
                  <text x={cx + 23} y={labelY + 1} fill="#334155" fontSize={9} fontWeight={600} textAnchor="start" dominantBaseline="middle">
                    {labelText}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hoveredPoint && (
          <div
            className="absolute bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800 pointer-events-none z-30"
            style={{
              left: Math.min(containerWidth - 220, MARGIN.left + xCenter(hoveredPoint.carSlot) + 40),
              top: Math.max(0, MARGIN.top + hoveredPoint.trueY - 40),
            }}
          >
            {isCombinedMode && (
              <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: hoveredPoint.carColor }}>{hoveredPoint.carName}</p>
            )}
            <p className="font-bold mb-2">{hoveredPoint.variant_name}</p>
            <div className="space-y-1">
              {hoveredPoint.fuel_type && (
                <div className="flex justify-between gap-4"><span className="text-slate-500">Fuel:</span><span className="font-semibold">{hoveredPoint.fuel_type}</span></div>
              )}
              {hoveredPoint.transmission_type && (
                <div className="flex justify-between gap-4"><span className="text-slate-500">Transmission:</span><span className="font-semibold">{hoveredPoint.transmission_type}</span></div>
              )}
              {hoveredPoint.fullData?.paint_type && (
                <div className="flex justify-between gap-4"><span className="text-slate-500">Paint:</span><span className="font-semibold">{hoveredPoint.fullData.paint_type}</span></div>
              )}
              <div className="flex justify-between gap-4 pt-2 border-t mt-2">
                <span className="text-slate-500">Price:</span>
                <span className="font-bold text-blue-600">{formatPrice(hoveredPoint.price)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartView;