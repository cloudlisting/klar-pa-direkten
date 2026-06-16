import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, ArrowLeft, ImagePlus, Camera, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import TrustBadges from "@/components/TrustBadges";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ChatThread = Tables<"chat_threads"> & {
  task?: { title: string; id: string };
};
type ChatMessage = Tables<"chat_messages">;

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, Tables<"profiles">>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  // Auto-select thread from URL param
  useEffect(() => {
    const threadId = searchParams.get("thread");
    if (threadId && threads.length > 0 && !selectedThread) {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) setSelectedThread(thread);
    }
  }, [searchParams, threads]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);

      const channel = supabase
        .channel(`messages-${selectedThread.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `thread_id=eq.${selectedThread.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedThread]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*, task:tasks(id, title)")
      .or(`customer_user_id.eq.${user!.id},tasker_user_id.eq.${user!.id}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setThreads(data as ChatThread[]);

      const userIds = new Set<string>();
      data.forEach((t) => {
        userIds.add(t.customer_user_id);
        userIds.add(t.tasker_user_id);
      });

      const { data: profilesData } = await supabase
        .from("public_profiles" as any)
        .select("*")
        .in("id", Array.from(userIds)) as any;

      if (profilesData) {
        const profileMap: Record<string, Tables<"profiles">> = {};
        profilesData.forEach((p) => (profileMap[p.id] = p));
        setProfiles(profileMap);
      }
    }
    setLoadingThreads(false);
  };

  const fetchMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    await supabase.from("chat_messages").insert({
      thread_id: selectedThread.id,
      sender_user_id: user!.id,
      body: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleMediaUpload = async (file: File) => {
    if (!selectedThread || !file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Filen är för stor (max 10MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${selectedThread.id}/${user!.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("chat-media")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("chat_messages").insert({
        thread_id: selectedThread.id,
        sender_user_id: user!.id,
        body: null as any,
        media_url: path,
        media_type: file.type,
      } as any);
      if (insErr) throw insErr;
    } catch (err: any) {
      toast.error(err.message || "Kunde inte ladda upp bild");
    } finally {
      setUploading(false);
    }
  };

  // Generate signed URLs for media messages
  useEffect(() => {
    const loadSigned = async () => {
      const toFetch = messages.filter(
        (m: any) => m.media_url && !signedUrls[m.media_url]
      );
      if (toFetch.length === 0) return;
      const updates: Record<string, string> = {};
      await Promise.all(
        toFetch.map(async (m: any) => {
          const { data } = await supabase.storage
            .from("chat-media")
            .createSignedUrl(m.media_url, 3600);
          if (data?.signedUrl) updates[m.media_url] = data.signedUrl;
        })
      );
      if (Object.keys(updates).length > 0) {
        setSignedUrls((prev) => ({ ...prev, ...updates }));
      }
    };
    loadSigned();
  }, [messages]);

  const getOtherUserId = (thread: ChatThread) => {
    return thread.customer_user_id === user?.id ? thread.tasker_user_id : thread.customer_user_id;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Thread list - hidden on mobile when a thread is selected */}
        <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${selectedThread ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <h1 className="font-semibold text-foreground">Meddelanden</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <p className="p-4 text-muted-foreground text-sm">Laddar...</p>
            ) : threads.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="mx-auto text-muted-foreground mb-2" size={32} />
                <p className="text-sm text-muted-foreground">Inga konversationer ännu</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Starta en chatt genom att skicka ett meddelande från ett uppdrag.
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const otherUser = profiles[getOtherUserId(thread)];
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-secondary/50 transition-colors ${
                      selectedThread?.id === thread.id ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground shrink-0">
                        {otherUser?.name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {otherUser?.name || "Användare"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {(thread as any).task?.title || "Uppdrag"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className={`flex-1 flex flex-col ${selectedThread ? "flex" : "hidden md:flex"}`}>
          {selectedThread ? (
            <>
              <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={() => setSelectedThread(null)}
                >
                  <ArrowLeft size={18} />
                </Button>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/profile/${getOtherUserId(selectedThread)}`}
                    className="font-medium text-foreground truncate hover:underline"
                  >
                    {profiles[getOtherUserId(selectedThread)]?.name || "Användare"}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {(selectedThread as any).task?.title}
                  </p>
                  {profiles[getOtherUserId(selectedThread)] && (
                    <div className="mt-1.5">
                      <TrustBadges
                        data={profiles[getOtherUserId(selectedThread)]}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Inga meddelanden ännu. Skriv det första!</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender_user_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2 ${
                        msg.sender_user_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card flex gap-2">
                <Input
                  placeholder="Skriv ett meddelande..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <Button type="submit" variant="hero" size="icon" disabled={!newMessage.trim()}>
                  <Send size={18} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-2" size={40} />
                <p>Välj en konversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
