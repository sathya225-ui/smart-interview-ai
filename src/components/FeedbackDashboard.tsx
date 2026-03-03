import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, MessageSquare, ThumbsUp, AlertCircle, RotateCcw, Sparkles, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const FEEDBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-feedback`;

interface ChatMessage {
  id: number;
  role: "ai" | "user";
  text: string;
  timestamp: Date;
}

interface AIFeedback {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  performanceLabel: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface FeedbackDashboardProps {
  role: string;
  difficulty: string;
  messages: ChatMessage[];
  onRestart: () => void;
  onSaveSession?: (feedback: AIFeedback) => Promise<void>;
}

const FeedbackDashboard = ({ role, difficulty, messages, onRestart, onSaveSession }: FeedbackDashboardProps) => {
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const hasSaved = useRef(false);
  const { user } = useAuth();

  const userAnswers = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const resp = await fetch(FEEDBACK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages, role, difficulty }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Request failed" }));
          toast.error(err.error || "Failed to generate feedback");
          setLoading(false);
          return;
        }

        const data = await resp.json();
        setFeedback(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to generate feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  // Auto-save when feedback arrives and user is logged in
  useEffect(() => {
    if (feedback && user && onSaveSession && !hasSaved.current) {
      hasSaved.current = true;
      onSaveSession(feedback).then(() => {
        setSaved(true);
        toast.success("Interview saved to your history!");
      });
    }
  }, [feedback, user]);

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 glow-strong mb-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Your Interview</h2>
          <p className="text-muted-foreground">AI is reviewing your responses...</p>
        </motion.div>
      </section>
    );
  }

  const scores = feedback ?? {
    overallScore: 70, communicationScore: 70, technicalScore: 70, confidenceScore: 70,
    performanceLabel: "Good", summary: "Interview completed. AI analysis was unavailable.",
    strengths: ["Completed the full interview"], improvements: ["Try again for detailed AI feedback"],
  };

  const metrics = [
    { label: "Overall", score: scores.overallScore, color: "bg-primary" },
    { label: "Communication", score: scores.communicationScore, color: "bg-success" },
    { label: "Technical", score: scores.technicalScore, color: "bg-accent" },
    { label: "Confidence", score: scores.confidenceScore, color: "bg-warning" },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 glow-strong mb-4"
          >
            <span className="text-3xl font-bold text-primary">{scores.overallScore}</span>
          </motion.div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Interview Complete!</h2>
          <p className="text-muted-foreground capitalize">{role} · {difficulty} Level</p>
          {saved && (
            <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
              <Save className="h-3 w-3" /> Saved to your history
            </p>
          )}
          {!user && (
            <p className="text-xs text-muted-foreground mt-2">Sign in to save your interview history</p>
          )}
        </div>

        {feedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Assessment</h3>
            </div>
            <p className="text-sm text-secondary-foreground leading-relaxed">{feedback.summary}</p>
          </motion.div>
        )}

        <div className="glass rounded-xl p-6 mb-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Performance Breakdown</h3>
          </div>
          {metrics.map((m, i) => (
            <div key={m.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-secondary-foreground">{m.label}</span>
                <span className="font-mono text-foreground">{m.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${m.score}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                  className={`h-full rounded-full ${m.color}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-xl p-5 text-center">
            <MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{userAnswers}</p>
            <p className="text-xs text-muted-foreground">Questions Answered</p>
          </div>
          <div className="glass rounded-xl p-5 text-center">
            <ThumbsUp className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{scores.performanceLabel}</p>
            <p className="text-xs text-muted-foreground">Performance</p>
          </div>
        </div>

        {feedback?.strengths && feedback.strengths.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-foreground">Your Strengths</h3>
            </div>
            <ul className="space-y-3">
              {feedback.strengths.map((s, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="flex gap-3 text-sm text-secondary-foreground">
                  <span className="text-success font-mono text-xs mt-0.5">✓</span>{s}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {feedback?.improvements && feedback.improvements.length > 0 && (
          <div className="glass rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-foreground">Areas to Improve</h3>
            </div>
            <ul className="space-y-3">
              {feedback.improvements.map((tip, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex gap-3 text-sm text-secondary-foreground">
                  <span className="text-primary font-mono text-xs mt-0.5">0{i + 1}</span>{tip}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={onRestart} size="lg" className="w-full py-6 text-lg glow">
          <RotateCcw className="mr-2 h-5 w-5" /> Start New Interview
        </Button>
      </motion.div>
    </section>
  );
};

export default FeedbackDashboard;
