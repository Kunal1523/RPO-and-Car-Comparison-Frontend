import React from 'react';
import { Newspaper, ExternalLink, Calendar, Building2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { NewsResponse } from '../types'; // Import from types

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: {
    name: string;
    icon?: string;
  };
  published: string;
}

interface NewsData {
  car: string;
  total: number;
  top5_news: NewsArticle[];
}

interface RightNewsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  news1: NewsResponse | null;
  news2: NewsResponse | null;
  isLoading: boolean;
}

const RightNewsSidebar: React.FC<RightNewsSidebarProps> = ({
  isOpen,
  onClose,
  news1,
  news2,
  isLoading,
}) => {
  if (!isOpen) return null;

  const renderNewsSection = (newsData: NewsData | null, colorTheme: 'blue' | 'emerald') => {
    if (!newsData || !newsData.top5_news || newsData.top5_news.length === 0) return null;

    const theme = colorTheme === 'blue'
      ? {
          badge: 'bg-blue-500',
          text: 'text-blue-600',
          cardHover: 'hover:border-blue-300 hover:bg-blue-50/30',
          headingBg: 'bg-gradient-to-r from-blue-50 to-indigo-50/30 border-blue-100',
          iconBg: 'bg-blue-100 text-blue-700',
        }
      : {
          badge: 'bg-emerald-500',
          text: 'text-emerald-600',
          cardHover: 'hover:border-emerald-300 hover:bg-emerald-50/30',
          headingBg: 'bg-gradient-to-r from-emerald-50 to-teal-50/30 border-emerald-100',
          iconBg: 'bg-emerald-100 text-emerald-700',
        };

    return (
      <div className="space-y-3">
        {/* Car Header */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl border ${theme.headingBg}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${theme.iconBg}`}>
              <Newspaper size={14} />
            </div>
            <span className="font-bold text-xs text-slate-800 truncate">{newsData.car}</span>
          </div>
          <span className={`${theme.badge} text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shrink-0`}>
            {newsData.total} Articles
          </span>
        </div>

        {/* Article Cards */}
        <div className="space-y-2">
          {newsData.top5_news.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-3 bg-white border border-slate-100 rounded-xl transition-all duration-200 shadow-sm ${theme.cardHover} group`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className={`${theme.badge} text-white text-[9px] font-black rounded-full w-4.5 h-4.5 shrink-0 flex items-center justify-center`}>
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                  </div>

                  {article.description && (
                    <p className="text-[10px] text-slate-500 mb-2 line-clamp-2 ml-7">
                      {article.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3.5 text-[9px] text-slate-400 ml-7">
                    {article.source && (
                      <div className="flex items-center gap-1">
                        <Building2 size={9} />
                        <span className="font-semibold text-slate-500">{article.source.name}</span>
                      </div>
                    )}
                    {article.published && (
                      <div className="flex items-center gap-1">
                        <Calendar size={9} />
                        <span>
                          {new Date(article.published).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ExternalLink
                  size={12}
                  className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ x: 384, opacity: 0.8 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 384, opacity: 0.8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="w-80 md:w-96 shrink-0 h-full bg-slate-50 border-l border-slate-200 flex flex-col shadow-2xl relative z-40 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-blue-400" />
          <h3 className="font-black text-sm tracking-tight">Latest Automotive News</h3>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/10 active:bg-white/20 p-1.5 rounded-lg transition-colors text-slate-300 hover:text-white"
          title="Close News"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
            <p className="text-xs text-slate-500 font-bold animate-pulse">Fetching latest updates...</p>
          </div>
        ) : !news1 && !news2 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Newspaper className="text-slate-300 mb-2" size={32} />
            <p className="text-xs text-slate-500 font-semibold">No news available for the selected models.</p>
          </div>
        ) : (
          <>
            {renderNewsSection(news1, 'blue')}
            {renderNewsSection(news2, 'emerald')}
          </>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0 text-center text-[10px] text-slate-400 font-semibold shadow-inner">
        Articles auto-refreshed upon vehicle change
      </div>
    </motion.div>
  );
};

export default RightNewsSidebar;
