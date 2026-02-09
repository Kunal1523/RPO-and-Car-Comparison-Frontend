// src/components/NewsButtonCards.tsx
import React, { useState } from 'react';
import { Newspaper, ExternalLink, Calendar, Building2, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface NewsButtonCardsProps {
  news1: NewsData | null;
  news2: NewsData | null;
  isLoading: boolean;
}

const NewsButtonCards: React.FC<NewsButtonCardsProps> = ({ news1, news2, isLoading }) => {
  const [openCard, setOpenCard] = useState<1 | 2 | null>(null);

  if (isLoading) {
    // Compact loading state
    return (
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
          <Newspaper className="text-blue-600" size={16} />
          Latest News
        </h3>
        <div className="flex gap-2 flex-1">
          <button
            disabled
            className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-1.5 flex items-center justify-center gap-2 opacity-60"
          >
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-xs font-medium text-blue-700">Loading...</span>
          </button>
          <button
            disabled
            className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 flex items-center justify-center gap-2 opacity-60"
          >
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-500 border-t-transparent"></div>
            <span className="text-xs font-medium text-emerald-700">Loading...</span>
          </button>
        </div>
      </div>
    );
  }

  if (!news1 && !news2) {
    return null;
  }

  const renderButton = (newsData: NewsData | null, vehicleNum: 1 | 2) => {
    if (!newsData || newsData.top5_news.length === 0) {
      return null;
    }

    const isOpen = openCard === vehicleNum;
    const colors = vehicleNum === 1
      ? {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        borderHover: 'hover:border-blue-400',
        text: 'text-blue-700',
        icon: 'text-blue-600',
        badge: 'bg-blue-500',
        cardBg: 'bg-blue-600',
      }
      : {
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        borderHover: 'hover:border-emerald-400',
        text: 'text-emerald-700',
        icon: 'text-emerald-600',
        badge: 'bg-emerald-500',
        cardBg: 'bg-emerald-600',
      };

    return (
      <>
        <button
          onClick={() => setOpenCard(isOpen ? null : vehicleNum)}
          className={`flex-1 ${colors.bg} border ${colors.border} ${colors.borderHover} rounded-lg p-1.5 
            flex items-center justify-between gap-2 transition-all hover:shadow-sm group relative overflow-hidden min-w-0`}
        >
          {/* Animated background pulse */}
          <div className={`absolute inset-0 ${colors.badge} opacity-0 group-hover:opacity-5 transition-opacity`}></div>

          <div className="flex items-center gap-2 relative z-10 min-w-0">
            <div className={`${colors.badge} rounded-md p-1 relative flex-shrink-0`}>
              <Newspaper size={14} className="text-white" />
              {/* News count badge */}
            </div>
            <div className="text-left min-w-0">
              <div className="text-[10px] text-slate-600 font-bold truncate">
                {newsData.car} <span className="font-normal opacity-80">({newsData.total})</span>
              </div>
            </div>
          </div>

          <ChevronDown
            size={14}
            className={`${colors.icon} transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Floating News Card */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpenCard(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />

              {/* News Card Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                className="fixed top-[20%] left-[50%] -translate-x-[50%] -translate-y-[50%]
                  w-[95%] max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 
                  overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className={`${colors.cardBg} text-white p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <Newspaper size={20} />
                    <div>
                      <h3 className="font-bold text-base">Latest News & Updates</h3>
                      <p className="text-xs opacity-90">{newsData.car}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenCard(null)}
                    className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* News List - Scrollable */}
                <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                  {newsData.top5_news.map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 hover:bg-slate-50 transition-colors group"
                      onClick={() => setOpenCard(null)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Article number badge */}
                          <div className="flex items-start gap-3 mb-1">
                            <span className={`${colors.badge} text-white text-[10px] font-bold rounded-full w-5 h-5 
                              flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              {idx + 1}
                            </span>
                            <h4 className="font-semibold text-slate-900 text-sm leading-snug 
                              group-hover:text-blue-600 transition-colors">
                              {article.title}
                            </h4>
                          </div>

                          {article.description && (
                            <p className="text-xs text-slate-600 mb-2 line-clamp-2 ml-8">
                              {article.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 ml-8">
                            {article.source && (
                              <div className="flex items-center gap-1">
                                <Building2 size={10} />
                                <span className="font-medium">{article.source.name}</span>
                              </div>
                            )}

                            {article.published && (
                              <div className="flex items-center gap-1">
                                <Calendar size={10} />
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
                          size={14}
                          className={`${colors.icon} opacity-0 group-hover:opacity-100 
                            transition-opacity flex-shrink-0 mt-1`}
                        />
                      </div>
                    </a>
                  ))}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
                  <p className="text-[10px] text-slate-600 text-center">
                    Click on any article to read the full story
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  };

  return (
    // Removed mb-6
    <div className="">
      {/* ✅ NEW: Horizontal Single Line Layout */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
          <Newspaper className="text-blue-600" size={16} />
          Latest News
        </h3>

        {/* News Buttons - Horizontal Layout */}
        <div className="flex gap-2 flex-1">
          {renderButton(news1, 1)}
          {renderButton(news2, 2)}
        </div>
      </div>
    </div>
  );
};

export default NewsButtonCards;