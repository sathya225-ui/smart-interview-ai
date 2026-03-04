import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, Trash2, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Session {
  id: string;
  role: string;
  difficulty: string;
  overall_score: number | null;
  performance_label: string | null;
  created_at: string;
}

const History = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("id, role, difficulty, overall_score, performance_label, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load history");
    else setSessions(data || []);
    setLoading(false);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from("interview_sessions").delete().eq("id", id);
    if (error) toast.error("Failed to delete session");
    else { setSessions((prev) => prev.filter((s) => s.id !== id)); toast.success("Session deleted"); }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </section>
    );
  }

  return (
    <section className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview History</h1>
          <p className="text-muted-foreground text-sm">{sessions.length} sessions completed</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No interviews yet. Start your first one!</p>
          <Button onClick={() => navigate("/")} className="mt-4 glow">Start Interview</Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/session/${s.id}`)}
              className="glass rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{s.overall_score ?? "—"}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground capitalize">{s.role} · {s.difficulty}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {s.performance_label && <span className="ml-2 text-primary">· {s.performance_label}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => deleteSession(e, s.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default History;
