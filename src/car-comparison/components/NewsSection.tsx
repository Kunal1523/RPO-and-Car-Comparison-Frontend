import React from 'react';
import { Newspaper, ExternalLink, Calendar, Building2 } from 'lucide-react';

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

interface NewsSectionProps {
  news1: NewsData | null;
  news2: NewsData | null;
  isLoading: boolean;
}

const NewsSection: React.FC<NewsSectionProps> = ({ news1, news2, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-8 bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mr-4"></div>
          <p className="text-slate-600 font-medium">Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (!news1 && !news2) {
    return null;
  }

  const renderNewsCard = (newsData: NewsData | null, color: 'blue' | 'emerald') => {
    if (!newsData || newsData.top5_news.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <Newspaper size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No news available</p>
        </div>
      );
    }

    const colorClasses = {
      blue: {
        header: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        hover: 'hover:border-blue-300',
        icon: 'text-blue-600'
      },
      emerald: {
        header: 'bg-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        hover: 'hover:border-emerald-300',
        icon: 'text-emerald-600'
      }
    };

    const colors = colorClasses[color];

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`${colors.header} text-white p-4`}>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper size={20} />
            <h3 className="font-bold text-lg">Latest News</h3>
          </div>
          <p className="text-sm opacity-90">{newsData.car}</p>
        </div>

        {/* News List */}
        <div className="divide-y divide-slate-100">
          {newsData.top5_news.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-4 transition-all ${colors.hover} hover:bg-slate-50 group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h4>
                  
                  {article.description && (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {article.source && (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} />
                        <span className="font-medium">{article.source.name}</span>
                      </div>
                    )}
                    
                    {article.published && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(article.published).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <ExternalLink 
                  size={16} 
                  className={`${colors.icon} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1`}
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Newspaper className="text-blue-600" size={28} />
          Latest News & Updates
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Recent articles and reviews about the selected models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderNewsCard(news1, 'blue')}
        {renderNewsCard(news2, 'emerald')}
      </div>
    </div>
  );
};

export default NewsSection;