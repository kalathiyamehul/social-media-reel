"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Plus,
  MessageSquare,
  Loader2,
  AlertCircle,
  Send,
  User as UserIcon,
  Bot,
  X,
  Instagram,
  Facebook,
  Database,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Link as LinkIcon,
  Trash2,
  LayoutGrid,
  MoreVertical,
  Search,
  Square
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Types ---
interface Workspace {
  id: string;
  title: string;
  updatedAt: string;
  sources?: Source[];
  conversations?: Conversation[];
}

interface Source {
  id: string;
  sourceType: string;
  sourceTitle?: string;
  thumbnailUrl?: string;
  platform?: string;
  status: string;
  errorMessage?: string;
  warnings?: any;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updatedAt: string;
  messages?: Message[];
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

export default function AIWorkspacePage() {
  const { user, token, refreshUser, setShowCreditModal } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Panels visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Source Add State
  const [showAddSource, setShowAddSource] = useState(false);
  const [addSourceTab, setAddSourceTab] = useState<"URL" | "SAVED">("URL");
  
  const [sourceUrl, setSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [savedItems, setSavedItems] = useState<{reels: any[], ads: any[], creators: any[]}>({ reels: [], ads: [], creators: [] });
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'workspace' | 'source', id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user && token) {
      fetchWorkspaces();
    }
  }, [user, token]);

  useEffect(() => {
    if (activeWorkspaceId) {
      const ws = workspaces.find(w => w.id === activeWorkspaceId);
      if (ws?.conversations && ws.conversations.length > 0) {
        fetchConversation(ws.conversations[0].id);
      } else {
        setActiveConversation(null);
      }
    }
  }, [activeWorkspaceId, token, workspaces]);

  useEffect(() => {
    if (activeConversation?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (showAddSource && addSourceTab === "SAVED" && savedItems.reels.length === 0) {
      fetchSavedItems();
    }
  }, [showAddSource, addSourceTab, token]);

  const fetchWorkspaces = async () => {
    try {
      setIsLoadingWorkspaces(true);
      const res = await fetch("/api/intelligence-workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces);
      }
    } catch (err) {
      toast.error("Failed to load workspaces");
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const fetchConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/intelligence-conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
      }
    } catch (err) {
      toast.error("Failed to load conversation");
    }
  };

  const fetchSavedItems = async () => {
    try {
      setIsLoadingSaved(true);
      const res = await fetch("/api/saved", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { data } = await res.json();
        setSavedItems({
           reels: data?.reels || [],
           ads: data?.ads || [],
           creators: data?.creators || []
        });
      }
    } catch (err) {
      toast.error("Failed to load saved items");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const createWorkspace = async () => {
    try {
      setIsCreatingWorkspace(true);
      const res = await fetch("/api/intelligence-workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "New Workspace" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces([data.workspace, ...workspaces]);
        setActiveWorkspaceId(data.workspace.id);
        toast.success("Workspace created");
      }
    } catch (err) {
      toast.error("Failed to create workspace");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const addSourceByUrl = () => {
    if (!sourceUrl.trim() || !activeWorkspaceId || !token) return;
    setIsAddingSource(true);
    fetch(`/api/intelligence-workspaces/${activeWorkspaceId}/sources/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url: sourceUrl }),
    })
    .then(async (res) => {
       if (res.ok) {
         toast.success("Source added!");
         setSourceUrl("");
         setShowAddSource(false);
         fetchWorkspaces();
         refreshUser();
       } else {
         const errorData = await res.json().catch(() => ({}));
         const msg = errorData.message || "Failed to add source";
         toast.error(msg);
         if (msg.toLowerCase().includes("credit")) setShowCreditModal(true);
       }
    })
    .catch(() => toast.error("Failed to add source"))
    .finally(() => setIsAddingSource(false));
  };

  const addSavedSource = async (type: string, id: string) => {
    if (!activeWorkspaceId) return;
    try {
      setIsAddingSource(true);
      const res = await fetch(`/api/intelligence-workspaces/${activeWorkspaceId}/sources/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, savedItemId: id })
      });
      if (res.ok) {
        toast.success("Source added");
        setShowAddSource(false);
        fetchWorkspaces();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to add source");
      }
    } catch (err) {
      toast.error("Failed to add source");
    } finally {
      setIsAddingSource(false);
    }
  };

  const deleteWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'workspace', id });
  };

  const deleteSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'source', id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'workspace') {
        const res = await fetch(`/api/intelligence-workspaces/${deleteConfirm.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete workspace");
        toast.success("Workspace deleted");
        if (activeWorkspaceId === deleteConfirm.id) setActiveWorkspaceId(null);
      } else if (deleteConfirm.type === 'source') {
        const res = await fetch(`/api/intelligence-workspaces/sources/${deleteConfirm.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete source");
        toast.success("Source removed");
      }
      fetchWorkspaces();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const ensureConversation = async (): Promise<string | null> => {
    if (activeConversation?.id) return activeConversation.id;
    if (!activeWorkspaceId) return null;
    try {
      const res = await fetch(`/api/intelligence-workspaces/${activeWorkspaceId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "Chat", mode: "CHAT" })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        fetchWorkspaces();
        return data.conversation.id;
      }
    } catch (err) {
      toast.error("Failed to start conversation");
    }
    return null;
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const message = chatInput;
    setChatInput("");
    setIsSending(true);
    
    const controller = new AbortController();
    setAbortController(controller);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setActiveConversation(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), { id: Date.now().toString(), role: "USER", content: message, createdAt: new Date().toISOString() }]
    } : {
      id: "", title: "Chat", mode: "CHAT", updatedAt: new Date().toISOString(),
      messages: [{ id: Date.now().toString(), role: "USER", content: message, createdAt: new Date().toISOString() }]
    });

    const conversationId = await ensureConversation();
    if (!conversationId) {
      setIsSending(false);
      return;
    }

    try {
      setChatError(null);
      const res = await fetch(`/api/intelligence-conversations/${conversationId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, mode: "CHAT" }),
        signal: controller.signal
      });
      
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), { id: data.messageId, role: "ASSISTANT", content: data.content, createdAt: new Date().toISOString() }]
        } : null);
      } else {
        const text = await res.text();
        let msg = "Server Error";
        try {
          const json = JSON.parse(text);
          msg = json.message || `Error ${res.status}: ${res.statusText}`;
        } catch {
          msg = `Error ${res.status}: ${res.statusText}`;
        }
        setChatError(msg);
        toast.error(msg);
        if (msg.toLowerCase().includes("credit")) setShowCreditModal(true);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Response generation stopped");
      } else {
        setChatError("Network error or request failed.");
        toast.error("Error sending message");
      }
    } finally {
      setIsSending(false);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsSending(false);
    }
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-background text-foreground text-sm font-sans">
      
      {/* Left Panel: Content Sources */}
      <AnimatePresence>
        {leftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-border bg-card flex flex-col flex-shrink-0"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                Content
              </h2>
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-3">
                {!activeWorkspace ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Select a workspace to add content.
                  </div>
                ) : (
                  <>

                    {!showAddSource ? (
                      <button 
                        onClick={() => setShowAddSource(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg transition-colors text-xs font-medium"
                      >
                        <Plus className="w-4 h-4" /> Add Source
                      </button>
                    ) : (
                      <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">Add Content</p>
                          <button onClick={() => setShowAddSource(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2 border-b border-border pb-2">
                          <button 
                            onClick={() => setAddSourceTab("URL")}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${addSourceTab === "URL" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            From URL
                          </button>
                          <button 
                            onClick={() => setAddSourceTab("SAVED")}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${addSourceTab === "SAVED" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            Library
                          </button>
                        </div>
                        
                        {addSourceTab === "URL" ? (
                          <div className="flex flex-col gap-2">
                            <input 
                              type="url" 
                              placeholder="Paste URL..." 
                              value={sourceUrl}
                              onChange={(e) => setSourceUrl(e.target.value)}
                              disabled={isAddingSource}
                              className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:border-orange-500/50"
                            />
                            <button 
                              onClick={addSourceByUrl}
                              disabled={isAddingSource || !sourceUrl.trim()}
                              className="w-full flex items-center justify-center py-1.5 bg-foreground text-background text-xs font-medium rounded disabled:opacity-50"
                            >
                              {isAddingSource ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add to Workspace"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[30vh] overflow-y-auto text-xs pr-1">
                            {isLoadingSaved ? (
                              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  <p className="font-semibold text-muted-foreground px-1 mb-1">Reels</p>
                                  {savedItems.reels.length === 0 ? <p className="text-muted-foreground px-1">No saved reels.</p> : savedItems.reels.map(r => (
                                    <div key={r.id} onClick={() => addSavedSource("REEL", r.id)} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-md cursor-pointer border border-transparent transition-all">
                                      {r.reel?.thumbnailUrl ? (
                                        <img src={`/api/proxy-image?url=${encodeURIComponent(r.reel.thumbnailUrl)}`} alt="thumbnail" className="w-5 h-7 rounded object-cover flex-shrink-0 bg-muted" />
                                      ) : (
                                        <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0" />
                                      )}
                                      <span className="truncate flex-1 text-xs">@{r.reel?.creator || "Reel"}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-semibold text-muted-foreground px-1 mb-1">Ads</p>
                                  {savedItems.ads.length === 0 ? <p className="text-muted-foreground px-1">No saved ads.</p> : savedItems.ads.map(a => {
                                    const images = Array.isArray(a.ad?.images) ? a.ad.images : [];
                                    const videos = Array.isArray(a.ad?.videos) ? a.ad.videos : [];
                                    let thumbUrl = '';
                                    if (images.length > 0) thumbUrl = typeof images[0] === 'string' ? images[0] : images[0].resized_image_url || images[0].url || '';
                                    if (!thumbUrl && videos.length > 0) thumbUrl = typeof videos[0] === 'string' ? videos[0] : videos[0].video_preview_image_url || videos[0].video_hd_url || '';
                                    
                                    return (
                                      <div key={a.id} onClick={() => addSavedSource("AD", a.id)} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-md cursor-pointer border border-transparent transition-all">
                                        {thumbUrl ? (
                                          <img src={`/api/proxy-image?url=${encodeURIComponent(thumbUrl)}`} alt="thumbnail" className="w-5 h-7 rounded object-cover flex-shrink-0 bg-muted" />
                                        ) : (
                                          <Facebook className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        )}
                                        <span className="truncate flex-1 text-xs">{a.ad?.pageName || "Ad"}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        {activeWorkspace.sources?.map((source) => (
                          <div key={source.id} className="relative group rounded-xl overflow-hidden border border-border bg-card flex flex-col aspect-[4/5] shadow-sm hover:shadow-md transition-all">
                            <div className="flex-1 w-full bg-muted relative">
                              {source.thumbnailUrl ? (
                                <img src={`/api/proxy-image?url=${encodeURIComponent(source.thumbnailUrl)}`} alt="thumbnail" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <LinkIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                {source.platform === 'instagram' ? <Instagram className="w-3.5 h-3.5 text-pink-500" /> : source.platform === 'facebook' ? <Facebook className="w-3.5 h-3.5 text-blue-500" /> : <LinkIcon className="w-3 h-3 text-white" />}
                              </div>
                              <button
                                onClick={(e) => deleteSource(source.id, e)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="p-2.5 absolute bottom-0 w-full">
                              <p className="text-xs font-semibold text-white truncate drop-shadow-md">
                                {source.sourceTitle || "Source"}
                              </p>
                              <p className="text-[10px] text-gray-300 truncate mt-0.5 font-medium">
                                {source.status === 'READY' ? "Analyzed" : source.status === 'PROCESSING' ? "Extracting..." : "Error"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Chat UI */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        <div className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            {!leftPanelOpen && (
              <button
                onClick={() => setLeftPanelOpen(true)}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                title="Show Content"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
            <h1 className="font-semibold text-foreground truncate flex items-center gap-2">
              {activeWorkspace ? activeWorkspace.title : "AI Intelligence Workspace"}
            </h1>
          </div>
          {!rightPanelOpen && (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
              title="Show Workspaces"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 w-full min-h-full">
            {!activeWorkspace ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-70 max-w-sm mx-auto">
                  <BrainCircuit className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h2 className="text-lg font-semibold text-foreground">No Workspace Selected</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a workspace from the right panel or create a new one to start analyzing content.
                  </p>
               </div>
            ) : !activeConversation?.messages?.length ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70 max-w-sm mx-auto">
                <Bot className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground">Empty Chat</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Add sources from the left panel, then ask the AI to analyze, remix, or summarize them.
                </p>
              </div>
            ) : (
              activeConversation.messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex gap-4 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ASSISTANT" && (
                    <div className="w-8 h-8 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                  <div className={`${msg.role === "USER" ? "px-5 py-3 rounded-2xl bg-foreground text-background max-w-[80%] shadow-sm" : "flex-1 min-w-0"}`}>
                    {msg.role === "USER" ? (
                      <div className="whitespace-pre-wrap leading-relaxed text-[14px]">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {msg.role === "USER" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border mt-0.5">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isSending && (
              <div className="flex gap-4 justify-start">
                 <div className="w-8 h-8 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                   <Bot className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0 flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                   <span className="text-[14px] text-muted-foreground">Thinking...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-8 shrink-0" />
          </div>
        </div>

        {chatError && (
          <div className="bg-destructive/10 border-t border-destructive/20 p-3 shrink-0 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-destructive max-w-4xl mx-auto w-full">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{chatError}</span>
              <button onClick={() => setChatError(null)} className="ml-auto p-1.5 hover:bg-destructive/20 rounded-md transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={textareaRef}
              placeholder={activeWorkspace ? "Message your workspace..." : "Select a workspace to chat..."}
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isSending || !activeWorkspaceId}
              rows={1}
              className="w-full pl-4 pr-12 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-[13px] placeholder:text-muted-foreground shadow-sm disabled:opacity-50 resize-none overflow-y-auto max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            />
            {isSending ? (
              <button
                onClick={stopGeneration}
                className="absolute right-2 bottom-3 p-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg transition-colors flex items-center justify-center shadow-sm"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || !activeWorkspaceId}
                className="absolute right-2 bottom-3 p-1.5 bg-foreground hover:bg-foreground/90 disabled:opacity-50 text-background rounded-lg transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Workspaces */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-border bg-card flex flex-col flex-shrink-0"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground tracking-tight flex items-center gap-2">
                Workspaces
              </h2>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-muted/10 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search previous workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <button
                onClick={createWorkspace}
                disabled={isCreatingWorkspace}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-4 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors text-xs font-medium"
              >
                {isCreatingWorkspace ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                New Intellect Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-2">
                {isLoadingWorkspaces ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : filteredWorkspaces.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">No workspaces found.</div>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <div key={ws.id} className="relative group">
                      <button
                        onClick={() => setActiveWorkspaceId(ws.id)}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-all border shadow-sm ${activeWorkspaceId === ws.id ? 'bg-background border-border shadow-md' : 'bg-card border-border/40 hover:border-border hover:shadow-md'}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 relative">
                          {ws.sources?.[0]?.thumbnailUrl ? (
                            <img src={`/api/proxy-image?url=${encodeURIComponent(ws.sources[0].thumbnailUrl)}`} alt="thumbnail" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center border border-border/50 rounded-lg bg-card">
                              <Bot className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          {/* Platform Icon Overlay */}
                          {ws.sources?.[0]?.platform && (
                            <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-background rounded-full flex items-center justify-center shadow-sm border border-border/50">
                              {ws.sources[0].platform === 'instagram' && <Instagram className="w-2.5 h-2.5 text-pink-500" />}
                              {ws.sources[0].platform === 'facebook' && <Facebook className="w-2.5 h-2.5 text-blue-500" />}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <p className={`text-[13px] truncate ${activeWorkspaceId === ws.id ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>
                            {ws.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-[1px]">
                            {ws.sources?.length ? `${ws.sources.length} sources added` : "New Session"}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => deleteWorkspace(ws.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-all opacity-80 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 hover:bg-red-500/10 hover:text-red-500 transition-all" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === 'workspace' 
                ? "This action cannot be undone. This will permanently delete your workspace, including all its added sources and chat history."
                : "This will remove the source from your workspace. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
