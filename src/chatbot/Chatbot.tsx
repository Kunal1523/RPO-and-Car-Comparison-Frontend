import React, { useState, useEffect, useRef } from 'react';
import { Send, X, RotateCcw, Terminal, Table as TableIcon, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotApi, ChatMessage } from './api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chatbot.css';

const BotAvatar: React.FC<{ isAnimating?: boolean }> = ({ isAnimating = false }) => (
    <div className={`bot-avatar ${isAnimating ? 'bot-avatar--pulse' : ''}`}>
        <Bot size={16} />
    </div>
);

const UserAvatar: React.FC = () => (
    <div className="user-avatar">
        <User size={14} />
    </div>
);

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(
        localStorage.getItem('chatbot_session_id') || undefined
    );
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [currentTableData, setCurrentTableData] = useState<any[] | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            if (messages.length === 0 && sessionId) {
                loadHistory();
            } else if (messages.length === 0) {
                setMessages([{
                    role: 'bot',
                    content: 'Hello! I\'m your **AI Car Comparison Assistant** 🚗\n\nAsk me anything about car features, pricing, or comparisons!'
                }]);
            }
        }
    }, [isOpen, messages]);

    const loadHistory = async () => {
        if (!sessionId) return;
        try {
            const history = await chatbotApi.getHistory(sessionId);
            const formattedMessages: ChatMessage[] = history.messages.map(m => ({
                role: m.role === 'assistant' ? 'bot' : 'user',
                content: m.content
            }));
            setMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, newUserMessage]);

        setIsLoading(true);

        try {
            const response = await chatbotApi.sendMessage({
                message: userMessage,
                session_id: sessionId
            });

            if (response.session_id !== sessionId) {
                setSessionId(response.session_id);
                localStorage.setItem('chatbot_session_id', response.session_id);
            }

            const botReply: ChatMessage = {
                role: 'bot',
                content: response.reply,
                intent: response.intent,
                generated_sql: response.generated_sql,
                retry_count: response.retry_count,
                db_results: response.db_results
            };

            setMessages(prev => [...prev, botReply]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Sorry, I encountered an error. Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (!sessionId) {
            setMessages([{ role: 'bot', content: 'Chat cleared. How can I help you today?' }]);
            return;
        }
        try {
            await chatbotApi.clearSession(sessionId);
            setSessionId(undefined);
            localStorage.removeItem('chatbot_session_id');
            setMessages([{ role: 'bot', content: 'Conversation history cleared. New session started!' }]);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    };

    const toggleChat = () => setIsOpen(!isOpen);

    const renderContent = (content: string) => (
        <div className="message-content markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );

    return (
        <div className="chatbot-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-overlay"
                        initial={{ opacity: 0, scale: 0.85, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 24 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="chatbot-header-left">
                                <div className="chatbot-header-avatar">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3>AI Assistant</h3>
                                    <div className="chatbot-status">
                                        <span className={`status-dot ${isLoading ? 'status-dot--thinking' : 'status-dot--online'}`} />
                                        <span className="status-text">{isLoading ? 'Thinking...' : 'Online'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="chatbot-header-actions">
                                <button className="header-btn" onClick={handleClear} title="Clear Chat">
                                    <RotateCcw size={15} />
                                </button>
                                <button className="header-btn" onClick={toggleChat} title="Close">
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`message-row message-row--${msg.role}`}>
                                    {/* Avatar on LEFT for bot */}
                                    {msg.role === 'bot' && <BotAvatar />}

                                    <div className={`message message--${msg.role}`}>
                                        {renderContent(msg.content)}

                                        {msg.generated_sql && (
                                            <div className="sql-badge">
                                                <Terminal size={11} />
                                                <span>SQL executed</span>
                                            </div>
                                        )}

                                        {msg.db_results && msg.db_results.length > 0 && (
                                            <button
                                                className="view-table-btn"
                                                onClick={() => {
                                                    setCurrentTableData(msg.db_results!);
                                                    setIsTableModalOpen(true);
                                                }}
                                            >
                                                <TableIcon size={13} />
                                                View Data Table
                                            </button>
                                        )}
                                    </div>

                                    {/* Avatar on RIGHT for user */}
                                    {msg.role === 'user' && <UserAvatar />}
                                </div>
                            ))}

                            {/* Typing / Generating indicator */}
                            {isLoading && (
                                <div className="message-row message-row--bot">
                                    <BotAvatar isAnimating />
                                    <div className="message message--bot message--generating">
                                        <div className="generating-label">
                                            <Sparkles size={12} className="sparkle-icon" />
                                            <span>Generating answer…</span>
                                        </div>
                                        <div className="typing-indicator">
                                            <div className="typing-dot" />
                                            <div className="typing-dot" />
                                            <div className="typing-dot" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chatbot-input-container">
                            <input
                                type="text"
                                className="chatbot-input"
                                placeholder="Ask about cars, features, pricing…"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                            />
                            <button
                                className="send-btn"
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                            >
                                <Send size={17} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
                onClick={toggleChat}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen
                        ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X size={26} /></motion.span>
                        : <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Bot size={26} /></motion.span>
                    }
                </AnimatePresence>
            </motion.button>

            {/* Table Modal */}
            <AnimatePresence>
                {isTableModalOpen && currentTableData && currentTableData.length > 0 && (
                    <motion.div
                        className="table-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsTableModalOpen(false)}
                    >
                        <motion.div
                            className="table-modal-content"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="table-modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TableIcon size={18} style={{ color: '#2563eb' }} />
                                    <h3>Query Results</h3>
                                    <span className="table-row-count">{currentTableData.length} rows</span>
                                </div>
                                <button className="header-btn table-close-btn" onClick={() => setIsTableModalOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="table-modal-body">
                                <table>
                                    <thead>
                                        <tr>
                                            {Object.keys(currentTableData[0]).map(key => (
                                                <th key={key}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTableData.map((row, idx) => (
                                            <tr key={idx}>
                                                {Object.values(row).map((val: any, jdx) => (
                                                    <td key={jdx}>
                                                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
