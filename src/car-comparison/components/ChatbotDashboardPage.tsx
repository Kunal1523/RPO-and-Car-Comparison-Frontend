import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Plus,
    MessageSquare,
    Trash2,
    Bot,
    User,
    Loader2,
    Star,
    Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatbotApi, ChatSession, ChatMessage, ChatResponse } from '../services/chatbotApi';
import './ChatbotDashboardPage.css';

const ChatbotDashboardPage: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('Generating...');

    // Rename state
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load of sessions
    useEffect(() => {
        const loadSessions = async () => {
            try {
                const data = await chatbotApi.listSessions();
                setSessions(data);
                if (data.length > 0) {
                    // Don't auto-select if we want an empty start, 
                    // but the user might want to see the latest chat.
                    // For now, let's keep it clean or select the first.
                    // setActiveSessionId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to load sessions", error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadSessions();
    }, []);

    // Load messages when session changes
    useEffect(() => {
        if (activeSessionId) {
            const loadMessages = async () => {
                try {
                    const data = await chatbotApi.getHistory(activeSessionId);
                    setMessages(data.messages);
                } catch (error) {
                    console.error("Failed to load messages", error);
                }
            };
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [activeSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Set static loading message
    useEffect(() => {
        if (isLoading) {
            setLoadingMessage('Generating...');
        }
    }, [isLoading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: inputValue.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await chatbotApi.sendMessage(userMsg.content, activeSessionId || undefined);

            // If it was a new session, the backend returns a new session_id
            if (!activeSessionId) {
                setActiveSessionId(response.session_id);
                // Refresh sessions list to show the new/renamed session
                const updatedSessions = await chatbotApi.listSessions();
                setSessions(updatedSessions);
            }

            const assistantMsg: ChatMessage = { role: 'assistant', content: response.reply };
            setMessages(prev => [...prev, assistantMsg]);
            setLastResponse(response);

            // Always refresh sessions list to update the "Last Updated" timestamp and order in sidebar
            const updatedSessions = await chatbotApi.listSessions();
            setSessions(updatedSessions);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not connect to the AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        setLastResponse(null);
        setEditingSessionId(null);
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;

        try {
            await chatbotApi.deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (activeSessionId === id) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleToggleStar = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        console.log(`Toggling star for session: ${id}`);
        try {
            const result = await chatbotApi.toggleStarSession(id);
            console.log("Star API response:", result);
            const { is_starred } = result;
            setSessions(prev => prev.map(s => s.id === id ? { ...s, is_starred } : s));
        } catch (error) {
            console.error("Failed to toggle star", error);
            alert(`Failed to toggle star: ${error}`);
        }
    };

    const startEditing = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditingTitle(session.title);
    };

    const cancelEditing = () => {
        setEditingSessionId(null);
        setEditingTitle('');
    };

    const saveRename = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!editingSessionId || !editingTitle.trim()) return;

        try {
            await chatbotApi.renameSession(editingSessionId, editingTitle.trim());
            setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editingTitle.trim() } : s));
            setEditingSessionId(null);
        } catch (error) {
            console.error("Failed to rename", error);
        }
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "";

        // If timestamp is in milliseconds (usually > 10^12), use it directly.
        // If it's in seconds (standard Unix epoch), multiply by 1000.
        const date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);

        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="chatbot-dashboard-container">
            {/* ── SIDEBAR ── */}
            <aside className="chatbot-sidebar">
                <div className="sidebar-header">
                    <button className="new-chat-btn" onClick={handleNewChat}>
                        <Plus size={18} />
                        New Conversation
                    </button>
                </div>

                <div className="sessions-list">
                    {isInitialLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 text-sm italic">
                            No recent chats
                        </div>
                    ) : (
                        <>
                            {/* Starred Sessions Section */}
                            {sessions.some(s => s.is_starred) && (
                                <div className="session-section">
                                    <div className="section-header">
                                        <Star size={12} fill="#f59e0b" className="text-amber-500" />
                                        Pinned
                                    </div>
                                    {sessions.filter(s => s.is_starred).map(session => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            activeSessionId={activeSessionId}
                                            editingSessionId={editingSessionId}
                                            editingTitle={editingTitle}
                                            setActiveSessionId={setActiveSessionId}
                                            handleToggleStar={handleToggleStar}
                                            startEditing={startEditing}
                                            saveRename={saveRename}
                                            setEditingTitle={setEditingTitle}
                                            cancelEditing={cancelEditing}
                                            handleDeleteSession={handleDeleteSession}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Recent Sessions Section */}
                            <div className="session-section">
                                <div className="section-header">Recent</div>
                                {sessions.filter(s => !s.is_starred).map(session => (
                                    <SessionItem
                                        key={session.id}
                                        session={session}
                                        activeSessionId={activeSessionId}
                                        editingSessionId={editingSessionId}
                                        editingTitle={editingTitle}
                                        setActiveSessionId={setActiveSessionId}
                                        handleToggleStar={handleToggleStar}
                                        startEditing={startEditing}
                                        saveRename={saveRename}
                                        setEditingTitle={setEditingTitle}
                                        cancelEditing={cancelEditing}
                                        handleDeleteSession={handleDeleteSession}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* ── MAIN CHAT ── */}
            <main className="chatbot-main">
                {messages.length === 0 && !isLoading ? (
                    <div className="chat-empty-state">
                        <div className="empty-icon-circle">
                            <Bot size={40} />
                        </div>
                        <h2 className="empty-title">How can I help you today?</h2>
                        <p className="empty-subtitle">
                            Ask me anything about car comparisons, variant features, or technical specifications.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            {["Sunroof available in hyndai creta variants", "ADAS feature in Hyundai Creta", "Car Connected features in Maruti Suzuki Grand Vitara"].map(suggestion => (
                                <button
                                    key={suggestion}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm transition-colors"
                                    onClick={() => { setInputValue(suggestion); }}
                                >
                                    "{suggestion}"
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="chat-messages-container">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`message-bubble-wrapper ${msg.role === 'user' ? 'user-wrapper' : 'assistant-wrapper'}`}
                                >
                                    <div className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="assistant-badge">
                                                <Bot size={14} />
                                                <span>Car AI Assistant</span>
                                            </div>
                                        )}
                                        <div className="message-content">
                                            {msg.role === 'assistant' ? (
                                                <div className="markdown-content">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <div className="typing-indicator-wrapper">
                                <div className="typing-indicator">
                                    <div className="typing-dots">
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                    </div>
                                    <span className="loading-text">{loadingMessage}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input area */}
                <div className="chat-input-wrapper">
                    <form className="chat-input-container" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Message the Car AI..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="send-btn"
                            disabled={!inputValue.trim() || isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ChatbotDashboardPage;

/**
 * Sub-component for individual session items to keep the main list clean
 */
interface SessionItemProps {
    session: ChatSession;
    activeSessionId: number | null;
    editingSessionId: number | null;
    editingTitle: string;
    setActiveSessionId: (id: number | null) => void;
    handleToggleStar: (e: React.MouseEvent, id: number) => void;
    startEditing: (e: React.MouseEvent, session: ChatSession) => void;
    saveRename: (e?: React.FormEvent) => void;
    setEditingTitle: (title: string) => void;
    cancelEditing: () => void;
    handleDeleteSession: (e: React.MouseEvent, id: number) => void;
    formatDate: (timestamp: number) => string;
}

const SessionItem: React.FC<SessionItemProps> = ({
    session,
    activeSessionId,
    editingSessionId,
    editingTitle,
    setActiveSessionId,
    handleToggleStar,
    startEditing,
    saveRename,
    setEditingTitle,
    cancelEditing,
    handleDeleteSession,
    formatDate
}) => {
    return (
        <div
            className={`session-item ${activeSessionId === session.id ? 'active' : ''} ${session.is_starred ? 'starred' : ''}`}
            onClick={() => setActiveSessionId(session.id)}
        >
            <MessageSquare size={16} className="session-icon" />
            <div className="session-info">
                {editingSessionId === session.id ? (
                    <form className="rename-form" onSubmit={(e) => { e.preventDefault(); saveRename(); }} onClick={e => e.stopPropagation()}>
                        <input
                            autoFocus
                            className="rename-input"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => saveRename()}
                            onKeyDown={e => e.key === 'Escape' && cancelEditing()}
                        />
                    </form>
                ) : (
                    <>
                        <div className="session-title">{session.title || "Untitled Chat"}</div>
                        <div className="session-date">{formatDate(session.updated_at)}</div>
                    </>
                )}
            </div>
            <div className="session-actions">
                <button
                    className={`star-btn ${session.is_starred ? 'active' : ''}`}
                    onClick={(e) => handleToggleStar(e, session.id)}
                    title={session.is_starred ? "Unstar" : "Star"}
                >
                    <Star size={14} fill={session.is_starred ? "currentColor" : "none"} />
                </button>
                <button
                    className="rename-btn"
                    onClick={(e) => startEditing(e, session)}
                    title="Rename"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    className="delete-session-btn"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
