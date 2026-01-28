// import React, { useState, useMemo } from 'react';
// import { GripVertical } from 'lucide-react';
// import {
//     ResponsiveContainer,
//     ScatterChart,
//     Scatter,
//     Cell,
//     CartesianGrid,
//     XAxis,
//     YAxis,
//     Tooltip,
//     ReferenceArea,
// } from 'recharts';

// interface PricingPoint {
//     variant_id: string;
//     variant_name: string;
//     pricing_id: string;
//     ex_showroom_price: number;
//     currency: string;
//     fuel_type: string | null;
//     engine_type: string | null;
//     transmission_type: string | null;
//     paint_type: string | null;
//     edition: string | null;
// }

// interface CarData {
//     carId: string;
//     carName: string;
//     pricing: PricingPoint[];
//     color: string;
// }

// interface DraggableChartViewProps {
//     allCarsData: CarData[];
//     formatPriceShort: (price: number) => string;
//     onPricingClick?: (pricing: PricingPoint) => void;
//     onOrderChange?: (newOrder: CarData[]) => void;
// }

// const DraggableChartView: React.FC<DraggableChartViewProps> = ({
//     allCarsData,
//     formatPriceShort,
//     onPricingClick,
//     onOrderChange
// }) => {
//     const [orderedCars, setOrderedCars] = useState<CarData[]>(allCarsData);
//     const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
//     const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

//     // Update ordered cars when allCarsData changes
//     React.useEffect(() => {
//         setOrderedCars(allCarsData);
//     }, [allCarsData]);

//     // Prepare data for vertical chart
//     const verticalChartData = useMemo(() => {
//         const allData: any[] = [];
//         orderedCars.forEach((carData, carIndex) => {
//             carData.pricing.forEach((p) => {
//                 allData.push({
//                     x: carIndex + 1,
//                     y: p.ex_showroom_price,
//                     variant_name: p.variant_name,
//                     fuel_type: p.fuel_type,
//                     engine_type: p.engine_type,
//                     transmission_type: p.transmission_type,
//                     pricing_id: p.pricing_id,
//                     fullData: p,
//                     carName: carData.carName,
//                     carColor: carData.color,
//                     carId: carData.carId
//                 });
//             });
//         });
//         return allData;
//     }, [orderedCars]);

//     // Calculate price range
//     const priceRange = useMemo(() => {
//         if (verticalChartData.length === 0) return { min: 0, max: 0 };
//         const prices = verticalChartData.map(d => d.y);
//         return {
//             min: Math.min(...prices),
//             max: Math.max(...prices)
//         };
//     }, [verticalChartData]);

//     // Group data by car
//     const carGroups = useMemo(() => {
//         const groups = new Map<string, any[]>();
//         verticalChartData.forEach(d => {
//             if (!groups.has(d.carId)) {
//                 groups.set(d.carId, []);
//             }
//             groups.get(d.carId)!.push(d);
//         });
//         return Array.from(groups.entries()).map(([carId, data]) => ({
//             carId,
//             data,
//             carName: data[0].carName,
//             carColor: data[0].carColor,
//             min: Math.min(...data.map(d => d.y)),
//             max: Math.max(...data.map(d => d.y))
//         }));
//     }, [verticalChartData]);

//     // Group points by variant
//     const variantLabelPositions = useMemo(() => {
//         const variantMap = new Map<string, { x: number; y: number; name: string; variantId: string; carId: string }>();

//         verticalChartData.forEach((point) => {
//             const key = `${point.carId}-${point.fullData.variant_id}`;
//             if (!variantMap.has(key)) {
//                 variantMap.set(key, {
//                     x: point.x,
//                     y: point.y,
//                     name: point.variant_name,
//                     variantId: point.fullData.variant_id,
//                     carId: point.carId
//                 });
//             } else {
//                 const existing = variantMap.get(key)!;
//                 if (point.y > existing.y) {
//                     variantMap.set(key, {
//                         x: point.x,
//                         y: point.y,
//                         name: point.variant_name,
//                         variantId: point.fullData.variant_id,
//                         carId: point.carId
//                     });
//                 }
//             }
//         });

//         return Array.from(variantMap.values());
//     }, [verticalChartData]);

//     const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', {
//         style: 'currency',
//         currency: 'INR',
//         maximumFractionDigits: 0
//     }).format(p);

//     // Drag handlers
//     const handleDragStart = (index: number) => {
//         setDraggedIndex(index);
//     };

//     const handleDragOver = (e: React.DragEvent, index: number) => {
//         e.preventDefault();
//         if (draggedIndex !== null && draggedIndex !== index) {
//             setDragOverIndex(index);
//         }
//     };

//     const handleDragLeave = () => {
//         setDragOverIndex(null);
//     };

//     const handleDrop = (e: React.DragEvent, dropIndex: number) => {
//         e.preventDefault();

//         if (draggedIndex !== null && draggedIndex !== dropIndex) {
//             const newOrder = [...orderedCars];
//             const [draggedItem] = newOrder.splice(draggedIndex, 1);
//             newOrder.splice(dropIndex, 0, draggedItem);

//             setOrderedCars(newOrder);
//             if (onOrderChange) {
//                 onOrderChange(newOrder);
//             }
//         }

//         setDraggedIndex(null);
//         setDragOverIndex(null);
//     };

//     const handleDragEnd = () => {
//         setDraggedIndex(null);
//         setDragOverIndex(null);
//     };

//     // Custom Tooltip
//     const CustomTooltip = ({ active, payload }: any) => {
//         if (!active || !payload || !payload.length) return null;
//         const data = payload[0]?.payload;
//         if (!data) return null;

//         return (
//             <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800">
//                 <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: data.carColor }}>
//                     {data.carName}
//                 </p>
//                 <p className="font-bold mb-2">{data.variant_name}</p>
//                 <div className="space-y-1">
//                     {data.fuel_type && (
//                         <div className="flex justify-between gap-4">
//                             <span className="text-slate-500">Fuel:</span>
//                             <span className="font-semibold">{data.fuel_type}</span>
//                         </div>
//                     )}
//                     {data.engine_type && (
//                         <div className="flex justify-between gap-4">
//                             <span className="text-slate-500">Engine:</span>
//                             <span className="font-semibold">{data.engine_type}</span>
//                         </div>
//                     )}
//                     {data.transmission_type && (
//                         <div className="flex justify-between gap-4">
//                             <span className="text-slate-500">Transmission:</span>
//                             <span className="font-semibold">{data.transmission_type}</span>
//                         </div>
//                     )}
//                     <div className="flex justify-between gap-4 pt-2 border-t mt-2">
//                         <span className="text-slate-500">Price:</span>
//                         <span className="font-bold text-blue-600">{formatPrice(data.y)}</span>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     // Custom label for variants
//     const renderCustomLabel = (props: any) => {
//         const { x, y, payload } = props;
//         if (!payload || !payload.variant_name || !payload.fullData) return null;

//         const labelPos = variantLabelPositions.find(v =>
//             v.variantId === payload.fullData.variant_id &&
//             v.carId === payload.carId &&
//             Math.abs(v.y - payload.y) < 1
//         );

//         if (!labelPos) return null;

//         const textWidth = payload.variant_name.length * 6;

//         return (
//             <g>
//                 <rect
//                     x={x + 18}
//                     y={y - 8}
//                     width={textWidth}
//                     height={16}
//                     fill="white"
//                     fillOpacity={0.9}
//                     rx={2}
//                 />
//                 <text
//                     x={x + 20}
//                     y={y}
//                     fill="#0f172a"
//                     fontSize={11}
//                     fontWeight={600}
//                     textAnchor="start"
//                     dominantBaseline="middle"
//                 >
//                     {payload.variant_name}
//                 </text>
//             </g>
//         );
//     };

//     const numCars = orderedCars.length;
//     const xDomain = [0, numCars + 1];

//     return (
//         <div className="w-full h-full flex flex-col">
//             {/* Drag handles bar */}
//             <div className="flex items-center justify-center gap-4 px-6 py-3 bg-slate-50 border-b">
//                 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
//                     Drag to Reorder:
//                 </span>
//                 {orderedCars.map((car, index) => (
//                     <div
//                         key={car.carId}
//                         draggable
//                         onDragStart={() => handleDragStart(index)}
//                         onDragOver={(e) => handleDragOver(e, index)}
//                         onDragLeave={handleDragLeave}
//                         onDrop={(e) => handleDrop(e, index)}
//                         onDragEnd={handleDragEnd}
//                         className={`
//               flex items-center gap-2 px-4 py-2 rounded-lg cursor-move transition-all
//               ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
//               ${dragOverIndex === index ? 'scale-105 ring-2 ring-blue-400' : ''}
//               ${draggedIndex === null ? 'hover:bg-slate-100' : ''}
//             `}
//                         style={{
//                             backgroundColor: draggedIndex === index ? car.color + '20' : 'white',
//                             border: `2px solid ${car.color}`,
//                         }}
//                     >
//                         <GripVertical size={16} style={{ color: car.color }} />
//                         <span className="font-bold text-sm" style={{ color: car.color }}>
//                             {car.carName}
//                         </span>
//                     </div>
//                 ))}
//             </div>

//             {/* Chart */}
//             <div className="flex-1">
//                 <ResponsiveContainer width="100%" height="100%">
//                     <ScatterChart margin={{ top: 20, right: 250, left: 60, bottom: 20 }}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
//                         <XAxis
//                             type="number"
//                             dataKey="x"
//                             domain={xDomain}
//                             ticks={orderedCars.map((_, i) => i + 1)}
//                             tickFormatter={(value) => {
//                                 const carData = orderedCars[value - 1];
//                                 return carData ? carData.carName : '';
//                             }}
//                             tick={{ fontSize: 12, fontWeight: 'bold' }}
//                         />
//                         <YAxis
//                             type="number"
//                             dataKey="y"
//                             domain={[priceRange.min * 0.95, priceRange.max * 1.05]}
//                             tick={{ fontSize: 10 }}
//                             tickFormatter={(val) => formatPriceShort(val)}
//                             width={60}
//                         />
//                         <Tooltip content={<CustomTooltip />} />

//                         {carGroups.map((group, index) => (
//                             <ReferenceArea
//                                 key={group.carId}
//                                 x1={index + 0.7}
//                                 x2={index + 1.3}
//                                 y1={group.min}
//                                 y2={group.max}
//                                 fill={group.carColor}
//                                 fillOpacity={0.1}
//                                 stroke={group.carColor}
//                                 strokeOpacity={0.3}
//                                 strokeWidth={2}
//                                 strokeDasharray="5 5"
//                             />
//                         ))}

//                         <Scatter
//                             data={verticalChartData}
//                             fill="none"
//                             label={renderCustomLabel}
//                             shape="circle"
//                         >
//                             {verticalChartData.map((entry, index) => (
//                                 <Cell
//                                     key={`cell-${index}`}
//                                     fill="white"
//                                     stroke={entry.carColor}
//                                     strokeWidth={2}
//                                     cursor="pointer"
//                                     onClick={() => onPricingClick && onPricingClick(entry.fullData)}
//                                 />
//                             ))}
//                         </Scatter>
//                     </ScatterChart>
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// };

// export default DraggableChartView;

import React, { useState, useMemo } from 'react';
import { GripVertical } from 'lucide-react';
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

interface CarData {
    carId: string;
    carName: string;
    pricing: PricingPoint[];
    color: string;
}

interface DraggableChartViewProps {
    allCarsData: CarData[];
    formatPriceShort: (price: number) => string;
    onPricingClick?: (pricing: PricingPoint) => void;
    onOrderChange?: (newOrder: CarData[]) => void;
}

const DraggableChartView: React.FC<DraggableChartViewProps> = ({
    allCarsData,
    formatPriceShort,
    onPricingClick,
    onOrderChange
}) => {
    const [orderedCars, setOrderedCars] = useState<CarData[]>(allCarsData);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Update ordered cars when allCarsData changes
    React.useEffect(() => {
        setOrderedCars(allCarsData);
    }, [allCarsData]);

    // Prepare data for vertical chart
    const verticalChartData = useMemo(() => {
        const allData: any[] = [];
        orderedCars.forEach((carData, carIndex) => {
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
    }, [orderedCars]);

    // Calculate price range
    const priceRange = useMemo(() => {
        if (verticalChartData.length === 0) return { min: 0, max: 0 };
        const prices = verticalChartData.map(d => d.y);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }, [verticalChartData]);

    // Group data by car
    const carGroups = useMemo(() => {
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
            min: Math.min(...data.map(d => d.y)),
            max: Math.max(...data.map(d => d.y))
        }));
    }, [verticalChartData]);

    // Group points by variant
    const variantLabelPositions = useMemo(() => {
        const variantMap = new Map<string, { x: number; y: number; name: string; variantId: string; carId: string }>();

        verticalChartData.forEach((point) => {
            const key = `${point.carId}-${point.fullData.variant_id}`;
            if (!variantMap.has(key)) {
                variantMap.set(key, {
                    x: point.x,
                    y: point.y,
                    name: point.variant_name,
                    variantId: point.fullData.variant_id,
                    carId: point.carId
                });
            } else {
                const existing = variantMap.get(key)!;
                if (point.y > existing.y) {
                    variantMap.set(key, {
                        x: point.x,
                        y: point.y,
                        name: point.variant_name,
                        variantId: point.fullData.variant_id,
                        carId: point.carId
                    });
                }
            }
        });

        return Array.from(variantMap.values());
    }, [verticalChartData]);

    const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(p);

    // Drag handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            const newOrder = [...orderedCars];
            const [draggedItem] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(dropIndex, 0, draggedItem);

            setOrderedCars(newOrder);
            if (onOrderChange) {
                onOrderChange(newOrder);
            }
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0]?.payload;
        if (!data) return null;

        return (
            <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs text-xs text-slate-800">
                <p className="font-bold mb-1 text-[10px] uppercase" style={{ color: data.carColor }}>
                    {data.carName}
                </p>
                <p className="font-bold mb-2">{data.variant_name}</p>
                <div className="space-y-1">
                    {data.fuel_type && (
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Fuel:</span>
                            <span className="font-semibold">{data.fuel_type}</span>
                        </div>
                    )}
                    {data.engine_type && (
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Engine:</span>
                            <span className="font-semibold">{data.engine_type}</span>
                        </div>
                    )}
                    {data.transmission_type && (
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Transmission:</span>
                            <span className="font-semibold">{data.transmission_type}</span>
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

    // Custom label for variants
    const renderCustomLabel = (props: any) => {
        const { x, y, payload } = props;
        if (!payload || !payload.variant_name || !payload.fullData) return null;

        const labelPos = variantLabelPositions.find(v =>
            v.variantId === payload.fullData.variant_id &&
            v.carId === payload.carId &&
            Math.abs(v.y - payload.y) < 1
        );

        if (!labelPos) return null;

        const textWidth = payload.variant_name.length * 6;

        return (
            <g>
                <rect
                    x={x + 18}
                    y={y - 8}
                    width={textWidth}
                    height={16}
                    fill="white"
                    fillOpacity={0.9}
                    rx={2}
                />
                <text
                    x={x + 20}
                    y={y}
                    fill="#0f172a"
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="start"
                    dominantBaseline="middle"
                >
                    {payload.variant_name}
                </text>
            </g>
        );
    };

    const numCars = orderedCars.length;
    const xDomain = [0, numCars + 1];

    return (
        <div className="w-full h-full flex flex-col">
            {/* Chart */}
            <div className="flex-1 relative">
                {/* Draggable overlays positioned on top of chart columns */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="relative w-full h-full">
                        {orderedCars.map((car, index) => {
                            const totalCars = orderedCars.length;
                            const leftPercent = ((index + 1) / (totalCars + 1)) * 100;

                            return (
                                <div
                                    key={car.carId}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`
                                        absolute pointer-events-auto cursor-move
                                        transition-all duration-200
                                        ${draggedIndex === index ? 'opacity-30' : 'opacity-0 hover:opacity-100'}
                                        ${dragOverIndex === index ? 'opacity-100' : ''}
                                    `}
                                    style={{
                                        left: `calc(${leftPercent}% - 60px)`,
                                        top: '20px',
                                        width: '120px',
                                        height: 'calc(100% - 40px)',
                                        backgroundColor: dragOverIndex === index
                                            ? car.color + '30'
                                            : car.color + '10',
                                        border: dragOverIndex === index
                                            ? `3px dashed ${car.color}`
                                            : `2px dashed ${car.color}`,
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-2 px-2 py-3 bg-white rounded-lg shadow-lg"
                                            style={{ border: `2px solid ${car.color}` }}>
                                            <GripVertical size={20} style={{ color: car.color }} />
                                            <span className="font-bold text-xs text-center" style={{ color: car.color }}>
                                                {car.carName}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 250, left: 60, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            domain={xDomain}
                            ticks={orderedCars.map((_, i) => i + 1)}
                            tickFormatter={(value) => {
                                const carData = orderedCars[value - 1];
                                return carData ? carData.carName : '';
                            }}
                            tick={{ fontSize: 12, fontWeight: 'bold' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            domain={[priceRange.min * 0.95, priceRange.max * 1.05]}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(val) => formatPriceShort(val)}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {carGroups.map((group, index) => (
                            <React.Fragment key={group.carId}>
                                <ReferenceArea
                                    x1={index + 0.7}
                                    x2={index + 1.3}
                                    y1={group.min}
                                    y2={group.max}
                                    fill={group.carColor}
                                    fillOpacity={0.1}
                                    stroke={group.carColor}
                                    strokeOpacity={0.3}
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    {...({} as any)}
                                />
                            </React.Fragment>
                        ))}

                        <Scatter
                            data={verticalChartData}
                            fill="none"
                            label={renderCustomLabel}
                            shape="circle"
                        >
                            {verticalChartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill="white"
                                    stroke={entry.carColor}
                                    strokeWidth={2}
                                    cursor="pointer"
                                    onClick={() => onPricingClick && onPricingClick(entry.fullData)}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DraggableChartView;