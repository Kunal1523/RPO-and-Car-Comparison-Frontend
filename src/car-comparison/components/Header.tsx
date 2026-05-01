// src/components/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, GitCompare, ArrowLeft, Layers, ChevronRight } from 'lucide-react';
import logo from '../Images/amlgolabslogowhite.png';
import FeedbackButton from '../../shared/FeedbackButton';

interface HeaderProps {
  currentPage?: 'comparison' | 'pricing' | 'stackup';
  onPageChange?: (page: 'comparison' | 'pricing' | 'stackup') => void;
}

const NAV_TABS = [
  { key: 'comparison' as const, label: 'Feature Comparison',  Icon: GitCompare },
  { key: 'pricing'    as const, label: 'Pricing Comparison',  Icon: BarChart3  },
  { key: 'stackup'   as const, label: 'Feature Stack-Up',     Icon: Layers     },
];

const Header: React.FC<HeaderProps> = ({ currentPage = 'comparison', onPageChange }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('manualLoginUser');
    window.location.reload();
  };

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #0f1f6e 0%, #1a3aad 60%, #1e47c8 100%)',
        boxShadow: '0 4px 24px rgba(15,31,110,0.35)',
      }}
      className="sticky top-0 z-30"
    >
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 h-[58px]">

        {/* LEFT: Back + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/select')}
            title="Back to Project Selection"
            className="group flex items-center justify-center w-8 h-8 rounded-full
                       bg-white/10 hover:bg-white/20 border border-white/20
                       text-white/70 hover:text-white transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </button>

          <button
            onClick={() => navigate('/select')}
            className="bg-white rounded-xl px-3 py-1.5 shadow-md flex items-center
                       justify-center hover:shadow-lg transition-shadow duration-200"
          >
            <div className="h-8 w-28 overflow-hidden flex items-center justify-center">
              <img src={logo} alt="AMLGO Labs" className="w-full object-contain" />
            </div>
          </button>
        </div>

        {/* CENTER: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-base md:text-lg font-bold text-white tracking-tight leading-none">
            Automobile Comparison Platform
          </h1>
          <p className="text-[10px] text-blue-200/80 mt-0.5 tracking-wide">
            Compare variants side-by-side in seconds
          </p>
        </div>

        {/* RIGHT: Feedback + Logout */}
        <div className="flex items-center gap-3">
          <FeedbackButton variant="header" />
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg
                       bg-white/10 hover:bg-white/20 text-white
                       border border-white/20 hover:border-white/40
                       transition-all duration-200 backdrop-blur-sm"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* ── NAV TABS ── */}
      {onPageChange && (
        <div
          className="flex items-center justify-between px-5 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.18)' }}
        >
          {/* Tabs */}
          <div className="flex items-center gap-0.5">
            {NAV_TABS.map(({ key, label, Icon }) => {
              const active = currentPage === key;
              return (
                <button
                  key={key}
                  onClick={() => onPageChange(key)}
                  className={`
                    relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                    transition-all duration-200 focus:outline-none
                    ${active
                      ? 'text-white'
                      : 'text-blue-200/70 hover:text-white/90'
                    }
                  `}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-blue-300/70'} />
                  {label}

                  {/* Active underline indicator */}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                      style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right slot (for injected controls) */}
          <div id="header-action-bar" className="flex items-center gap-3" />
        </div>
      )}
    </header>
  );
};

export default Header;
