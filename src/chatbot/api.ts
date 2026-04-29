const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/chatbot`;

export interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
    intent?: string;
    generated_sql?: string;
    retry_count?: number;
    db_results?: any[];
}

export interface ChatRequest {
    message: string;
    session_id?: string;
}

export interface ChatResponse {
    session_id: string;
    reply: string;
    intent: string;
    generated_sql?: string;
    retry_count: number;
    history_length: number;
    db_results?: any[];
}

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface SessionHistoryResponse {
    session_id: string;
    messages: HistoryMessage[];
}

export const chatbotApi = {
    async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to send message');
        }

        return response.json();
    },

    async getHistory(sessionId: string): Promise<SessionHistoryResponse> {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/history`);
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        return response.json();
    },

    async clearSession(sessionId: string): Promise<{ cleared: boolean; session_id: string }> {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to clear session');
        }
        return response.json();
    },

    async checkHealth(): Promise<{ status: string }> {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('Chatbot backend is unreachable');
        }
        return response.json();
    }
};
