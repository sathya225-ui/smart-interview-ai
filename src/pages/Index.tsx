import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import InterviewSetup from "@/components/InterviewSetup";
import InterviewChat from "@/components/InterviewChat";
import FeedbackDashboard from "@/components/FeedbackDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Screen = "hero" | "setup" | "interview" | "feedback";

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

const Index = () => {
  const [screen, setScreen] = useState<Screen>("hero");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [jobDescription, setJobDescription] = useState<string | undefined>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleBegin = (r: string, d: string, jd?: string) => {
    setRole(r);
    setDifficulty(d);
    setJobDescription(jd);
    setScreen("interview");
  };

  const handleFinish = (messages: ChatMessage[]) => {
    setChatMessages(messages);
    setScreen("feedback");
  };

  const saveSession = async (feedback: AIFeedback) => {
    if (!user) return;
    try {
      const { data: session, error: sessionErr } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          role: role === "others" ? "custom" : role,
          difficulty,
          overall_score: feedback.overallScore,
          communication_score: feedback.communicationScore,
          technical_score: feedback.technicalScore,
          confidence_score: feedback.confidenceScore,
          performance_label: feedback.performanceLabel,
          summary: feedback.summary,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
        })
        .select("id")
        .single();

      if (sessionErr) throw sessionErr;

      const msgRows = chatMessages.map((m) => ({
        session_id: session.id,
        user_id: user.id,
        role: m.role,
        text: m.text,
      }));

      await supabase.from("interview_messages").insert(msgRows);
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  };

  const handleRestart = () => {
    setScreen("hero");
    setRole("");
    setDifficulty("");
    setJobDescription(undefined);
    setChatMessages([]);
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-background">
      {screen === "hero" && <HeroSection onStart={() => setScreen("setup")} />}
      {screen === "setup" && <InterviewSetup onBegin={handleBegin} onBack={() => setScreen("hero")} />}
      {screen === "interview" && <InterviewChat role={role} difficulty={difficulty} jobDescription={jobDescription} onFinish={handleFinish} />}
      {screen === "feedback" && (
        <FeedbackDashboard
          role={role}
          difficulty={difficulty}
          messages={chatMessages}
          onRestart={handleRestart}
          onSaveSession={saveSession}
        />
      )}
    </main>
  );
};

export default Index;
