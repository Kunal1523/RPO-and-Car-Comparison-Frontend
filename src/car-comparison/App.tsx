import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ComparisonTable from './components/ComparisonTable';
import RightNewsSidebar from './components/RightNewsSidebar';
import LoginPage from './components/LoginPage';
import { Newspaper } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PricingComparisonPage from './components/PricingComparisonPage';
import FeatureStackUpPage from './components/FeatureStackUpPage';
import ChatbotDashboardPage from './components/ChatbotDashboardPage';
import { ComparisonResponse, SelectionState, NewsResponse } from './types';
import {
  fetchComparisonDetails,
  fetchCarNews,
  createModelPlan,
  fetchModelPlanById,
  updatePlanFeature,
  addPlanFeature,
  deletePlanFeature
} from './services/api';

type PageView = 'comparison' | 'pricing' | 'stackup' | 'chatbot';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('comparison');
  const [isNewsSidebarOpen, setIsNewsSidebarOpen] = useState(false);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('isLoggedIn');
    const manualUser = sessionStorage.getItem('manualLoginUser');
    if (loggedIn === 'true' || manualUser) {
      setIsAuthenticated(true);
    }
  }, []);

  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [news1, setNews1] = useState<NewsResponse | null>(null);
  const [news2, setNews2] = useState<NewsResponse | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  const [currentSelections, setCurrentSelections] = useState<SelectionState[]>([
    { brand: 'Hyundai', model: 'Creta', version: 'v1', variant: 'E' },
    { brand: 'Maruti', model: 'Grand Vitara', version: 'v1', variant: 'Sigma' },
    { brand: 'Maruti', model: 'Grand Vitara', version: 'v1', variant: 'Delta' },
  ]);

  // Track the variant IDs currently shown in comparisonData
  const lastFetchedVariantIds = React.useRef<string[]>([]);
  const [sidebarKey, setSidebarKey] = useState(0);

  // ✅ Instant Updates Logic: Reflect sidebar changes (reorder/remove) in the table immediately
  useEffect(() => {
    if (!comparisonData || currentSelections.length === 0 || isLoading) return;

    const newIds = currentSelections.map(s => s.plan_id || s.variant).filter(Boolean) as string[];
    const oldIds = lastFetchedVariantIds.current;

    if (newIds.length === 0) return;

    // Detect if we can update locally (reorder or removal)
    const isSubset = newIds.length < oldIds.length && newIds.every(id => oldIds.includes(id));
    const isPermutation = newIds.length === oldIds.length &&
      newIds.every(id => oldIds.includes(id)) &&
      oldIds.some((id, i) => id !== newIds[i]);

    if (isSubset || isPermutation) {
      const newColumns = ['Feature'];
      let mappingFound = true;

      newIds.forEach(id => {
        const oldIdx = oldIds.indexOf(id);
        if (oldIdx !== -1) {
          newColumns.push(comparisonData.columns[oldIdx + 1]);
        } else {
          mappingFound = false;
        }
      });

      if (mappingFound && newColumns.length === newIds.length + 1) {
        setComparisonData(prev => prev ? { ...prev, columns: newColumns } : null);
        lastFetchedVariantIds.current = newIds;
      }
    }
  }, [currentSelections, comparisonData, isLoading]);

  // ✅ UPDATED: Fetch news only for unique car models
  useEffect(() => {
    const fetchNews = async () => {
      // Get unique car models from all selections
      const uniqueModels = Array.from(
        new Set(
          currentSelections
            .map(sel => sel.brand === 'CUSTOM_PLAN' ? null : sel.model)
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
    }

    setIsLoading(true);
    setComparisonData(null);

    try {
      const data = await fetchComparisonDetails(selections);
      setComparisonData(data);
      lastFetchedVariantIds.current = selections.map(s => s.plan_id || s.variant).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching comparison details:', error);
      alert('Failed to fetch comparison details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshComparison = async () => {
    try {
      const data = await fetchComparisonDetails(currentSelections);
      setComparisonData(data);
    } catch (error) {
      console.error('Failed to refresh comparison:', error);
    }
  };

  // ✅ NEW: Plan Management Handlers
  const handlePlanNewModel = async (variantName: string) => {
    const baseSelection = currentSelections.find(s => s.variant === variantName);
    if (!baseSelection) return;

    const planName = `New ${variantName}`;
    setIsLoading(true);
    try {
      const plan = await createModelPlan(planName, variantName, 1);
      const baseIdx = currentSelections.findIndex(s => s.variant === variantName);
      const newSelections = [...currentSelections];
      newSelections.splice(baseIdx + 1, 0, {
        ...baseSelection,
        brand: 'CUSTOM_PLAN',
        model: planName,
        variant: planName,
        plan_id: plan.plan_id,
        version: 'plan',
        variant_id: ''
      });
      setSidebarKey(prev => prev + 1);
      await handleCompare(newSelections);
    } catch (err) {
      console.error('Failed to create plan:', err);
      alert('Error creating plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlanFeature = async (planId: string, featureName: string, category: string, updates: { value?: string, cost_delta?: number, price_delta?: number, is_deleted?: boolean }) => {
    try {
      // Find the specific feature in the comparison data to get its plan_feature_id
      const featureRow = comparisonData?.data.find(row =>
        row.feature === featureName && row.category === category
      );
      if (!featureRow) {
        console.error("Feature row not found for", featureName, category);
        return;
      }

      // Get the correct variant name (column name) for this plan
      const selection = currentSelections.find(s => s.plan_id === planId);
      if (!selection) {
        console.error("Selection not found for plan", planId);
        return;
      }

      const planFeatureId = featureRow.plan_feature_ids?.[selection.variant];
      if (!planFeatureId) {
        console.error("Plan feature ID not found for", featureName, "in variant", selection.variant);
        return;
      }

      await updatePlanFeature(planId, planFeatureId, updates);
      await refreshComparison();
    } catch (error) {
      console.error("Failed to update plan feature:", error);
    }
  };

  const handleAddPlanFeature = async (planId: string, feature: { feature_name: string, category: string, value: string, cost_delta: number, price_delta: number, after_feature?: string }) => {
    try {
      await addPlanFeature(planId, feature);
      await refreshComparison();
    } catch (error) {
      console.error("Failed to add plan feature:", error);
    }
  };

  const handleDeletePlanFeature = async (planId: string, featureName: string) => {
    try {
      const plan = await fetchModelPlanById(planId);
      const feature = plan.features?.find(f => f.feature_name === featureName);
      if (feature) {
        await deletePlanFeature(planId, feature.plan_feature_id);
        const updatedData = await fetchComparisonDetails(currentSelections);
        setComparisonData(updatedData);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleFinalizePlan = (planId: string) => {
    alert(`Plan ${planId} has been finalized and updated in the database.`);
  };

  const handleRenamePlan = async (planId: string, newName: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/model-plans/${planId}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const newSelections = currentSelections.map(s =>
          s.plan_id === planId ? { ...s, variant: newName, model: newName } : s
        );
        setCurrentSelections(newSelections);
        handleCompare(newSelections);
        setSidebarKey(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to rename plan:", err);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Are you sure you want to delete this plan permanently?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/model-plans/${planId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const newSelections = currentSelections.filter(s => s.plan_id !== planId);
        setCurrentSelections(newSelections);
        handleCompare(newSelections);
        setSidebarKey(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };



  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Handle page changes with explicit string literals to avoid TS Dispatch mismatch
  const handlePageChange = (page: PageView) => {
    setCurrentPage(page);
  };

  if (currentPage === 'pricing') {
    return (
      <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <PricingComparisonPage initialSelections={currentSelections} />
      </div>
    );
  }

  if (currentPage === 'stackup') {
    return (
      <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <FeatureStackUpPage />
      </div>
    );
  }

  if (currentPage === 'chatbot') {
    return (
      <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
        <ChatbotDashboardPage />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-sky-50 overflow-hidden font-sans text-slate-900">
      <Header currentPage={currentPage} onPageChange={handlePageChange} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          key={sidebarKey}
          onCompare={handleCompare}
          isLoading={isLoading}
          selections={currentSelections}
          setSelections={setCurrentSelections}
        />

        {/* Main Content Area - FLEX COL, NO SCROLL on itself */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-100">
          <div className="flex-1 flex flex-col p-2 md:p-4 gap-2 h-full">

            {/* Top Section: Heading & Toggle News */}
            <div className="flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">Comparison Result</h2>
                  <p className="text-[10px] text-slate-500">
                    Detailed specifications{currentSelections.length > 0 ? ` for ${currentSelections.length} vehicles` : ''}.
                  </p>
                </div>
                
                {/* Sleek News Toggle Button */}
                {(news1 || news2 || isLoadingNews) && (
                  <button
                    onClick={() => setIsNewsSidebarOpen(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                      isNewsSidebarOpen
                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Newspaper size={14} />
                    <span>Latest News</span>
                    {isLoadingNews ? (
                      <span className="w-3 animate-spin rounded-full h-3 border-2 border-current border-t-transparent shrink-0 ml-0.5" />
                    ) : (news1 || news2) ? (
                      <span className={`inline-flex items-center justify-center min-w-[16px] h-4 text-[9px] font-black rounded-full px-1 ${
                        isNewsSidebarOpen ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                      }`}>
                        {((news1?.top5_news?.length || 0) + (news2?.top5_news?.length || 0))}
                      </span>
                    ) : null}
                  </button>
                )}
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-sky-50/70 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-blue-700 font-semibold text-sm">Fetching comparison data...</p>
                </div>
              </div>
            )}

            {/* Table Container - Takes remaining height */}
            <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white relative">
              <ComparisonTable
                data={comparisonData}
                onPlanNewModel={handlePlanNewModel}
                onUpdatePlanFeature={handleUpdatePlanFeature}
                onAddPlanFeature={handleAddPlanFeature}
                onDeletePlanFeature={handleDeletePlanFeature}
                onFinalizePlan={handleFinalizePlan}
                onDeletePlan={handleDeletePlan}
                onRenamePlan={handleRenamePlan}
                onRefresh={refreshComparison}
                selections={currentSelections}
              />
            </div>
          </div>
        </main>

        {/* Right Slidable News Sidebar */}
        <AnimatePresence>
          {isNewsSidebarOpen && (
            <RightNewsSidebar
              isOpen={isNewsSidebarOpen}
              onClose={() => setIsNewsSidebarOpen(false)}
              news1={news1}
              news2={news2}
              isLoading={isLoadingNews}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;