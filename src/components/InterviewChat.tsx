import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  timestamp: Date;
}

const questionBank: Record<string, string[]> = {
  frontend: [
    "Tell me about yourself and your experience with frontend development.",
    "How do you ensure responsive design across different devices?",
    "Explain the difference between CSS Grid and Flexbox. When would you use each?",
    "Describe a challenging bug you fixed in a web application.",
    "How do you optimize website performance?",
  ],
  backend: [
    "Tell me about yourself and your backend development experience.",
    "How do you design RESTful APIs? What best practices do you follow?",
    "Explain the difference between SQL and NoSQL databases.",
    "How do you handle authentication and authorization?",
    "Describe your experience with microservices architecture.",
  ],
  designer: [
    "Walk me through your design process from research to delivery.",
    "How do you handle conflicting feedback from stakeholders?",
    "What's the difference between UX and UI design?",
    "Describe a project where your design significantly improved metrics.",
    "How do you approach designing for accessibility?",
  ],
  pm: [
    "How do you prioritize features in a product roadmap?",
    "Describe a time you had to make a difficult trade-off decision.",
    "How do you gather and validate user requirements?",
    "What metrics do you track to measure product success?",
    "How do you handle disagreements with engineering teams?",
  ],
  data: [
    "What tools and technologies do you use for data analysis?",
    "How do you handle missing or inconsistent data?",
    "Describe a project where your analysis drove a business decision.",
    "Explain the difference between correlation and causation.",
    "How do you present complex findings to non-technical stakeholders?",
  ],
  support: [
    "How do you handle an angry or frustrated customer?",
    "Describe your approach to troubleshooting technical issues.",
    "How do you prioritize multiple support tickets?",
    "What tools have you used for customer support management?",
    "How do you turn a negative customer experience into a positive one?",
  ],
};

interface InterviewChatProps {
  role: string;
  difficulty: string;
  onFinish: (messages: Message[]) => void;
}

const InterviewChat = ({ role, difficulty, onFinish }: InterviewChatProps) => {
  const questions = questionBank[role] || questionBank.frontend;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      text: `Welcome! I'm your AI interviewer. This is a ${difficulty}-level interview for the ${role.replace(/([A-Z])/g, " $1").trim()} role. Let's begin.\n\n${questions[0]}`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: messages.length,
      role: "user",
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const nextQ = currentQ + 1;
      let aiText: string;

      if (nextQ < questions.length) {
        const feedbacks = [
          "Good answer! Let me follow up with this:",
          "Interesting perspective. Here's the next question:",
          "Thank you for sharing. Moving on:",
          "Great, I appreciate the detail. Next:",
        ];
        aiText = `${feedbacks[nextQ % feedbacks.length]}\n\n${questions[nextQ]}`;
        setCurrentQ(nextQ);
      } else {
        aiText = "Excellent! That concludes our interview. Thank you for your thoughtful responses. Click 'End Interview' to see your feedback.";
      }

      setMessages((prev) => [
        ...prev,
        { id: prev.length, role: "ai", text: aiText, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isFinished = currentQ >= questions.length - 1 && messages[messages.length - 1]?.role === "ai" && messages.length > questions.length;

  return (
    <section className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">AI Interviewer</h2>
            <p className="text-xs text-muted-foreground capitalize">{role} · {difficulty}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="h-4 w-4" />
          Q {Math.min(currentQ + 1, questions.length)}/{questions.length}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-3xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "ai" && (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass rounded-bl-md text-foreground"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="glass rounded-2xl rounded-bl-md px-5 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse-glow" />
                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse-glow" style={{ animationDelay: "0.2s" }} />
                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse-glow" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          {isFinished ? (
            <Button onClick={() => onFinish(messages)} className="w-full py-6 text-lg glow">
              End Interview & View Feedback
            </Button>
          ) : (
            <>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                rows={1}
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default InterviewChat;
