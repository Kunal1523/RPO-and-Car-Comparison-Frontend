// // src/components/Header.tsx
// import React from 'react';
// import { LogOut } from 'lucide-react';
// import logo from '../Images/amlgolabslogowhite.png';

// const Header: React.FC = () => {
//   const handleLogout = () => {
//     sessionStorage.removeItem('isLoggedIn');
//     window.location.reload();
//   };

//   return (
//     <header className="bg-blue-900 border-b border-slate-200 h-16 
//       grid grid-cols-3 items-center px-4 md:px-8 sticky top-0 z-30 shadow-xl">

//       {/* LEFT: LOGO */}
//       <div className="flex items-center gap-3">
//         <div className="bg-white rounded-xl px-3 py-1 shadow flex items-center justify-center">
//           <div className="h-10 w-32 overflow-hidden flex items-center justify-center">
//             <img
//               src={logo}
//               alt="Logo"
//               className="w-full object-cover object-center"
//             />
//           </div>
//         </div>
//       </div>

//       {/* CENTER: TITLE */}
//       <div className="text-center">
//         <h1 className="text-lg md:text-xl font-bold text-white">
//           Automobile Comparison Platform
//         </h1>
//         <span className="text-xs text-white">
//           Compare variants side-by-side in seconds
//         </span>
//       </div>

//       {/* RIGHT: LOGOUT */}
//       <div className="flex justify-end">
//         <button
//           onClick={handleLogout}
//           className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg 
//             bg-white hover:bg-slate-50 text-slate-700 hover:text-red-600
//             border border-slate-300 hover:border-red-400
//             transition-all duration-200 shadow-sm hover:shadow-md
//             active:scale-95"
//         >
//           <LogOut size={18} />
//           <span className="hidden sm:inline">Logout</span>
//         </button>
//       </div>

//     </header>
//   );
// };

// export default Header;


// src/components/Header.tsx
import React from 'react';
import { LogOut, BarChart3, GitCompare } from 'lucide-react';
import logo from '../Images/amlgolabslogowhite.png';

interface HeaderProps {
  currentPage?: 'comparison' | 'pricing';
  onPageChange?: (page: 'comparison' | 'pricing') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage = 'comparison', onPageChange }) => {
  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    window.location.reload();
  };

  return (
    <>
      {/* MAIN HEADER */}
      <header className="bg-blue-900 border-b border-slate-200 h-16 
        flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-xl">

        {/* LEFT LOGO */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl px-3 py-1 shadow flex items-center justify-center">
            <div className="h-10 w-32 overflow-hidden flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full object-cover object-center" />
            </div>
          </div>
        </div>

        {/* CENTER TITLE */}
        <h1 className="text-lg md:text-xl font-bold text-white">
          Automobile Comparison Platform
        </h1>

        {/* RIGHT LOGOUT */}
        <div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg 
              bg-white hover:bg-slate-50 text-slate-700 hover:text-red-600
              border border-slate-300 hover:border-red-400 transition-all shadow-sm"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 🔹 SUB-NAVIGATION BAR BELOW HEADER */}
      {onPageChange && (
        <div className="bg-blue-800/30 border-b border-blue-200 px-6 py-2 flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={() => onPageChange('comparison')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${currentPage === 'comparison'
                  ? 'bg-blue-900 text-white shadow'
                  : 'bg-white text-blue-900 hover:bg-blue-100'
                }`}
            >
              <GitCompare size={16} />
              Feature Comparison
            </button>

            <button
              onClick={() => onPageChange('pricing')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${currentPage === 'pricing'
                  ? 'bg-blue-900 text-white shadow'
                  : 'bg-white text-blue-900 hover:bg-blue-100'
                }`}
            >
              <BarChart3 size={16} />
              Pricing Comparison
            </button>
          </div>
          <div id="header-action-bar" className="flex items-center gap-3"></div>
        </div>
      )}
    </>
  );
};

export default Header;
