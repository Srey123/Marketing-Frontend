// src/components/auth/auth_model.ts
import { useNavigate } from 'react-router-dom'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import LoginModal from './LoginModal';

export interface BlogHistoryItem { // ADDED 'export' keyword here
    id: number;
    topic: string;
    generated_at: string;
    seo_score: number | null;
}

interface AuthContextType {
    isLoggedIn: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    user_id: string | null;
    userName: string | null;
    logout: () => void;
    setBlogHistory: React.Dispatch<React.SetStateAction<BlogHistoryItem[]>>;
    blogHistory: BlogHistoryItem[];
    fetchUserHistory: (id: string | null) => Promise<void>;

    isGenerating: boolean;
    setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    isBlogGenerated: boolean;
    setIsBlogGenerated: React.Dispatch<React.SetStateAction<boolean>>;
    seoScore: number | null;
    setSeoScore: React.Dispatch<React.SetStateAction<number | null>>;
    iterations: number;
    setIterations: React.Dispatch<React.SetStateAction<number>>;
    reasons: string;
    setReasons: React.Dispatch<React.SetStateAction<string>>;
    recommendations: string[];
    setRecommendations: React.Dispatch<React.SetStateAction<string[]>>;
    blogContent: string | null;
    setBlogContent: React.Dispatch<React.SetStateAction<string | null>>;
    phase: "idle" | "validating" | "generating" | "optimizing";
    setPhase: React.Dispatch<React.SetStateAction<"idle" | "validating" | "generating" | "optimizing">>;
    currentBlogId: number | null;
    setCurrentBlogId: React.Dispatch<React.SetStateAction<number | null>>;
    topicBeingGenerated: string;
    setTopicBeingGenerated: React.Dispatch<React.SetStateAction<string>>;

    validationSuccessMessage: string;
    setValidationSuccessMessage: React.Dispatch<React.SetStateAction<string>>;

    initiateBlogGeneration: (
        userTopic: string,
        provider: string,
        model: string,
        onMessageCallback: (event: MessageEvent) => Promise<void>,
        onOpenCallback: () => void,
        onErrorCallback: (event: Event) => void,
        onCloseCallback: () => void
    ) => void;
    closeGlobalWebSocket: () => void;
    getGlobalWebSocketRef: () => React.MutableRefObject<WebSocket | null>;
    login: (id: string, name: string) => void;
    authLoading: boolean;

    // NEW: For forcing scroll on button click for Blog Preview
    forceScrollBlogPreview: number;
    setForceScrollBlogPreview: React.Dispatch<React.SetStateAction<number>>;

    // NEW: For forcing scroll on button click for Track Score
    forceScrollTrackScore: number;
    setForceScrollTrackScore: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user_id, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [blogHistory, setBlogHistory] = useState<BlogHistoryItem[]>([]);
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isBlogGenerated, setIsBlogGenerated] = useState(false);
    const [seoScore, setSeoScore] = useState<number | null>(null);
    const [iterations, setIterations] = useState(0);
    const [reasons, setReasons] = useState("");
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [blogContent, setBlogContent] = useState<string | null>(null);
    const [phase, setPhase] = useState<"idle" | "validating" | "generating" | "optimizing">("idle");
    const [currentBlogId, setCurrentBlogId] = useState<number | null>(null);
    const [topicBeingGenerated, setTopicBeingGenerated] = useState<string>("");

    const [validationSuccessMessage, setValidationSuccessMessage] = useState("");
    const [authLoading, setAuthLoading] = useState(true);

    // NEW: State for forcing scroll on button click for Blog Preview
    const [forceScrollBlogPreview, setForceScrollBlogPreview] = useState(0);

    // NEW: State for forcing scroll on button click for Track Score
    const [forceScrollTrackScore, setForceScrollTrackScore] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const WS_BASE_URL = "ws://localhost:8004/generate-stream";

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    const fetchUserHistory = useCallback(async (id: string | null) => {
        if (!id) {
            setBlogHistory([]);
            return;
        }
        try {
            const response = await fetch(`http://localhost:8005/api/history?user_id=${id}`);
            const data = await response.json();
            if (response.ok && data.success && data.history) {
                const sortedHistory = data.history.map((item: any) => ({
                    id: item.id,
                    topic: item.topic,
                    generated_at: item.generated_at,
                    seo_score: item.seo_score !== undefined ? item.seo_score : null,
                })).sort((a: BlogHistoryItem, b: BlogHistoryItem) =>
                    new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
                );
                setBlogHistory(sortedHistory);
                console.log("History fetched:", sortedHistory);
            } else {
                console.error("Failed to fetch user history:", data.message || data.error || "Unknown error");
                setBlogHistory([]);
            }
        } catch (error) {
            console.error("Error fetching user history:", error);
            setBlogHistory([]);
        }
    }, [setBlogHistory]);

    const login = useCallback((id: string, name: string) => {
        setIsLoggedIn(true);
        setUserId(id);
        setUserName(name);
        localStorage.setItem('user_id', id);
        localStorage.setItem('user_name', name);
        closeLoginModal();
        fetchUserHistory(id);
    }, [fetchUserHistory, closeLoginModal]);

    const logout = () => {
        setIsLoggedIn(false);
        setUserId(null);
        setUserName(null);
        setBlogHistory([]);
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');

        setIsGenerating(false);
        setIsBlogGenerated(false);
        setSeoScore(null);
        setIterations(0);
        setReasons("");
        setRecommendations([]);
        setBlogContent(null);
        setPhase("idle");
        setCurrentBlogId(null);
        setTopicBeingGenerated("");
        setValidationSuccessMessage("");
        closeGlobalWebSocket();
        navigate('/dashboard', { replace: true });
        setCurrentBlogId(null); 
    };

    const closeGlobalWebSocket = useCallback(() => {
        if (wsRef.current) {
            console.log("Closing global WebSocket connection.");
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const initiateBlogGeneration = useCallback((
        userTopic: string,
        provider: string,
        model: string,
        onMessageCallback: (event: MessageEvent) => Promise<void>,
        onOpenCallback: () => void,
        onErrorCallback: (event: Event) => void,
        onCloseCallback: () => void
    ) => {
        closeGlobalWebSocket();

        const wsUrl = `${WS_BASE_URL}?user_topic=${encodeURIComponent(userTopic)}&provider=${provider}&model=${model}&user_id=${user_id || ''}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("Global WebSocket connected.");
            onOpenCallback();
        };
        ws.onmessage = onMessageCallback;
        ws.onerror = (event) => {
            console.error("Global WebSocket Error:", event);
            onErrorCallback(event);
        };
        ws.onclose = () => {
            console.log("Global WebSocket closed.");
            onCloseCallback();
        };
    }, [closeGlobalWebSocket, user_id]);


    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        const storedUserName = localStorage.getItem('user_name');
        if (storedUserId && storedUserName) {
            setIsLoggedIn(true);
            setUserId(storedUserId);
            setUserName(storedUserName);
            fetchUserHistory(storedUserId).finally(() => {
                setAuthLoading(false);
            });
        } else {
            setBlogHistory([]);
            setAuthLoading(false);
        }
    }, [fetchUserHistory]);

    useEffect(() => {
        return () => {
            closeGlobalWebSocket();
        };
    }, [closeGlobalWebSocket]);


    const authContextValue: AuthContextType = {
        isLoggedIn,
        openLoginModal,
        closeLoginModal,
        user_id,
        userName,
        logout,
        setBlogHistory,
        blogHistory,
        fetchUserHistory,
        isGenerating, setIsGenerating,
        isBlogGenerated, setIsBlogGenerated,
        seoScore, setSeoScore,
        iterations, setIterations,
        reasons, setReasons,
        recommendations, setRecommendations,
        blogContent, setBlogContent,
        phase, setPhase,
        currentBlogId,
        setCurrentBlogId,
        topicBeingGenerated, setTopicBeingGenerated,
        validationSuccessMessage, setValidationSuccessMessage,
        initiateBlogGeneration,
        closeGlobalWebSocket,
        getGlobalWebSocketRef: () => wsRef,
        login,
        authLoading,
        forceScrollBlogPreview, // NEW: Expose forceScrollBlogPreview
        setForceScrollBlogPreview, // NEW: Expose setForceScrollBlogPreview
        forceScrollTrackScore, // NEW: Expose forceScrollTrackScore
        setForceScrollTrackScore, // NEW: Expose setForceScrollTrackScore
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={closeLoginModal}
                onLogin={login}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthModalProvider');
    }
    return context;
};
