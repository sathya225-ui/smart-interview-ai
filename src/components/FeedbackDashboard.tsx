import { motion } from "framer-motion";
import { BarChart3, MessageSquare, ThumbsUp, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackDashboardProps {
  role: string;
  difficulty: string;
  messageCount: number;
  onRestart: () => void;
}

const FeedbackDashboard = ({ role, difficulty, messageCount, onRestart }: FeedbackDashboardProps) => {
  const userAnswers = Math.floor(messageCount / 2);
  const overallScore = Math.min(95, 60 + userAnswers * 5 + Math.floor(Math.random() * 10));
  const communicationScore = Math.min(100, 55 + Math.floor(Math.random() * 30));
  const technicalScore = Math.min(100, 50 + Math.floor(Math.random() * 35));
  const confidenceScore = Math.min(100, 60 + Math.floor(Math.random() * 25));

  const metrics = [
    { label: "Overall", score: overallScore, color: "bg-primary" },
    { label: "Communication", score: communicationScore, color: "bg-success" },
    { label: "Technical", score: technicalScore, color: "bg-accent" },
    { label: "Confidence", score: confidenceScore, color: "bg-warning" },
  ];

  const tips = [
    "Use the STAR method (Situation, Task, Action, Result) for behavioral questions.",
    "Quantify your achievements with specific numbers and metrics.",
    "Ask clarifying questions before diving into answers.",
    "Show enthusiasm and genuine interest in the role.",
  ];

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 glow-strong mb-4"
          >
            <span className="text-3xl font-bold text-primary">{overallScore}</span>
          </motion.div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Interview Complete!</h2>
          <p className="text-muted-foreground capitalize">{role} · {difficulty} Level</p>
        </div>

        {/* Score Bars */}
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
                  initial={{ width: 0 }}
                  animate={{ width: `${m.score}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                  className={`h-full rounded-full ${m.color}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-xl p-5 text-center">
            <MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{userAnswers}</p>
            <p className="text-xs text-muted-foreground">Questions Answered</p>
          </div>
          <div className="glass rounded-xl p-5 text-center">
            <ThumbsUp className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{overallScore >= 70 ? "Strong" : "Good"}</p>
            <p className="text-xs text-muted-foreground">Performance</p>
          </div>
        </div>

        {/* Tips */}
        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-foreground">Tips to Improve</h3>
          </div>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex gap-3 text-sm text-secondary-foreground"
              >
                <span className="text-primary font-mono text-xs mt-0.5">0{i + 1}</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>

        <Button onClick={onRestart} size="lg" className="w-full py-6 text-lg glow">
          <RotateCcw className="mr-2 h-5 w-5" />
          Start New Interview
        </Button>
      </motion.div>
    </section>
  );
};

export default FeedbackDashboard;
