
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Car,
    Lock,
    Mail,
    User,
    AlertCircle,
    Gauge,
    Zap,
    Award,
    ChevronRight,
} from 'lucide-react';
import { em } from 'framer-motion/client';

interface GlobalLoginProps {
    onLoginSuccess: () => void;
}

const USERS = [
    {
        email: import.meta.env.VITE_EMAIL_1 || import.meta.env.VITE_EMAIL,
        password: import.meta.env.VITE_PASSWORD_1 || import.meta.env.VITE_PASSWORD,
        name: 'msil User1'
    },
    {
        email: import.meta.env.VITE_EMAIL_2,
        password: import.meta.env.VITE_PASSWORD_2,
        name: 'msil User2'
    },
    {
        email: import.meta.env.VITE_EMAIL_3,
        password: import.meta.env.VITE_PASSWORD_3,
        name: 'msil User3'
    }
].filter(u => u.email && u.password);

const GlobalLogin: React.FC<GlobalLoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = () => {
        setError('');
        setIsLoading(true);

        // Simulate network delay for effect
        setTimeout(() => {
            const validUser = USERS.find(u => u.email === email && u.password === password);

            if (validUser) {
                // Shared login state for both apps
                sessionStorage.setItem('isLoggedIn', 'true');
                const user = { username: email, name: validUser.name, loginType: 'manual' };
                sessionStorage.setItem('manualLoginUser', JSON.stringify(user));
                onLoginSuccess();
            } else {
                setError('Invalid email or password');
                setIsLoading(false);
            }
        }, 800);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && email && password && !isLoading) {
            handleSubmit();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Road Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -100 }}
                        animate={{ y: '100vh' }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 0.4,
                        }}
                        className="absolute left-1/2 w-2 h-20 bg-white rounded-full"
                        style={{ marginLeft: `${(i - 2) * 80}px` }}
                    />
                ))}
            </div>

            {/* Floating Car Icons */}
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-20 left-10 text-blue-400 opacity-30"
            >
                <Car size={60} />
            </motion.div>

            <motion.div
                animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-20 right-10 text-emerald-400 opacity-30"
            >
                <Car size={50} />
            </motion.div>

            {/* Dashboard Icons Floating */}
            <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute top-40 right-20 text-yellow-400 opacity-20"
            >
                <Gauge size={40} />
            </motion.div>

            <motion.div
                animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-40 left-20 text-purple-400 opacity-20"
            >
                <Zap size={45} />
            </motion.div>

            {/* Glowing Orbs */}
            <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
            />

            <motion.div
                animate={{ scale: [1.5, 1, 1.5], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"
            />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Login Card */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
                >
                    {/* Header with Car Animation */}
                    <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-600 p-8 text-white text-center relative overflow-hidden">
                        {/* Animated shine effect */}
                        <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                delay: 0.3,
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                            }}
                            className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-4 relative"
                        >
                            <Car size={45} className="relative z-10" />
                            {/* Pulse ring */}
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-white rounded-full"
                            />
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-bold mb-2"
                        >
                            Welcome Back!
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-blue-100 text-sm"
                        >
                            Sign in to access the RPO & Car Comparison workspace
                        </motion.p>

                        {/* Floating badges */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute top-4 right-4"
                        >
                            <Award size={24} className="text-yellow-300 opacity-70" />
                        </motion.div>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-5"
                        >
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email
                                </label>
                                <motion.div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter your Email address"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white"
                                    />
                                </motion.div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password
                                </label>
                                <motion.div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Enter your Password"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white"
                                    />
                                </motion.div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm"
                                >
                                    <AlertCircle size={18} />
                                    <span className="font-medium">{error}</span>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: email && password && !isLoading ? 1.02 : 1 }}
                                whileTap={{ scale: email && password && !isLoading ? 0.98 : 1 }}
                                onClick={handleSubmit}
                                disabled={isLoading || !email || !password}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all relative overflow-hidden ${isLoading || !email || !password
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700'
                                    } shadow-lg`}
                            >
                                {!isLoading && email && password && (
                                    <motion.div
                                        animate={{ x: ['-100%', '100%'] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    />
                                )}

                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        />
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Sign In
                                        <ChevronRight className="w-5 h-5" />
                                    </span>
                                )}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-sm text-white/80 mt-6 font-medium"
                >
                    © 2025 AMLGO LABS. All rights reserved.
                </motion.p>
            </motion.div>
        </div>
    );
};

export default GlobalLogin;
