// src/components/auth/Dashboard.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SendIcon,
  LoaderIcon,
  Cpu,
  Pencil,
  TriangleAlert,
  FileText,
  TrendingUp,
  Repeat,
  
  ThumbsUp,
  BellRing, // BellRing icon for notifications
} from "lucide-react";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { useSearchParams, useNavigate } from 'react-router-dom';

import { useAuth } from "@/components/auth/auth_model";

const MODELS = [
  { label: "OpenAI GPT-4o", provider: "openai", model: "gpt-4o" },
  { label: "OpenAI GPT-4o-mini", provider: "openai", model: "gpt-4o-mini" },
  { label: "OpenAI GPT-4-turbo", provider: "openai", model: "gpt-4-turbo" },
  { label: "Claude 3 Opus", provider: "anthropic", model: "claude-3-opus-20240229" },
  { label: "Claude 3.7 Sonnet", provider: "anthropic", model: "claude-3-7-sonnet-20250219" },
  { label: "Claude 3 Haiku", provider: "anthropic", model: "claude-3-haiku-20240307" },
];

interface BlogHistoryItem {
  id: string;
  topic: string;
  timestamp: string;
  seo_score: number;// Ensure this matches what your backend returns (e.g., generated_at)
}

const Dashboard = () => {
  const {
    isLoggedIn, openLoginModal, user_id, setBlogHistory, 
    isGenerating, setIsGenerating,
    isBlogGenerated, setIsBlogGenerated,
    seoScore, setSeoScore,
    iterations, setIterations,
    reasons, setReasons,
    recommendations, setRecommendations,
    blogContent, setBlogContent,
    phase, setPhase,
    currentBlogId, setCurrentBlogId, // Ensure setCurrentBlogId is destructured
    topicBeingGenerated, setTopicBeingGenerated,
    validationSuccessMessage, setValidationSuccessMessage,
    initiateBlogGeneration,
    closeGlobalWebSocket,
    authLoading,
    fetchUserHistory,
    forceScrollBlogPreview,
    forceScrollTrackScore,
  } = useAuth();
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();

  const [localTopic, setLocalTopic] = useState("");
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const livePreviewRef = useRef<HTMLDivElement>(null);
  const liveTrackscore = useRef<HTMLDivElement>(null);
  const topicTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [showTopicInput, setShowTopicInput] = useState(true);

  // New states for Semrush queueing
  const [isWaitingForSemrush, setIsWaitingForSemrush] = useState(false);
  const [semrushQueuePosition, setSemrushQueuePosition] = useState<number | null>(null);
  const [activeSemrushUserId, setActiveSemrushUserId] = useState<string | null>(null); // To show who is active
  // NEW: State for controlling the dynamic validation success popup


  const topicRef = useRef(topicBeingGenerated);
  useEffect(() => {
    topicRef.current = topicBeingGenerated;
  }, [topicBeingGenerated]);



  const currentBlogIdRef = useRef(currentBlogId);
  useEffect(() => {
    currentBlogIdRef.current = currentBlogId;
  }, [currentBlogId]);

  const toast = useCallback((options: { title: string; description: string; variant?: string }) => {
    console.log(`[Toast ${options.variant || 'default'}]: ${options.title} - ${options.description}`);
  }, []);

  const logDebug = useCallback((msg: string, data?: unknown) => {
    console.debug(`[🐞 DEBUG]: ${msg}`, data ?? "");
  }, []);

  const fetchBlogContentById = useCallback(
    async (blogId: number): Promise<void> => {
      setIsBlogGenerated(true);
      setPhase("idle");
      setBlogContent(null);
      setSeoScore(null);
      setIterations(0);
      setReasons("");
      setRecommendations([]);
      setCurrentBlogId(blogId);
      setValidationSuccessMessage("");

      try {
        const response = await fetch(`http://localhost:8005/api/blogs/${blogId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setTopicBeingGenerated(data.blog.topic);
          setLocalTopic(data.blog.topic);
          setBlogContent(data.blog.blog_content);
          setSeoScore(data.blog.seo_score);
          setIterations(data.blog.iterations || 0);
          setReasons("");
          setRecommendations([]);
          setValidationSuccessMessage("");

          toast({
            title: "Blog Loaded",
            description: `Content for blog ID: ${blogId} loaded successfully.`,
          });
        } else {
          throw new Error(data.message || data.error || "Failed to fetch blog content.");
        }
      } catch (e: any) {
        console.error(`❌ Error fetching blog ID ${blogId}:`, e);
        toast({
          title: "Load Error",
          description: `Failed to load blog content: ${e.message}`,
          variant: "destructive",
        });
        setBlogContent(null);
        setIsBlogGenerated(false);
        setCurrentBlogId(null);
        setTopicBeingGenerated("");
        setLocalTopic("");
        setReasons("");
        setRecommendations([]);
        setValidationSuccessMessage("");
      } finally {
        setPhase("idle");
      }
    },
    [toast, setIsBlogGenerated, setPhase, setBlogContent, setSeoScore, setIterations, setReasons, setRecommendations, setCurrentBlogId, setTopicBeingGenerated, setValidationSuccessMessage]
  );


  const saveBlogToDB = useCallback(
    async (
      generatedBlogContent: string,
      finalSeoScore: number | null,
      finalIterations: number,
      blogIdToUpdate: number | null,
      currentTopic: string
    ): Promise<{ id: number; seo_score: number | null; iterations: number | null } | null> => {
      console.log("[DEBUG - saveBlogToDB]: Function entered. Value of currentTopic:", currentTopic, "blogIdToUpdate:", blogIdToUpdate);
      if (typeof currentTopic !== "string" || !currentTopic.trim()) {
        console.warn("saveBlogToDB: Invalid topic for saving, expected non-empty string:", currentTopic);
        toast({
          title: "Invalid Topic",
          description: "Topic is missing or invalid for saving. Blog not saved.",
          variant: "destructive",
        });
        return null;
      }

      if (!user_id) {
        console.error("saveBlogToDB: Attempted to save blog without a user_id. Current user_id:", user_id);
        toast({
          title: "Authentication Error",
          description: "Cannot save blog: User not logged in or ID missing.",
          variant: "destructive",
        });
        return null;
      }

      const payload = {
        user_id: user_id,
        topic: currentTopic,
        blog_content: generatedBlogContent,
        seo_score: finalSeoScore,
        iterations: finalIterations
      };

      console.log(`[DEBUG_SAVE_TO_DB_PAYLOAD] Sending SEO Score: ${finalSeoScore}, Iterations: ${finalIterations}`);

      try {
        const url = blogIdToUpdate ? `http://localhost:8005/api/blogs/${blogIdToUpdate}` : "http://localhost:8005/api/blogs";
        const method = blogIdToUpdate ? "PUT" : "POST";

        console.log(`[DEBUG] saveBlogToDB: Sending ${method} request to URL: ${url}`);
        console.log("[DEBUG] saveBlogToDB: Payload being sent:", payload);

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        console.log("[DEBUG] saveBlogToDB: Received backend response (raw):", result);

        if (result && result.blog) {
          console.log(`[DEBUG_SAVE_TO_DB_RESPONSE] Backend returned SEO Score: ${result.blog.seo_score}, Iterations: ${result.blog.iterations}`);
        }

        if (!response.ok || !result.success) {
          const errorMessage = result.message || result.error || `Unknown error during blog ${blogIdToUpdate ? 'update' : 'save'}.`;
          const fullError = new Error(`Backend API Error: ${errorMessage}`);

          console.error(`❌ [ERROR] DB ${blogIdToUpdate ? 'update' : 'save'} failed:`, fullError);
          console.error("[ERROR] saveBlogToDB: Payload that led to error:", payload);
          console.error("[ERROR] saveBlogToDB: Full backend response on error:", result);

          throw fullError;
        }

        const returnedBlogId: number = result.blog.id;
        const newGeneratedAt: string = result.blog.generated_at || new Date().toISOString();
        const returnedSeoScore: number | null = result.blog.seo_score !== undefined ? result.blog.seo_score : null;
        const returnedIterations: number | null = result.blog.iterations !== undefined ? result.blog.iterations : null;


        console.log("[DEBUG] saveBlogToDB: Operation successful. Returned Blog ID:", returnedBlogId, "Generated At:", newGeneratedAt);

        if (!blogIdToUpdate) {
          console.log("[DEBUG] saveBlogToDB: Adding NEW blog to history. ID:", returnedBlogId, "Topic:", currentTopic);
          setBlogHistory(prev => [
            {
              id: returnedBlogId,
              topic: currentTopic,
              generated_at: newGeneratedAt,
              seo_score: returnedSeoScore !== null ? returnedSeoScore : 0,
            },
            ...prev
          ]);
          toast({
            title: "Blog Saved!",
            description: `A draft for "${currentTopic}" has been added to your history.`,
            variant: "success",
          });
          navigate(`/dashboard?blogId=${returnedBlogId}`);
        } else {
          console.log("[DEBUG] saveBlogToDB: Updating existing blog in history. ID:", returnedBlogId, "Topic:", currentTopic);
          toast({
            title: "Blog Updated!",
            description: `"${currentTopic}" has been optimized and updated.`,
            variant: "success",
          });
          setBlogHistory(prev => prev.map(item =>
            item.id === returnedBlogId ? {
              ...item,
              generated_at: newGeneratedAt,
              topic: currentTopic,
              seo_score: returnedSeoScore !== null ? returnedSeoScore : item.seo_score
            } : item
          ));
        }

        console.log(`📥 Blog ${blogIdToUpdate ? 'updated' : 'saved'} to DB. Blog ID:`, returnedBlogId);
        return {
          id: returnedBlogId,
          seo_score: returnedSeoScore,
          iterations: returnedIterations
        };
      } catch (e: any) {
        console.error(`❌ [ERROR] Frontend caught error during DB ${blogIdToUpdate ? 'update' : 'save'} operation:`, e);
        toast({
          title: `DB ${blogIdToUpdate ? 'Update' : 'Save'} Error`,
          description: `Failed to ${blogIdToUpdate ? 'update' : 'store'} blog content: ${e.message}. Please check console for more details.`,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast, setBlogHistory, user_id, navigate]
  );

  const handleMessage = useCallback(
    async (event: MessageEvent): Promise<void> => {
      try {
        const data = JSON.parse(event.data);
        logDebug(`[HANDLE_MESSAGE_START] Current isGenerating: ${isGenerating}, Current Phase: ${phase}`);
        logDebug("WS Message (Parsed):", data);
        console.log(`[WS_EVENT_RECEIVED] Event: ${data.event}, Data:`, data);

        const currentTopicFromRef = topicRef.current;
        const liveCurrentBlogId = currentBlogIdRef.current;
        console.log("[DEBUG - handleMessage]: topicBeingGenerated from ref:", currentTopicFromRef);
        console.log("[DEBUG - handleMessage]: liveCurrentBlogId from ref:", liveCurrentBlogId);

        let savedBlogResult: { id: number; seo_score: number | null; iterations: number | null } | null = null;

        switch (data.event) {
          case "validation_failed":
            logDebug(`[STATE_CHANGE] validation_failed event: Setting isGenerating to false, phase to idle`);
            if (validationTimeoutRef.current) {
              clearTimeout(validationTimeoutRef.current);
              validationTimeoutRef.current = null;
            }
            setReasons(data.reasons?.join(" ") || "Topic not relevant.");
            setRecommendations(data.recommendations || []);
            console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from 'validation_failed' event handler.`);
            setIsGenerating(false);
            setIsBlogGenerated(false);
            setPhase("idle");
            setValidationSuccessMessage("");
            setLocalTopic("");
            setTopicBeingGenerated("");
            setShowTopicInput(true);
            closeGlobalWebSocket();
            toast({
              title: "Validation Failed",
              description: data.message || "Topic not relevant or unclear.",
              variant: "destructive",
            });
            break;

          case "validated":
            logDebug(`[STATE_CHANGE] validated event: Setting phase to generating`);
            if (validationTimeoutRef.current) {
              clearTimeout(validationTimeoutRef.current);
              validationTimeoutRef.current = null;
            }
            setReasons("");
            setRecommendations([]);
            setValidationSuccessMessage(data.message || "Topic validated successfully!");
            setPhase("generating");
            toast({
              title: "Validated",
              description: data.message || "Topic validated, starting blog generation...",
            });
            break;

          case "semrush_waiting":
            logDebug(`[STATE_CHANGE] semrush_waiting event: Setting isWaitingForSemrush to true`);
            setIsWaitingForSemrush(true);
            setSemrushQueuePosition(data.queue_position);
            setActiveSemrushUserId(data.active_user_id);
            toast({
              title: "Semrush Queue",
              description: data.message || `You are #${data.queue_position} in queue for Semrush API.`,
              variant: "default",
            });
            break;

          case "semrush_acquired":
            logDebug(`[STATE_CHANGE] semrush_acquired event: Setting isWaitingForSemrush to false, phase to optimizing`);
            setIsWaitingForSemrush(false);
            setSemrushQueuePosition(null);
            setActiveSemrushUserId(null);
            setPhase("optimizing");
            toast({
              title: "Semrush Access Granted",
              description: data.message || "Starting SEO optimization.",
              variant: "success",
            });
            break;

          case "seo_update":
          case "seo_iteration_start":
            logDebug(`[STATE_CHANGE] SEO event: Setting phase to optimizing, seoScore: ${data.seo_score}`);
            console.log("--- DEBUG: Received SEO Update/Iteration Start ---");
            console.log("Data for SEO update:", data);

            if (typeof data.iteration === "number") {
              setIterations(data.iteration);
              console.log("Setting iterations to:", data.iteration);
            } else {
              console.warn("SEO Update: 'iteration' not a number or missing.", data.iteration);
            }
            if (typeof data.seo_score === "number") {
              setSeoScore(data.seo_score);
              console.log("Setting SEO Score to:", data.seo_score);
            } else {
              console.warn("SEO Update: 'seo_score' not a number or missing.", data.seo_score);
            }
            if (data.blog_chunk !== undefined && data.blog_chunk !== null) {
              setBlogContent(prev => {
                const newContent = (prev || "") + String(data.blog_chunk);
                console.log("Appending blog chunk.");
                return newContent;
              });
            } else {
              console.warn("SEO Update: 'blog_chunk' is undefined or null.");
            }

            if (!isWaitingForSemrush) {
              setPhase("optimizing");
            }
            setIsBlogGenerated(true);
            console.log("Setting phase to: optimizing");

            if (typeof data.blog_content === "string" && currentTopicFromRef) {
              console.log("Attempting to save blog to DB from seo_update/seo_iteration_start event.");
              savedBlogResult = await saveBlogToDB(
                data.blog_content,
                data.seo_score !== undefined ? data.seo_score : null,
                data.iteration !== undefined ? data.iteration : 0,
                liveCurrentBlogId,
                currentTopicFromRef
              );
              if (savedBlogResult) {
                setCurrentBlogId(savedBlogResult.id);
                if (savedBlogResult.seo_score !== null) {
                  setSeoScore(savedBlogResult.seo_score);
                }
                if (savedBlogResult.iterations !== null) {
                  setIterations(savedBlogResult.iterations);
                }
              } else {
                console.warn("DB save failed during seo_update/seo_iteration_start event.");
              }
            } else {
              console.warn("SEO Update: 'blog_content' is missing or not a string for DB save attempt, or currentTopicFromRef is missing.");
              console.log("data.blog_content:", typeof data.blog_content === 'string' ? 'string present' : data.blog_content);
              console.log("currentTopicFromRef:", currentTopicFromRef);
            }
            console.log("--- END DEBUG: SEO Update/Iteration Start ---");
            break;

          case "blog_regenerated":
            logDebug(`[STATE_CHANGE] blog_regenerated event: Setting phase to optimizing`);
            console.log("[DEBUG - handleMessage]: Received 'blog_regenerated' event.");
            if (typeof data.blog_content === "string") {
              setBlogContent(data.blog_content);
              setIsBlogGenerated(true);
              if (!isWaitingForSemrush) {
                setPhase("optimizing");
              }
              savedBlogResult = await saveBlogToDB(
                data.blog_content,
                data.seo_score !== undefined ? data.seo_score : seoScore,
                data.iteration !== undefined ? data.iteration : iterations,
                liveCurrentBlogId,
                currentTopicFromRef
              );
              if (savedBlogResult) {
                setCurrentBlogId(savedBlogResult.id);
                if (savedBlogResult.seo_score !== null) {
                  setSeoScore(savedBlogResult.seo_score);
                }
                if (savedBlogResult.iterations !== null) {
                  setIterations(savedBlogResult.iterations);
                }
              }
            } else {
              console.warn("blog_regenerated event: 'blog_content' missing or not a string.");
            }
            break;

          case "complete":
            logDebug(`[STATE_CHANGE] complete event: Setting isGenerating to false, phase to idle`);
            console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from 'complete' event handler.`);
            setIsGenerating(false);
            setIsBlogGenerated(true);
            setPhase("idle");
            setReasons("");
            setRecommendations([]);
            setValidationSuccessMessage("");
            setIsWaitingForSemrush(false);
            setSemrushQueuePosition(null);
            setActiveSemrushUserId(null);

            if (typeof data.seo_score === "number" && typeof data.blog_content === "string") {
              savedBlogResult = await saveBlogToDB(
                data.blog_content,
                data.seo_score,
                data.iterations !== undefined ? data.iterations : 0,
                liveCurrentBlogId,
                currentTopicFromRef
              );
              if (savedBlogResult) {
                setCurrentBlogId(savedBlogResult.id);
                if (savedBlogResult.seo_score !== null) {
                  setSeoScore(savedBlogResult.seo_score);
                }
                if (savedBlogResult.iterations !== null) {
                  setIterations(savedBlogResult.iterations);
                }
              }
            } else {
              console.warn("handleMessage: 'complete' event missing blog_content or seo_score.");
              toast({
                title: "Generation Finished",
                description: "Blog generation completed, but content or score missing for final save.",
                variant: "warning",
              });
            }

            closeGlobalWebSocket();
            fetchUserHistory(user_id);
            toast({
              title: "Optimization Complete!",
              description: `Blog optimized with final SEO Score: ${savedBlogResult?.seo_score || data.seo_score || 'N/A'}`,
              variant: "success",
            });
            break;

          case "error":
            logDebug(`[STATE_CHANGE] error event: Setting isGenerating to false, phase to idle`);
            if (validationTimeoutRef.current) {
              clearTimeout(validationTimeoutRef.current);
              validationTimeoutRef.current = null;
            }
            toast({
              title: "Error",
              description: data.message || "Something went wrong.",
              variant: "destructive",
            });
            console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from 'error' event handler.`);
            setIsGenerating(false);
            setIsBlogGenerated(false);
            setPhase("idle");
            setValidationSuccessMessage("");
            setLocalTopic("");
            setTopicBeingGenerated("");
            setShowTopicInput(true);
            setIsWaitingForSemrush(false);
            setSemrushQueuePosition(null);
            setActiveSemrushUserId(null);

            closeGlobalWebSocket();
            break;

          default:
            console.log("--- DEBUG: Received unknown WS event ---");
            console.log("Event type:", data.event);
            console.log("Full data:", data);
            console.log("--- END DEBUG: Unknown WS event ---");
            break;
        }
        if (livePreviewRef.current) {
          livePreviewRef.current.scrollTop = livePreviewRef.current.scrollHeight;
        }
      } catch (error: any) {
        logDebug(`[ERROR_PARSING_WS] Error parsing WebSocket message: ${error.message}`);
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
          validationTimeoutRef.current = null;
        }
        console.error("❌ Error parsing WebSocket message! Raw data that caused error:", event.data, "Error:", error);
        toast({
          title: "Error",
          description: "Invalid data received from server. Check console for raw data.",
          variant: "destructive",
        });
        console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from WebSocket parsing error catch block.`);
        setIsGenerating(false);
        setIsBlogGenerated(false);
        setPhase("idle");
        setValidationSuccessMessage("");
        setLocalTopic("");
        setTopicBeingGenerated("");
        setShowTopicInput(true);
        setIsWaitingForSemrush(false);
        setSemrushQueuePosition(null);
        setActiveSemrushUserId(null);

        closeGlobalWebSocket();
      }
    },
    [
      toast,
      closeGlobalWebSocket,
      saveBlogToDB,
      logDebug,
      seoScore,
      iterations,
      setCurrentBlogId,
      setIsGenerating,
      setIsBlogGenerated,
      setSeoScore,
      setIterations,
      setReasons,
      setRecommendations,
      setBlogContent,
      setPhase,
      setValidationSuccessMessage,
      setLocalTopic,
      setTopicBeingGenerated,
      setShowTopicInput,
      isGenerating,
      phase,
      isWaitingForSemrush,
      setSemrushQueuePosition,
      setActiveSemrushUserId,
      user_id,
      fetchUserHistory,
      topicRef,
      currentBlogIdRef,
      validationTimeoutRef,
    ]
  );
 


  useEffect(() => {
    if (location.hash === '#track-score') {
      const timer = setTimeout(() => {
        if (liveTrackscore.current) {
          liveTrackscore.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // Small delay to ensure element is rendered
      return () => clearTimeout(timer); // Cleanup
    }
    // UPDATED: Now depends on both location.hash AND forceScrollBlogPreview
  }, [location.hash, forceScrollTrackScore]);
  

  useEffect(() => {
    if (location.hash === '#live-blog-preview') {
      const timer = setTimeout(() => {
        if (livePreviewRef.current) {
          livePreviewRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // Small delay to ensure element is rendered
      return () => clearTimeout(timer); // Cleanup
    }
    // UPDATED: Now depends on both location.hash AND forceScrollBlogPreview
  }, [location.hash, forceScrollBlogPreview]);


  const handleSubmit = useCallback((): void => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to generate a blog.",
        variant: "default",
      });
      openLoginModal();
      return;
    }

    if (!localTopic.trim()) {
      toast({
        title: "Missing Topic",
        description: "Please enter a topic to proceed.",
        variant: "destructive",
      });
      return;
    }
    console.log("[DEBUG - handleSubmit]: Topic being set for generation:", localTopic.trim());
    setTopicBeingGenerated(localTopic.trim());
    setLocalTopic(localTopic.trim());

    setIsGenerating(true);
    setIsBlogGenerated(false);
    setSeoScore(null);
    setIterations(0);
    setReasons("");
    setRecommendations([]);
    setBlogContent(null);
    setCurrentBlogId(null);
    setPhase("validating");
    setValidationSuccessMessage("");
    setIsWaitingForSemrush(false);
    setSemrushQueuePosition(null);
    setActiveSemrushUserId(null);
    setShowTopicInput(true);

    // --- NEW FUNCTIONALITIES INTEGRATION ---
    // Placeholder for "Generate Audio Overview" logic
    // You would integrate the actual logic here, e.g., calling an API or setting a state.
    console.log("Initiating 'Generate Audio Overview' for:", localTopic.trim());

    // Placeholder for "Deep Research" logic
    // This could involve another API call to a research service.
    console.log("Initiating 'Deep Research' for:", localTopic.trim());
    // --- END NEW FUNCTIONALITIES INTEGRATION ---


    // Clear any existing validation timeout before starting a new one
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }

 

    // Add the timeout for validation success message and phase change
    validationTimeoutRef.current = setTimeout(() => {
      
      setValidationSuccessMessage("Validation successfull topic is relavance to Forage AI Services.");
      setPhase("generating"); // Force transition to 'generating' phase
      validationTimeoutRef.current = null; // Clear the ref after timeout fires
    }, 50000); // 50 seconds as in the image


   

    const selectedModel = MODELS[selectedModelIndex];
    initiateBlogGeneration(
      localTopic.trim(),
      selectedModel.provider,
      selectedModel.model,
      handleMessage,
      () => logDebug("WebSocket connected from Dashboard via Context"),
      (errorEvent) => {
        logDebug(`[ERROR_CALLBACK] WebSocket Error, setting isGenerating to false`);
        console.error("WebSocket Error (Dashboard via Context):", errorEvent);
        toast({
          title: "Connection Error",
          description: "WebSocket failed to connect. Check server status.",
          variant: "destructive",
        });
        console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from WebSocket onError callback.`);
        setIsGenerating(false);
        setIsBlogGenerated(false);
        setPhase("idle");
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
          validationTimeoutRef.current = null;
        }
        setIsWaitingForSemrush(false);
        setSemrushQueuePosition(null);
        setActiveSemrushUserId(null);
        setReasons("");
        setRecommendations([]);
        setValidationSuccessMessage("");
      },
      () => {
        logDebug("WebSocket closed (Dashboard via Context).");
      }
    );
  }, [
    localTopic,
    isLoggedIn,
    user_id,
    toast,
    openLoginModal,
    setTopicBeingGenerated,
    setLocalTopic,
    setIsGenerating,
    setIsBlogGenerated,
    setSeoScore,
    setIterations,
    setReasons,
    setRecommendations,
    setBlogContent,
    setCurrentBlogId,
    setPhase,
    setValidationSuccessMessage,
    setIsWaitingForSemrush,
    setSemrushQueuePosition,
    setActiveSemrushUserId,
    setShowTopicInput,
    validationTimeoutRef,
    selectedModelIndex,
    initiateBlogGeneration,
    handleMessage,
    logDebug,
    closeGlobalWebSocket,
  ]);

  const handleNewBlogClick = useCallback(() => {

    console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from handleNewBlogClick.`);

    setIsGenerating(false); // Reset for new generation

    setPhase("idle");

  

    setLocalTopic("");

    setTopicBeingGenerated("");

    setBlogContent(null);

    setIsBlogGenerated(false);

    setSeoScore(null);

    setIterations(0);

    setReasons("");

    setRecommendations([]);

    setCurrentBlogId(null);

    setValidationSuccessMessage("");

    setIsWaitingForSemrush(false); // Clear queue state

    setSemrushQueuePosition(null);

    setActiveSemrushUserId(null);

    closeGlobalWebSocket();

    setShowTopicInput(false);

    setTimeout(() => { setShowTopicInput(true); }, 50);



    navigate('/dashboard', { replace: true });
    window.scrollTo(0, 0);


    toast({

      title: "New Blog Started",

      description: "Previous generation terminated. Ready for a fresh topic!",

      variant: "default",

    });



  }, [navigate, setLocalTopic, setBlogContent, setIsBlogGenerated, setSeoScore, setIterations, setReasons, setRecommendations, setCurrentBlogId, setPhase, setValidationSuccessMessage, closeGlobalWebSocket, setShowTopicInput, setTopicBeingGenerated, setIsGenerating, toast, setIsWaitingForSemrush, setSemrushQueuePosition, setActiveSemrushUserId]);

  

  const handleModelSelectClick = (e: React.MouseEvent): void => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast({
        title: "Login Required",
        description: "Please log in to select an AI model.",
        variant: "default",
      });
      openLoginModal();
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (topicBeingGenerated && localTopic !== topicBeingGenerated) {
      setLocalTopic(topicBeingGenerated);
    }
  }, [topicBeingGenerated, localTopic]);

  useEffect((): void => {
    const fetchHistory = async () => {
      if (!isLoggedIn || !user_id) {
        setBlogHistory([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8005/api/history?user_id=${user_id}`);
        const data = await response.json();
        if (response.ok && data.success) {
          const sortedHistory = data.history.sort((b: BlogHistoryItem) =>
            new Date(b.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setBlogHistory(sortedHistory);
          logDebug("Fetched blog history:", sortedHistory);
        } else {
          console.error("Failed to fetch user history:", data.message || data.error || "Unknown error");
          setBlogHistory([]);
          toast({
            title: "History Error",
            description: data.message || data.error || "Failed to load blog history.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error fetching user history:", error);
        setBlogHistory([]);
        toast({
          title: "History Error",
          description: `Failed to load blog history: ${error.message}`,
          variant: "destructive",
        });
      }
    };

    fetchHistory();
  }, [isLoggedIn, setBlogHistory, logDebug, toast, user_id]);

  useEffect((): void => {
    const blogIdParam = urlSearchParams.get('blogId');

    if (blogIdParam && Number(blogIdParam) !== currentBlogId) {
      console.log(`[DEBUG_CALL] Calling fetchBlogContentById for blogId: ${blogIdParam}`);
      fetchBlogContentById(Number(blogIdParam));
    } else if (!blogIdParam && currentBlogId) {
      if (!isGenerating) {
        console.log(`[DEBUG_SET_IS_GENERATING] Setting isGenerating to FALSE from URL param change (no blogId and currentBlogId exists)`);
        setLocalTopic("");
        setBlogContent(null);
        setIsBlogGenerated(false);
        setSeoScore(null);
        setIterations(0);
        setReasons("");
        setRecommendations([]);
        setCurrentBlogId(null);
        setPhase("idle");
        setValidationSuccessMessage("");
        setIsWaitingForSemrush(false);
        setSemrushQueuePosition(null);
        setActiveSemrushUserId(null);
      }
    }
  }, [urlSearchParams, fetchBlogContentById, currentBlogId, isGenerating, setLocalTopic, setBlogContent, setIsBlogGenerated, setSeoScore, setIterations, setReasons, setRecommendations, setCurrentBlogId, setPhase, setValidationSuccessMessage, setIsWaitingForSemrush, setSemrushQueuePosition, setActiveSemrushUserId]);

  useEffect((): void => {
    if (livePreviewRef.current && blogContent) {
      livePreviewRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [blogContent]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (validationSuccessMessage) {
      timer = setTimeout(() => {
        setValidationSuccessMessage("");
      }, 5000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [validationSuccessMessage, setValidationSuccessMessage]);


  useEffect((): (() => void) => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, []);

  const isTargetScoreReached = seoScore !== null && seoScore >= 9;

  // Render a basic loading state if authentication is still being processed
  // or if the component is trying to figure out its initial state.
  if (authLoading === undefined || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-700 text-2xl font-semibold">
        <LoaderIcon className="mr-3 h-8 w-8 animate-spin text-blue-600" />
        Loading application...
      </div>
    );
  }

  // Debug log right before rendering the button
  console.log(`[RENDER_DEBUG] isGenerating: ${isGenerating}, isWaitingForSemrush: ${isWaitingForSemrush}, phase: ${phase}, semrushQueuePosition: ${semrushQueuePosition}`);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900 drop-shadow-lg leading-tight">
            Marketing Agent
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Effortlessly create SEO-optimized blog content with powerful AI models.
          </p>
        </header>

        <Card className="shadow-xl rounded-lg overflow-hidden border border-gray-200">
          <CardHeader className="bg-gray-50 p-6 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold text-gray-800">Generate Optimized Blog</CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* {!isLoggedIn && (
              // <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center justify-center text-center shadow-sm animate-fade-in">
              //   <TriangleAlert className="h-5 w-5 mr-2 text-blue-600" />
              //   <p className="font-semibold">Please log in to start generating blogs.</p>
              // </div>
            )} */}

            {validationSuccessMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-lg shadow-sm animate-fade-in flex items-center justify-center text-center">
                <ThumbsUp className="h-6 w-6 mr-3 text-green-600 animate-bounce-in" />
                <p className="font-semibold text-lg">{validationSuccessMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="model" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Cpu className="h-5 w-5 text-gray-600" />
                Select AI Model
              </label>
              <select
                id="model"
                value={selectedModelIndex}
                onChange={(e) => setSelectedModelIndex(Number(e.target.value))}
                disabled={isGenerating || !isLoggedIn}
                onClick={handleModelSelectClick}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 pr-8 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition duration-200 ease-in-out"
              >
                {MODELS.map((model, index) => (
                  <option key={model.model} value={index}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="topic" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Pencil className="h-5 w-5 text-gray-600" />
                Enter Topic for your Blog
              </label>
              {showTopicInput && (
                <Textarea
                  id="topic"
                  ref={topicTextareaRef}
                  value={localTopic}
                  onChange={(e) => setLocalTopic(e.target.value)}
                  placeholder="e.g., The Future of Sustainable Urban Gardening, AI in Modern Education, Mastering Remote Work Productivity"
                  key={currentBlogId || 'new-topic'}
                  onKeyDown={handleTextareaKeyDown}
                  tabIndex={0}
                  style={{ pointerEvents: 'auto' }}
                  className="h-40 resize-y rounded-md border border-gray-300 px-4 py-3 text-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition duration-200 ease-in-out"
                />
              )}
            </div>

            {reasons && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-5 rounded-lg shadow-sm animate-fade-in">
                <p className="font-bold text-lg mb-2 flex items-center gap-2">
                  <TriangleAlert className="h-5 w-5 text-orange-600" />
                  Topic Validation Failed:
                </p>
                <p className="mb-3 leading-relaxed">{reasons}</p>
                {recommendations.length > 0 && (
                  <div>
                    <p className="font-semibold text-base mb-2">Consider these suggestions:</p>
                    <ul className="list-inside list-disc space-y-1">
                      {recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2 text-orange-600">•</span>
                          <button
                            onClick={() => {
                              setLocalTopic(rec);
                              setCurrentBlogId(null);
                              setTopicBeingGenerated(rec);
                              setReasons("");
                              setRecommendations([]);
                              setValidationSuccessMessage("");
                            }}
                            className="text-blue-700 hover:text-blue-900 underline font-medium text-left transition duration-200 ease-in-out disabled:opacity-70"
                            disabled={isGenerating || !isLoggedIn}
                          >
                            {rec}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Conditional rendering for the entire "Blog Generation Status" card */}
            {(isGenerating || isBlogGenerated) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 bg-[length:200%_200%] animate-pulse-subtle p-6 rounded-lg shadow-lg border border-gray-200 space-y-4 transition-all duration-300 hover:shadow-xl" ref={liveTrackscore} id ="track-score">
                <style>{`
            @keyframes pulse-subtle {
                0%, 100% {
                    background-position: 0% 50%;
                }
                50% {
                    background-position: 100% 50%;
                }
            }
            .animate-pulse-subtle {
                animation: pulse-subtle 15s ease infinite;
            }

            /* New animation for dynamic text */
            @keyframes fade-in-text {
                0% { opacity: 0; transform: translateY(5px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-text {
                animation: fade-in-text 0.5s ease-out forwards;
            }
        `}</style>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Blog Generation Status</h3>
                <div className="flex items-center gap-3 text-lg font-semibold text-gray-700">
                  <span className="relative flex h-3 w-3">
                    {isGenerating && phase === "validating" && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    )}
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                  {/* Main AI Process Status with enhanced text styling */}
                  <span className="text-gray-800 font-bold animate-fade-in-text"> {/* Corrected text-black-800 to text-gray-800 */}
                    {isGenerating
                      ? isWaitingForSemrush
                        ? " Engine Queued: Awaiting Semrush Access..."
                        : phase === "validating"
                          ? " Validating Topic Relevance..."
                          : phase === "generating"
                            ? " Generating Initial Draft..."
                            : "Optimizing Content for SEO..." // Covers all sub-steps like fact-checking, regeneration, re-validation
                      : // Final States (when not generating, but blog is generated)
                      isBlogGenerated && seoScore !== null
                        ? isTargetScoreReached
                          ? "Blog Generation Complete: SEO Target Achieved!" // Final success
                          : "Blog Generation Complete: Target score not achieved." // Final, but target not met
                        : null // This state should theoretically not be hit if the outer conditional is working
                    }
                  </span>
                </div>

                {/* Display Semrush Queue Information */}
                {isWaitingForSemrush && semrushQueuePosition !== null && (
                  <div className="flex items-center gap-3 text-lg font-medium text-orange-600 animate-pulse">
                    <BellRing className="h-6 w-6" />
                    <span>You are #{semrushQueuePosition} in queue for Semrush.</span>
                    {activeSemrushUserId && (
                      <span className="text-sm text-gray-500">(Another user is processing)</span>
                    )}
                  </div>
                )}

                {seoScore !== null && (
                  <div className="flex items-center gap-3 text-lg font-semibold text-gray-700">
                    <TrendingUp className={`h-6 w-6 ${isTargetScoreReached ? "text-green-500" : "text-yellow-500"}`} />
                    <span className="text-gray-800">Current SEO Score:</span> <span className={`font-bold ${isTargetScoreReached ? "text-green-600" : "text-yellow-600"}`}>{seoScore} / 10</span>
                    {isTargetScoreReached ? (
                      <span className="text-green-600 ml-1 font-semibold">(Target Achieved!)</span>
                    ) : (
                      isGenerating && phase === "optimizing" && <span className="text-yellow-600 ml-1 font-semibold"></span>
                    )}
                  </div>
                )}

                {iterations > 0 && (
                  <div className="flex items-center gap-3 text-lg font-medium text-blue-500">
                    {/* Dynamic Spinner for Iterations */}
                    {isGenerating && (phase === "optimizing" || phase === "generating") ? (
                      <LoaderIcon className="h-6 w-6 text-blue-500 animate-spin" />
                    ) : (
                      <Repeat className="h-6 w-6 text-blue-500" />
                    )}
                    <span className="text-gray-800">Optimization Iterations:</span> <span className="font-bold text-blue-600">{iterations}</span>
                  </div>
                )}

               
                
              </div>
            )}

            {seoScore !== null && seoScore < 9 && isGenerating && phase === "optimizing" && iterations >0 && (
              <div className="flex items-center gap-2 text-red-600 font-semibold mt-2 animate-fade-in-text">
                <TriangleAlert className="h-5 w-5 text-red-500" />
                <span className="font-bold">SEO Score below target. Iterating for further improvement.</span>
              </div>
            )}


          </CardContent>
          <CardFooter className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
            <Button
              onClick={handleNewBlogClick}
              className="px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                         bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-400
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              New Blog
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isGenerating || !localTopic.trim() || !isLoggedIn}
              className="px-8 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                                bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300
                                disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                  {/* Button Text Logic */}
                  {isWaitingForSemrush // Priority 1: Semrush Queue
                    ? `Waiting in queue (#${semrushQueuePosition === null ? '...' : semrushQueuePosition})...`
                    : phase === "validating" // Priority 2: Validation
                      ? "Validating Topic..."
                      : phase === "generating" // Priority 3: Initial Draft Generation (before first SEO score)
                        ? "Generating Initial Draft..."
                        : phase === "optimizing" // Priority 4: SEO Optimization (covers all sub-steps like fact-checking, regeneration, re-validation)
                          ? "Running SEO Optimization..."
                          : "Processing..." // Fallback
                  }
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 h-5 w-5" />
                  Generate Blog
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
       
        {blogContent && (
          <Card id="live-blog-preview" ref={livePreviewRef} className="shadow-xl rounded-lg overflow-hidden border border-gray-200 mt-8 animate-fade-in">
            <CardHeader className="bg-gray-50 p-6 border-b border-gray-200 flex flex-row items-center justify-between" id="live-blog-preview">
              <CardTitle className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Live Blog Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 prose max-w-none mb-8 text-foreground enhanced-markdown-content">
              <style>{`
        /* Ensure 'Inter' font is available or linked globally for best results */
        body {
            font-family: 'Inter', sans-serif;
        }

        /* Styles specific to markdown content within this CardContent */
        .enhanced-markdown-content h1,
        .enhanced-markdown-content h2,
        .enhanced-markdown-content h3,
        .enhanced-markdown-content h4,
        .enhanced-markdown-content h5,
        .enhanced-markdown-content h6 {
            font-family: 'Inter', sans-serif; /* Consistent font for all headings */
            color: #2d3748; /* Dark text for all headings */
            margin-top: 2.5rem; /* More space above headings */
            margin-bottom: 1.2rem; /* Clear space below headings */
            line-height: 1.2;
            padding-bottom: 0.5em; /* Space for border */
            border-bottom: 1px solid #e2e8f0; /* Light border for separation */
            position: relative; /* For potential future embellishments */
            font-weight: 700; /* All section headings will be bold */
            font-size: 1.8em; /* All section headings will be h3-like size */
        }

        .enhanced-markdown-content p {
            margin-bottom: 1.8rem; /* Significant space between paragraphs to act as sections */
            line-height: 1.8; /* Improved readability for body text */
            color: #4a5568; /* Slightly softer paragraph text for contrast */
            font-size: 1.05rem; /* Slightly larger body text */
        }

        .enhanced-markdown-content a {
            color: #4c51bf; /* Vibrant link color */
            text-decoration: underline;
            transition: color 0.2s ease-in-out;
            font-weight: 500;
        }

        .enhanced-markdown-content a:hover {
            color: #6b46c1; /* Darker hover color */
        }

        .enhanced-markdown-content ul,
        .enhanced-markdown-content ol {
            margin-bottom: 1.8rem; /* Consistent spacing for lists */
            padding-left: 1.8em;
            color: #4a5568;
            font-size: 1.05rem;
        }

        .enhanced-markdown-content li {
            margin-bottom: 0.6rem;
            line-height: 1.7;
        }

        .enhanced-markdown-content blockquote {
            border-left: 5px solid #6366f1; /* More prominent border */
            padding-left: 1.5em;
            margin: 2rem 0; /* More vertical margin */
            color: #6a768f;
            font-style: italic;
            background-color: #f8f8fa; /* Light background for blockquotes */
            padding-top: 1em;
            padding-bottom: 1em;
            border-radius: 0.3em;
        }

        .enhanced-markdown-content code {
            background-color: #edf2f7; /* Light background for inline code */
            padding: 0.2em 0.4em;
            border-radius: 0.3em;
            font-family: 'Fira Mono', 'Consolas', monospace; /* Monospaced font for code */
            font-size: 0.9em;
            color: #3182ce; /* Blue color for inline code */
        }

        .enhanced-markdown-content pre {
            background-color: #2d3748; /* Dark background for code blocks */
            color: #e2e8f0;
            padding: 1.2em;
            border-radius: 0.5em;
            overflow-x: auto; /* Ensure code blocks are scrollable */
            margin-top: 2rem;
            margin-bottom: 2rem;
            font-family: 'Fira Mono', 'Consolas', monospace;
            font-size: 0.95em;
        }
    `}</style>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Render all H1 and H2 markdown as H3 HTML elements
                  h1: ({ node, ...props }) => <h3 {...props} />,
                  h2: ({ node, ...props }) => <h3 {...props} />,
                  // Other headings (h3, h4, h5, h6) will naturally be rendered as h3
                  // due to the general CSS selector above, applying the desired styling.
                }}
              >
                {blogContent}
              </ReactMarkdown>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
