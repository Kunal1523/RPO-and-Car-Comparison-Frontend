
import React, { useState } from 'react';
import { MessageSquare, X, Send, Mail, MessageCircle, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './FeedbackButton.css';

interface FeedbackButtonProps {
    variant?: 'floating' | 'header';
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ variant = 'floating' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    
    // Get user email from sessionStorage if available
    const userJson = sessionStorage.getItem('manualLoginUser');
    const userEmail = userJson ? JSON.parse(userJson).username : '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setStatus('submitting');
        
        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail || 'anonymous@msil.com',
                    feedback_text: feedback,
                    page_url: window.location.href,
                    project_type: window.location.pathname.includes('/rpo') ? 'RPO' : 'Car Comparison',
                    timestamp: new Date().toISOString()
                }),
            });

            if (response.ok) {
                setStatus('success');
                setFeedback('');
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus('idle');
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Feedback submission failed:', error);
            setStatus('error');
        }
    };

    return (
        <div className={`feedback-container ${variant}`}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="feedback-card"
                        initial={{ opacity: 0, scale: 0.9, y: variant === 'floating' ? 20 : -20, x: variant === 'floating' ? -20 : 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: variant === 'floating' ? 20 : -20, x: variant === 'floating' ? -20 : 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="feedback-header">
                            <div className="flex items-center gap-2">
                                <MessageCircle size={20} className="text-blue-500" />
                                <h3>Share Feedback</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="close-btn">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="feedback-form">
                            <div className="user-info">
                                <Mail size={14} className="text-slate-400" />
                                <span>{userEmail || 'Anonymous'}</span>
                            </div>

                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Tell us what you think or report an issue..."
                                required
                                disabled={status === 'submitting' || status === 'success'}
                            />

                            <button
                                type="submit"
                                className={`submit-btn ${status}`}
                                disabled={status === 'submitting' || status === 'success' || !feedback.trim()}
                            >
                                {status === 'submitting' ? (
                                    <div className="loader" />
                                ) : status === 'success' ? (
                                    'Thank you! ✨'
                                ) : status === 'error' ? (
                                    'Try Again'
                                ) : (
                                    <>
                                        <span>Send Feedback</span>
                                        <Send size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {variant === 'floating' ? (
                <motion.button
                    className={`feedback-fab ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <MessageSquare size={24} />
                    <span className="fab-text">Feedback</span>
                </motion.button>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`header-feedback-btn ${isOpen ? 'active' : ''}`}
                    title="Give Feedback"
                >
                    <MessageSquare size={16} />
                    <span className="hidden sm:inline">Feedback</span>
                </button>
            )}
        </div>
    );
};

export default FeedbackButton;
