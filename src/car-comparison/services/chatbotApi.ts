// src/car-comparison/services/chatbotApi.ts

const BASE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const CHATBOT_PREFIX = '/chatbot';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatSession {
    id: number;
    title: string;
    is_starred: boolean;
    updated_at: number;
    created_at: number;
}

export interface ChatResponse {
    session_id: number;
    reply: string;
    intent: string;
    generated_sql?: string;
    db_results?: any[];
    retry_count: number;
    history_length: number;
}

export const chatbotApi = {
    /**
     * Helper to get headers with authentication
     */
    getHeaders: (): Record<string, string> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const userStr = sessionStorage.getItem('manualLoginUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.username) {
                    headers['X-User-Email'] = user.username;
                }
            } catch (e) {
                console.error("Failed to parse user session", e);
            }
        }
        return headers;
    },

    /**
     * Send a message to the AI
     */
    sendMessage: async (message: string, sessionId?: number): Promise<ChatResponse> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/chat`, {
            method: 'POST',
            headers: chatbotApi.getHeaders(),
            body: JSON.stringify({ message, session_id: sessionId }),
        });
        if (!res.ok) throw new Error(`Chat error: ${res.status}`);
        return await res.json();
    },

    /**
     * List all chat sessions for the user
     */
    listSessions: async (): Promise<ChatSession[]> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/sessions`, {
            headers: chatbotApi.getHeaders()
        });
        if (!res.ok) throw new Error(`Failed to list sessions: ${res.status}`);
        return await res.json();
    },

    /**
     * Get history for a specific session
     */
    getHistory: async (sessionId: number): Promise<{ session_id: number, messages: ChatMessage[] }> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/session/${sessionId}/history`, {
            headers: chatbotApi.getHeaders()
        });
        if (!res.ok) throw new Error(`Failed to get history: ${res.status}`);
        return await res.json();
    },

    /**
     * Rename a session
     */
    renameSession: async (sessionId: number, title: string): Promise<any> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/session/${sessionId}`, {
            method: 'PATCH',
            headers: chatbotApi.getHeaders(),
            body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error(`Failed to rename session: ${res.status}`);
        return await res.json();
    },

    /**
     * Delete a session
     */
    deleteSession: async (sessionId: number): Promise<{ cleared: boolean, session_id: number }> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/session/${sessionId}`, {
            method: 'DELETE',
            headers: chatbotApi.getHeaders()
        });
        if (!res.ok) throw new Error(`Failed to delete session: ${res.status}`);
        return await res.json();
    },

    /**
     * Toggle star status
     */
    toggleStarSession: async (sessionId: number): Promise<{ is_starred: boolean }> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/session/${sessionId}/star`, {
            method: 'POST',
            headers: chatbotApi.getHeaders(),
            body: JSON.stringify({}), // Explicit empty body for POST
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Toggle star failed (${res.status}): ${errorText}`);
        }
        return await res.json();
    },

    /**
     * Health check
     */
    checkHealth: async (): Promise<any> => {
        const res = await fetch(`${BASE_API}${CHATBOT_PREFIX}/health`);
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        return await res.json();
    }
};
