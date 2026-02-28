import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import InterviewSetup from "@/components/InterviewSetup";
import InterviewChat from "@/components/InterviewChat";
import FeedbackDashboard from "@/components/FeedbackDashboard";

type Screen = "hero" | "setup" | "interview" | "feedback";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("hero");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [msgCount, setMsgCount] = useState(0);

  const handleBegin = (r: string, d: string) => {
    setRole(r);
    setDifficulty(d);
    setScreen("interview");
  };

  const handleFinish = (messages: { id: number; role: string; text: string }[]) => {
    setMsgCount(messages.length);
    setScreen("feedback");
  };

  const handleRestart = () => {
    setScreen("hero");
    setRole("");
    setDifficulty("");
    setMsgCount(0);
  };

  return (
    <main className="min-h-screen bg-background">
      {screen === "hero" && <HeroSection onStart={() => setScreen("setup")} />}
      {screen === "setup" && <InterviewSetup onBegin={handleBegin} onBack={() => setScreen("hero")} />}
      {screen === "interview" && <InterviewChat role={role} difficulty={difficulty} onFinish={handleFinish} />}
      {screen === "feedback" && (
        <FeedbackDashboard role={role} difficulty={difficulty} messageCount={msgCount} onRestart={handleRestart} />
      )}
    </main>
  );
};

export default Index;
