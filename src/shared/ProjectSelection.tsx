
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Car, ArrowRight, LayoutDashboard, PieChart, LogOut } from 'lucide-react';

const ProjectSelection: React.FC = () => {
    const navigate = useNavigate();

    const projects = [
        {
            id: 'rpo',
            title: 'Regulation & Project Planning',
            description: 'Manage regulations, draft plans, and analyze compliance data.',
            icon: <PieChart className="w-12 h-12 text-emerald-400" />,
            color: 'from-emerald-500/20 to-teal-500/20',
            borderColor: 'border-emerald-500/30',
            hoverBorder: 'group-hover:border-emerald-500',
            btnColor: 'bg-emerald-600 hover:bg-emerald-500',
            path: '/rpo'
        },
        {
            id: 'car-comparison',
            title: 'Car Comparison Dashboard',
            description: 'Compare vehicle specifications, prices, and features side-by-side.',
            icon: <Car className="w-12 h-12 text-blue-400" />,
            color: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            hoverBorder: 'group-hover:border-blue-500',
            btnColor: 'bg-blue-600 hover:bg-blue-500',
            path: '/car-comparison'
        }
    ];



    return (
        <div className="min-h-screen bg-blue-100 text-slate-900 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16 z-10"
            >
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 mb-4">
                    Select Your Workspace
                </h1>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                    Choose the application you want to access. You can switch between them later.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full z-10 px-4">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className={`group relative bg-slate-900 border ${project.borderColor} ${project.hoverBorder} rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-${project.id === 'rpo' ? 'emerald' : 'blue'}-900/20 hover:-translate-y-2`}
                        onClick={() => navigate(project.path)}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="bg-slate-800 p-4 rounded-2xl w-fit mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                                {project.icon}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-white transition-colors">
                                {project.title}
                            </h2>

                            <p className="text-slate-400 mb-8 flex-grow leading-relaxed group-hover:text-slate-200 transition-colors">
                                {project.description}
                            </p>

                            <div className="flex items-center text-sm font-bold uppercase tracking-wider">
                                <span className={`px-6 py-3 rounded-xl ${project.btnColor} text-white flex items-center gap-2 transition-all shadow-lg`}>
                                    Launch App <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => {
                    sessionStorage.clear();
                    navigate('/login');
                }}
                className="mt-16 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30 flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </motion.button>
        </div>
    );
};

export default ProjectSelection;

