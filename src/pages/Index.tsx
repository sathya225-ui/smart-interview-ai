import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import InterviewSetup from "@/components/InterviewSetup";
import InterviewChat from "@/components/InterviewChat";
import FeedbackDashboard from "@/components/FeedbackDashboard";

type Screen = "hero" | "setup" | "interview" | "feedback";

interface ChatMessage {
  id: number;
  role: "ai" | "user";
  text: string;
  timestamp: Date;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("hero");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleBegin = (r: string, d: string) => {
    setRole(r);
    setDifficulty(d);
    setScreen("interview");
  };

  const handleFinish = (messages: ChatMessage[]) => {
    setChatMessages(messages);
    setScreen("feedback");
  };

  const handleRestart = () => {
    setScreen("hero");
    setRole("");
    setDifficulty("");
    setChatMessages([]);
  };

  return (
    <main className="min-h-screen bg-background">
      {screen === "hero" && <HeroSection onStart={() => setScreen("setup")} />}
      {screen === "setup" && <InterviewSetup onBegin={handleBegin} onBack={() => setScreen("hero")} />}
      {screen === "interview" && <InterviewChat role={role} difficulty={difficulty} onFinish={handleFinish} />}
      {screen === "feedback" && (
        <FeedbackDashboard role={role} difficulty={difficulty} messages={chatMessages} onRestart={handleRestart} />
      )}
    </main>
  );
};

export default Index;
