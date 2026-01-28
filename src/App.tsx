import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const App: React.FC = () => {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
};

const AppRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<GlobalLogin onLoginSuccess={() => window.location.href = '/select'} />} />

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
