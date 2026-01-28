// import React, { useState } from 'react';
// import { useMsal } from "@azure/msal-react";
// import { loginRequest, MANUAL_LOGIN_EMAIL, MANUAL_LOGIN_PASSWORD } from "../authConfig";
// import Logo from '../Images/amlgolabslogowhite.png';
// import { Lock, ShieldCheck, ArrowRight, Mail, KeyRound, AlertCircle } from 'lucide-react';

// const LoginPage: React.FC = () => {
//     const { instance } = useMsal();
//     const [showManualLogin, setShowManualLogin] = useState(false);
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     const handleAzureLogin = () => {
//         instance.loginPopup(loginRequest).catch((e) => {
//             console.error(e);
//         });
//     };

//     const handleManualLogin = (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');

//         if (email.toLowerCase() === MANUAL_LOGIN_EMAIL && password === MANUAL_LOGIN_PASSWORD) {
//             // Store manual login session
//             sessionStorage.setItem('manualLoginUser', JSON.stringify({
//                 username: MANUAL_LOGIN_EMAIL,
//                 name: 'Admin User',
//                 loginType: 'manual'
//             }));

//             // Trigger a page reload to update auth state
//             window.location.reload();
//         } else {
//             setError('Invalid email or password');
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 font-sans">
//             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop%27)] bg-cover bg-center opacity-20 mix-blend-overlay"></div>

//             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-md w-full relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
//                 <div className="flex items-center gap-3 mb-4">
//                     <div className="bg-white px-5 py-3 shadow flex items-center justify-center w-full">
//                         <div className="h-10 w-full overflow-hidden flex items-center justify-center">
//                             <img src={Logo} alt="Logo" className="w-full object-contain object-center" />
//                         </div>
//                     </div>
//                 </div>

//                 <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
//                     Regulation Planning
//                 </h1>
//                 <p className="text-blue-100 mb-8 text-sm font-medium">
//                     Advanced Regulatory Planning System
//                 </p>

//                 <div className="w-full space-y-4">
//                     <div className="flex items-center gap-3 text-left text-blue-200 text-xs bg-white/5 p-4 rounded-xl border border-white/10">
//                         <Lock className="w-4 h-4 shrink-0 text-blue-400" />
//                         <span>Secure access required. Please authenticate with your credentials.</span>
//                     </div>

//                     {!showManualLogin ? (
//                         <>
//                             <button
//                                 onClick={handleAzureLogin}
//                                 className="w-full group relative flex items-center justify-center gap-3 bg-white text-blue-900 hover:bg-blue-50 px-6 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
//                             >
//                                 <ShieldCheck className="w-5 h-5 text-blue-600" />
//                                 <span>Sign in with Microsoft</span>
//                                 <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
//                             </button>

//                             <div className="relative">
//                                 <div className="absolute inset-0 flex items-center">
//                                     <div className="w-full border-t border-white/20"></div>
//                                 </div>
//                                 <div className="relative flex justify-center text-xs">
//                                     <span className="px-2 bg-transparent text-blue-200">or</span>
//                                 </div>
//                             </div>

//                             <button
//                                 onClick={() => setShowManualLogin(true)}
//                                 className="w-full flex items-center justify-center gap-3 bg-white/5 text-white hover:bg-white/10 px-6 py-4 rounded-xl font-bold transition-all duration-200 border border-white/20"
//                             >
//                                 <Mail className="w-5 h-5" />
//                                 <span>Sign in with Email</span>
//                             </button>
//                         </>
//                     ) : (
//                         <form onSubmit={handleManualLogin} className="w-full space-y-4">
//                             {error && (
//                                 <div className="flex items-center gap-2 text-left text-red-300 text-xs bg-red-500/20 p-3 rounded-xl border border-red-500/30">
//                                     <AlertCircle className="w-4 h-4 shrink-0" />
//                                     <span>{error}</span>
//                                 </div>
//                             )}

//                             <div className="space-y-2">
//                                 <div className="relative">
//                                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
//                                     <input
//                                         type="email"
//                                         value={email}
//                                         onChange={(e) => setEmail(e.target.value)}
//                                         placeholder="Email address"
//                                         className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/50 px-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
//                                         required
//                                     />
//                                 </div>

//                                 <div className="relative">
//                                     <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
//                                     <input
//                                         type="password"
//                                         value={password}
//                                         onChange={(e) => setPassword(e.target.value)}
//                                         placeholder="Password"
//                                         className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/50 px-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
//                                         required
//                                     />
//                                 </div>
//                             </div>

//                             <button
//                                 type="submit"
//                                 className="w-full group relative flex items-center justify-center gap-3 bg-white text-blue-900 hover:bg-blue-50 px-6 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
//                             >
//                                 <span>Sign In</span>
//                                 <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
//                             </button>

//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     setShowManualLogin(false);
//                                     setError('');
//                                     setEmail('');
//                                     setPassword('');
//                                 }}
//                                 className="w-full text-blue-200 hover:text-white text-sm transition-colors"
//                             >
//                                 ← Back to Microsoft login
//                             </button>
//                         </form>
//                     )}
//                 </div>

//                 <div className="mt-8 text-[10px] text-blue-300/60 uppercase tracking-widest font-semibold">
//                     Restricted Tenant Access
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default LoginPage;


// import React, { useState } from 'react';
// import { MICROSOFT_LOGIN_URL, MANUAL_LOGIN_EMAIL, MANUAL_LOGIN_PASSWORD } from "../authConfig";
// import Logo from '../Images/amlgolabslogowhite.png';
// import { Lock, ShieldCheck, ArrowRight, Mail, KeyRound, AlertCircle } from 'lucide-react';

// const LoginPage: React.FC = () => {
//     const [showManualLogin, setShowManualLogin] = useState(false);
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     // ✅ NEW: Backend OAuth redirect
//     const handleMicrosoftLogin = () => {
//         window.location.href = MICROSOFT_LOGIN_URL;
//     };

//     const handleManualLogin = (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');

//         if (email.toLowerCase() === MANUAL_LOGIN_EMAIL && password === MANUAL_LOGIN_PASSWORD) {
//             sessionStorage.setItem('manualLoginUser', JSON.stringify({
//                 username: MANUAL_LOGIN_EMAIL,
//                 name: 'Admin User',
//                 loginType: 'manual'
//             }));
//             window.location.reload();
//         } else {
//             setError('Invalid email or password');
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900">
//             <div className="bg-white/10 p-10 rounded-3xl shadow-xl max-w-md w-full text-center">

//                 <img src={Logo} className="mb-6" />

//                 <h1 className="text-3xl text-white font-bold mb-2">
//                     Regulation Planning
//                 </h1>

//                 {!showManualLogin ? (
//                     <>
//                         <button
//                             onClick={handleMicrosoftLogin}
//                             className="w-full flex items-center justify-center gap-3 bg-white text-blue-900 px-6 py-4 rounded-xl font-bold"
//                         >
//                             <ShieldCheck className="w-5 h-5" />
//                             Sign in with Microsoft
//                             <ArrowRight className="w-4 h-4" />
//                         </button>

//                         <button
//                             onClick={() => setShowManualLogin(true)}
//                             className="w-full mt-4 bg-white/10 text-white px-6 py-4 rounded-xl"
//                         >
//                             Sign in with Email
//                         </button>
//                     </>
//                 ) : (
//                     <form onSubmit={handleManualLogin} className="space-y-4">
//                         {error && (
//                             <div className="text-red-300 text-sm">{error}</div>
//                         )}

//                         <input
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="Email"
//                             className="w-full px-4 py-3 rounded"
//                         />

//                         <input
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             placeholder="Password"
//                             className="w-full px-4 py-3 rounded"
//                         />

//                         <button
//                             type="submit"
//                             className="w-full bg-white text-blue-900 py-3 rounded font-bold"
//                         >
//                             Login
//                         </button>

//                         <button
//                             type="button"
//                             onClick={() => setShowManualLogin(false)}
//                             className="text-sm text-blue-300"
//                         >
//                             ← Back
//                         </button>
//                     </form>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default LoginPage;



import React, { useState } from 'react';
import { MICROSOFT_LOGIN_URL, MANUAL_LOGIN_EMAIL, MANUAL_LOGIN_PASSWORD } from "../authConfig";
import Logo from '../Images/amlgolabslogowhite.png';
import { Lock, ShieldCheck, ArrowRight, Mail, KeyRound, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Commented out for now - Microsoft OAuth redirect
    // const handleMicrosoftLogin = () => {
    //     window.location.href = MICROSOFT_LOGIN_URL;
    // };

    const handleManualLogin = () => {
        setError('');

        if (email.toLowerCase() === MANUAL_LOGIN_EMAIL && password === MANUAL_LOGIN_PASSWORD) {
            sessionStorage.setItem('manualLoginUser', JSON.stringify({
                username: MANUAL_LOGIN_EMAIL,
                name: 'Admin User',
                loginType: 'manual'
            }));
            window.location.reload();
        } else {
            setError('Invalid email or password');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleManualLogin();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-center">
                    <img src={Logo} alt="Logo" className="mx-auto mb-1 w-40" />
                    <h1 className="text-xl text-white font-bold mb-1">
                        Regulation Planning
                    </h1>
                    <p className="text-blue-100 text-xs">
                        Secure access to your workspace
                    </p>
                </div>

                {/* Form Section */}
                <div className="px-8 py-6">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleManualLogin}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Commented out Microsoft Login - Uncomment when ready */}
                    {/* { 
                    <><div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div><button
                            onClick={handleMicrosoftLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all border border-gray-300 shadow-sm"
                        >
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                Sign in with Microsoft
                            </button></>
                    } */}
                </div>

                {/* Footer */}
                <div className="px-8 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-500">
                        Protected by enterprise-grade security
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;