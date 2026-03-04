import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Bot, User, BarChart3, ThumbsUp, AlertCircle, Sparkles, Loader2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SessionData {
  id: string;
  role: string;
  difficulty: string;
  overall_score: number | null;
  communication_score: number | null;
  technical_score: number | null;
  confidence_score: number | null;
  performance_label: string | null;
  summary: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  created_at: string;
}

interface MessageData {
  id: string;
  role: string;
  text: string;
  created_at: string;
}

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!id) { navigate("/history"); return; }
    fetchData();
  }, [user, id]);

  const fetchData = async () => {
    const [sessionRes, messagesRes] = await Promise.all([
      supabase.from("interview_sessions").select("*").eq("id", id!).single(),
      supabase.from("interview_messages").select("*").eq("session_id", id!).order("created_at", { ascending: true }),
    ]);

    if (sessionRes.error) {
      toast.error("Session not found");
      navigate("/history");
      return;
    }

    setSession(sessionRes.data as SessionData);
    setMessages((messagesRes.data as MessageData[]) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </section>
    );
  }

  if (!session) return null;

  const metrics = [
    { label: "Overall", score: session.overall_score, color: "bg-primary" },
    { label: "Communication", score: session.communication_score, color: "bg-success" },
    { label: "Technical", score: session.technical_score, color: "bg-accent" },
    { label: "Confidence", score: session.confidence_score, color: "bg-warning" },
  ];

  return (
    <section className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize">{session.role} · {session.difficulty}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(session.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Scores */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Performance Breakdown</h3>
        </div>
        {metrics.map((m, i) => (
          <div key={m.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-secondary-foreground">{m.label}</span>
              <span className="font-mono text-foreground">{m.score ?? "—"}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${m.score ?? 0}%` }}
                transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                className={`h-full rounded-full ${m.color}`}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* AI Summary */}
      {session.summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">AI Assessment</h3>
          </div>
          <p className="text-sm text-secondary-foreground leading-relaxed">{session.summary}</p>
        </motion.div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {session.strengths && session.strengths.length > 0 && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="h-4 w-4 text-success" />
              <h4 className="font-semibold text-foreground text-sm">Strengths</h4>
            </div>
            <ul className="space-y-2">
              {session.strengths.map((s, i) => (
                <li key={i} className="text-sm text-secondary-foreground flex gap-2">
                  <span className="text-success text-xs mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {session.improvements && session.improvements.length > 0 && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-warning" />
              <h4 className="font-semibold text-foreground text-sm">Improvements</h4>
            </div>
            <ul className="space-y-2">
              {session.improvements.map((s, i) => (
                <li key={i} className="text-sm text-secondary-foreground flex gap-2">
                  <span className="text-primary text-xs mt-0.5">0{i + 1}</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Conversation Transcript */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Conversation Transcript</h3>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages recorded for this session.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "ai" && (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary rounded-bl-md text-foreground"
                }`}>
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                    <User className="h-3.5 w-3.5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default SessionDetail;
