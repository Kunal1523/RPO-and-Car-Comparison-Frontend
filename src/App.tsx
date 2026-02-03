import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import GlobalLogin from './shared/GlobalLogin';
import ProjectSelection from './shared/ProjectSelection';
import RPOApp from './RPO/App';
import CarComparisonApp from './car-comparison/App';
import { AnimatePresence } from 'framer-motion';
import './RPO/App.css';



// Auth Guard
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('manualLoginUser');
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Guest Guard (prevents logged-in users from seeing login page)
const GuestRoute = ({ children }: { children: React.ReactElement }) => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('manualLoginUser');
    const navigate = useNavigate();

    // Silent redirect for logged-in users
    React.useEffect(() => {
        if (isLoggedIn) {
            // We use replace: true here for manual URL entries to /login 
            // so we don't pollute history, but the popstate listener in AppRoutes 
            // handles the "Back button" loop.
            navigate('/select', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    if (isLoggedIn) {
        return null;
    }
    return children;
};

const App: React.FC = () => {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
};

const AppRoutes = () => {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <div className="app-root">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route
                        path="/login"
                        element={
                            <GuestRoute>
                                <GlobalLogin onLoginSuccess={() => navigate('/select', { replace: true })} />
                            </GuestRoute>
                        }
                    />


                    <Route
                        path="/select"
                        element={
                            <ProtectedRoute>
                                <ProjectSelection />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/rpo/*"
                        element={
                            <ProtectedRoute>
                                <RPOWrapper />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/car-comparison/*"
                        element={
                            <ProtectedRoute>
                                <CarComparisonWrapper />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AnimatePresence>
        </div>
    );
}

// Wrappers to handle styling conflicts or specific context provisions
const RPOWrapper = () => {
    return (
        <div className="rpo-app-container">
            {/* Import RPO styles here or ensure they don't leak if possible */}
            <RPOApp />
        </div>
    );
};

const CarComparisonWrapper = () => {
    return (
        <div className="car-comparison-app-container">
            <CarComparisonApp />
        </div>
    );
};

export default App;

