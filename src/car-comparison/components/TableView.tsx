// import React from 'react';

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

// interface TableViewProps {
//   rawPricing: PricingPoint[];
//   formatPrice: (price: number) => string;
//   onPricingClick: (pricing: PricingPoint) => void;
// }

// const TableView: React.FC<TableViewProps> = ({ rawPricing, formatPrice, onPricingClick }) => {
//   // Sort by price
//   const sortedPricing = [...rawPricing].sort((a, b) => a.ex_showroom_price - b.ex_showroom_price);

//   return (
//     <div className="flex-1 overflow-auto min-h-0 pb-20">
//       <table className="w-full text-sm">
//         <thead className="sticky top-0 bg-slate-100 border-b z-10">
//           <tr>
//             <th className="p-2.5 text-left text-xs font-semibold text-slate-700">Variant</th>
//             <th className="p-2.5 text-left text-xs font-semibold text-slate-700">Fuel</th>
//             <th className="p-2.5 text-left text-xs font-semibold text-slate-700">Engine</th>
//             <th className="p-2.5 text-left text-xs font-semibold text-slate-700">Transmission</th>
//             <th className="p-2.5 text-right text-xs font-semibold text-slate-700">Price</th>
//           </tr>
//         </thead>
//         <tbody>
//           {sortedPricing.map((p) => (
//             <tr
//               key={p.pricing_id}
//               className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
//               onClick={() => onPricingClick(p)}
//             >
//               <td className="p-2.5 text-slate-800 text-xs font-medium">{p.variant_name}</td>
//               <td className="p-2.5 text-slate-600 text-xs">{p.fuel_type || '-'}</td>
//               <td className="p-2.5 text-slate-600 text-xs">{p.engine_type || '-'}</td>
//               <td className="p-2.5 text-slate-600 text-xs">{p.transmission_type || '-'}</td>
//               <td className="p-2.5 text-right font-semibold text-slate-900 text-xs">
//                 {formatPrice(p.ex_showroom_price)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       {sortedPricing.length === 0 && (
//         <div className="text-center py-12 text-slate-400">
//           <p className="text-sm">No pricing data matches the current filters</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TableView;

import React from 'react';

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

interface TableViewProps {
  rawPricing: PricingPoint[];
  formatPrice: (price: number) => string;
  onPricingClick: (pricing: PricingPoint) => void;
}

const TableView: React.FC<TableViewProps> = ({ rawPricing, formatPrice, onPricingClick }) => {
  // Sort by price
  const sortedPricing = [...rawPricing].sort((a, b) => a.ex_showroom_price - b.ex_showroom_price);

  return (
    <div className="flex-1 overflow-auto min-h-0 pb-20">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-100 border-b z-10">
          <tr>
            <th className="p-2 text-left text-[10px] font-semibold text-slate-700">Variant</th>
            <th className="p-2 text-left text-[10px] font-semibold text-slate-700">Fuel</th>
            <th className="p-2 text-left text-[10px] font-semibold text-slate-700">Engine</th>
            <th className="p-2 text-left text-[10px] font-semibold text-slate-700">Transmission</th>
            <th className="p-2 text-left text-[10px] font-semibold text-slate-700">Paint</th>
            <th className="p-2 text-left text-[10px] font-semibold text-slate-700">Edition</th>
            <th className="p-2 text-right text-[10px] font-semibold text-slate-700">Price</th>
          </tr>
        </thead>
        <tbody>
          {sortedPricing.map((p) => (
            <tr
              key={p.pricing_id}
              className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => onPricingClick(p)}
            >
              <td className="p-2 text-slate-800 text-[10px] font-medium">{p.variant_name}</td>
              <td className="p-2 text-slate-600 text-[10px]">{p.fuel_type || '-'}</td>
              <td className="p-2 text-slate-600 text-[10px]">{p.engine_type || '-'}</td>
              <td className="p-2 text-slate-600 text-[10px]">{p.transmission_type || '-'}</td>
              <td className="p-2 text-slate-600 text-[10px]">{p.paint_type || '-'}</td>
              <td className="p-2 text-slate-600 text-[10px]">{p.edition || '-'}</td>
              <td className="p-2 text-right font-semibold text-slate-900 text-[10px]">
                {formatPrice(p.ex_showroom_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedPricing.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No pricing data matches the current filters</p>
        </div>
      )}
    </div>
  );
};

export default TableView;