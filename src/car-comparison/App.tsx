// // src/App.tsx
// import React, { useState, useEffect, useMemo } from 'react';
// import Header from './components/Header';
// import Sidebar from './components/Sidebar';
// import ComparisonTable from './components/ComparisonTable';
// import NewsButtonCards from './components/NewsButtonCards';
// import LoginPage from './components/LoginPage';
// import { ComparisonResponse, SelectionState, NewsResponse } from './types';
// import { fetchComparisonDetails, fetchCarNews } from './services/api';

// const App: React.FC = () => {
//   // Auth state
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   // Check if user is already logged in (session storage)
//   useEffect(() => {
//     const loggedIn = sessionStorage.getItem('isLoggedIn');
//     if (loggedIn === 'true') {
//       setIsAuthenticated(true);
//     }
//   }, []);

//   const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   // News state (kept as 2 cards for top 2 vehicles only – least-change)
//   const [news1, setNews1] = useState<NewsResponse | null>(null);
//   const [news2, setNews2] = useState<NewsResponse | null>(null);
//   const [isLoadingNews, setIsLoadingNews] = useState(false);

//   // ✅ Track current selections as an ARRAY now
//   const [currentSelections, setCurrentSelections] = useState<SelectionState[]>([]);

//   // ✅ take first 2 selections for news (least-change)
//   const selForNews1 = useMemo(() => currentSelections[0] || null, [currentSelections]);
//   const selForNews2 = useMemo(() => currentSelections[1] || null, [currentSelections]);

//   // Fetch news whenever models are selected (not variants)
//   useEffect(() => {
//     const fetchNews = async () => {
//       if (!selForNews1?.model || !selForNews2?.model) {
//         setNews1(null);
//         setNews2(null);
//         return;
//       }

//       setIsLoadingNews(true);
//       try {
//         const [newsData1, newsData2] = await Promise.all([
//           fetchCarNews(selForNews1.model),
//           fetchCarNews(selForNews2.model),
//         ]);

//         setNews1(newsData1);
//         setNews2(newsData2);
//       } catch (error) {
//         console.error('Error fetching news:', error);
//         setNews1(null);
//         setNews2(null);
//       } finally {
//         setIsLoadingNews(false);
//       }
//     };

//     fetchNews();
//   }, [selForNews1?.model, selForNews2?.model]);

//   // ✅ Sidebar now calls handleCompare(selections[])
//   // ✅ Backend still compares ONLY 2 cars -> we compare first two (least-change)
//   const handleCompare = async (selections: SelectionState[]) => {
//     setCurrentSelections(selections);

//     if (!selections || selections.length < 2) {
//       alert('Please select at least 2 vehicles to compare.');
//       return;
//     }

//     const sel1 = selections[0];
//     const sel2 = selections[1];

//     // ✅ Version is compulsory now
//     if (!sel1.brand || !sel1.model || !sel1.version || !sel1.variant) {
//       alert('Please select Brand, Car, Version and Variant for Vehicle 1.');
//       return;
//     }
//     if (!sel2.brand || !sel2.model || !sel2.version || !sel2.variant) {
//       alert('Please select Brand, Car, Version and Variant for Vehicle 2.');
//       return;
//     }

//     setIsLoading(true);
//     setComparisonData(null);

//     try {
//       const data = await fetchComparisonDetails(sel1, sel2);
//       setComparisonData(data);
//     } catch (error) {
//       console.error('Error fetching comparison details:', error);
//       alert('Failed to fetch comparison details. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLoginSuccess = () => {
//     setIsAuthenticated(true);
//   };

//   // Show login page if not authenticated
//   if (!isAuthenticated) {
//     return <LoginPage onLoginSuccess={handleLoginSuccess} />;
//   }

//   // Show dashboard if authenticated
//   return (
//     <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
//       <Header />
//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar onCompare={handleCompare} isLoading={isLoading} />
//         <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 relative">
//           <div className="max-w-6xl mx-auto pb-10">
//             {/* News Buttons - Top of page */}
//             <NewsButtonCards news1={news1} news2={news2} isLoading={isLoadingNews} />

//             <div className="mb-4 md:mb-6">
//               <h2 className="text-2xl font-bold text-slate-900">Comparison Result</h2>
//               <p className="text-sm text-slate-500">Detailed breakdown of features and specifications.</p>
//             </div>

//             {isLoading && (
//               <div className="absolute inset-0 bg-sky-50/70 backdrop-blur-sm z-20 flex items-center justify-center">
//                 <div className="flex flex-col items-center">
//                   <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
//                   <p className="text-blue-700 font-semibold text-sm">Fetching comparison data...</p>
//                 </div>
//               </div>
//             )}

//             <ComparisonTable data={comparisonData} />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default App;


// src/App.tsx
// import React, { useState, useEffect, useMemo } from 'react';
// import Header from './components/Header';
// import Sidebar from './components/Sidebar';
// import ComparisonTable from './components/ComparisonTable';
// import NewsButtonCards from './components/NewsButtonCards';
// import LoginPage from './components/LoginPage';
// import PricingComparisonPage from './components/PricingComparisonPage';
// import { ComparisonResponse, SelectionState, NewsResponse } from './types';
// import { fetchComparisonDetails, fetchCarNews } from './services/api';

// type PageView = 'comparison' | 'pricing';

// const App: React.FC = () => {
//   // Auth state
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
  
//   // Page navigation state
//   const [currentPage, setCurrentPage] = useState<PageView>('comparison');

//   // Check if user is already logged in (session storage)
//   useEffect(() => {
//     const loggedIn = sessionStorage.getItem('isLoggedIn');
//     if (loggedIn === 'true') {
//       setIsAuthenticated(true);
//     }
//   }, []);

//   const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   // News state (kept as 2 cards for top 2 vehicles only – least-change)
//   const [news1, setNews1] = useState<NewsResponse | null>(null);
//   const [news2, setNews2] = useState<NewsResponse | null>(null);
//   const [isLoadingNews, setIsLoadingNews] = useState(false);

//   // Track current selections as an ARRAY now
//   const [currentSelections, setCurrentSelections] = useState<SelectionState[]>([]);

//   // Take first 2 selections for news (least-change)
//   const selForNews1 = useMemo(() => currentSelections[0] || null, [currentSelections]);
//   const selForNews2 = useMemo(() => currentSelections[1] || null, [currentSelections]);

//   // Fetch news whenever models are selected (not variants)
//   useEffect(() => {
//     const fetchNews = async () => {
//       if (!selForNews1?.model || !selForNews2?.model) {
//         setNews1(null);
//         setNews2(null);
//         return;
//       }

//       setIsLoadingNews(true);
//       try {
//         const [newsData1, newsData2] = await Promise.all([
//           fetchCarNews(selForNews1.model),
//           fetchCarNews(selForNews2.model),
//         ]);

//         setNews1(newsData1);
//         setNews2(newsData2);
//       } catch (error) {
//         console.error('Error fetching news:', error);
//         setNews1(null);
//         setNews2(null);
//       } finally {
//         setIsLoadingNews(false);
//       }
//     };

//     fetchNews();
//   }, [selForNews1?.model, selForNews2?.model]);

//   // Sidebar now calls handleCompare(selections[])
//   const handleCompare = async (selections: SelectionState[]) => {
//     setCurrentSelections(selections);

//     if (!selections || selections.length < 2) {
//       alert('Please select at least 2 vehicles to compare.');
//       return;
//     }

//     const sel1 = selections[0];
//     const sel2 = selections[1];

//     // Version is compulsory now
//     if (!sel1.brand || !sel1.model || !sel1.version || !sel1.variant) {
//       alert('Please select Brand, Car, Version and Variant for Vehicle 1.');
//       return;
//     }
//     if (!sel2.brand || !sel2.model || !sel2.version || !sel2.variant) {
//       alert('Please select Brand, Car, Version and Variant for Vehicle 2.');
//       return;
//     }

//     setIsLoading(true);
//     setComparisonData(null);

//     try {
//       const data = await fetchComparisonDetails(sel1, sel2);
//       setComparisonData(data);
//     } catch (error) {
//       console.error('Error fetching comparison details:', error);
//       alert('Failed to fetch comparison details. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLoginSuccess = () => {
//     setIsAuthenticated(true);
//   };

//   // Show login page if not authenticated
//   if (!isAuthenticated) {
//     return <LoginPage onLoginSuccess={handleLoginSuccess} />;
//   }

//   // Show pricing comparison page
//   if (currentPage === 'pricing') {
//     return (
//       <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
//         <Header currentPage={currentPage} onPageChange={setCurrentPage} />
//         <PricingComparisonPage />
//       </div>
//     );
//   }

//   // Show comparison dashboard if authenticated
//   return (
//     <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
//       <Header currentPage={currentPage} onPageChange={setCurrentPage} />
//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar onCompare={handleCompare} isLoading={isLoading} />
//         <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 relative">
//           <div className="max-w-6xl mx-auto pb-10">
//             {/* News Buttons - Top of page */}
//             <NewsButtonCards news1={news1} news2={news2} isLoading={isLoadingNews} />

//             <div className="mb-4 md:mb-6">
//               <h2 className="text-2xl font-bold text-slate-900">Comparison Result</h2>
//               <p className="text-sm text-slate-500">Detailed breakdown of features and specifications.</p>
//             </div>

//             {isLoading && (
//               <div className="absolute inset-0 bg-sky-50/70 backdrop-blur-sm z-20 flex items-center justify-center">
//                 <div className="flex flex-col items-center">
//                   <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
//                   <p className="text-blue-700 font-semibold text-sm">Fetching comparison data...</p>
//                 </div>
//               </div>
//             )}

//             <ComparisonTable data={comparisonData} />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default App;


// src/App.tsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ComparisonTable from './components/ComparisonTable';
import NewsButtonCards from './components/NewsButtonCards';
import LoginPage from './components/LoginPage';
import PricingComparisonPage from './components/PricingComparisonPage';
import { ComparisonResponse, SelectionState, NewsResponse } from './types';
import { fetchComparisonDetails, fetchCarNews } from './services/api';

type PageView = 'comparison' | 'pricing';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('comparison');

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [news1, setNews1] = useState<NewsResponse | null>(null);
  const [news2, setNews2] = useState<NewsResponse | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  const [currentSelections, setCurrentSelections] = useState<SelectionState[]>([]);

  // ✅ UPDATED: Fetch news only for unique car models
  useEffect(() => {
    const fetchNews = async () => {
      // Get unique car models from all selections
      const uniqueModels = Array.from(
        new Set(
          currentSelections
            .map(sel => sel.model)
            .filter((model): model is string => Boolean(model && model.trim() !== ''))
        )
      );

      // If no unique models, clear news
      if (uniqueModels.length === 0) {
        setNews1(null);
        setNews2(null);
        return;
      }

      setIsLoadingNews(true);
      try {
        // Fetch news only for unique models (max 2 for display)
        const newsPromises = uniqueModels.slice(0, 2).map((model: string) => fetchCarNews(model));
        const newsResults = await Promise.all(newsPromises);

        setNews1(newsResults[0] || null);
        setNews2(newsResults[1] || null);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews1(null);
        setNews2(null);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, [currentSelections]);

  // ✅ UPDATED: Now accepts array of selections (2-5 vehicles)
  const handleCompare = async (selections: SelectionState[]) => {
    setCurrentSelections(selections);

    if (!selections || selections.length < 2) {
      alert('Please select at least 2 vehicles to compare.');
      return;
    }

    // Validate all selections
    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i];
      if (!sel.brand || !sel.model || !sel.version || !sel.variant) {
        alert(`Please complete all fields for Vehicle ${i + 1}.`);
        return;
      }
      if (!sel.variant_id) {
        alert(`Missing variant ID for Vehicle ${i + 1}. Please reselect the variant.`);
        return;
      }
    }

    setIsLoading(true);
    setComparisonData(null);

    try {
      // ✅ NEW: Pass entire selections array to API
      const data = await fetchComparisonDetails(selections);
      setComparisonData(data);
    } catch (error) {
      console.error('Error fetching comparison details:', error);
      alert('Failed to fetch comparison details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'pricing') {
    return (
      <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
        <Header currentPage={currentPage} onPageChange={setCurrentPage} />
        <PricingComparisonPage />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onCompare={handleCompare} isLoading={isLoading} />
        <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10 relative">
          <div className="max-w-6xl mx-auto pb-10">
            <NewsButtonCards news1={news1} news2={news2} isLoading={isLoadingNews} />

            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Comparison Result</h2>
              <p className="text-sm text-slate-500">
                Detailed breakdown of features and specifications for {currentSelections.length} vehicles.
              </p>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-sky-50/70 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-blue-700 font-semibold text-sm">Fetching comparison data...</p>
                </div>
              </div>
            )}

            <ComparisonTable data={comparisonData} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;