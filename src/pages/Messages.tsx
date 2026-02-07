import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type ChatThread = Tables<"chat_threads"> & {
  task?: { title: string };
};
type ChatMessage = Tables<"chat_messages">;

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, Tables<"profiles">>>({});

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

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      
      // Subscribe to realtime messages
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

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*, task:tasks(title)")
      .or(`customer_user_id.eq.${user!.id},tasker_user_id.eq.${user!.id}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setThreads(data as ChatThread[]);
      
      // Fetch profiles for all users in threads
      const userIds = new Set<string>();
      data.forEach((t) => {
        userIds.add(t.customer_user_id);
        userIds.add(t.tasker_user_id);
      });
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));
      
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
        {/* Thread list */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
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
                    <p className="font-medium text-foreground truncate">
                      {otherUser?.name || "Användare"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(thread as any).task?.title || "Uppdrag"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <div className="p-4 border-b border-border bg-card">
                <p className="font-medium text-foreground">
                  {profiles[getOtherUserId(selectedThread)]?.name || "Användare"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedThread as any).task?.title}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender_user_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-xl px-4 py-2 ${
                        msg.sender_user_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card flex gap-2">
                <Input
                  placeholder="Skriv ett meddelande..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" variant="hero" size="icon">
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
