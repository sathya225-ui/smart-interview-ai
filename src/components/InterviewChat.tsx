import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Clock, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import WebcamView from "@/components/WebcamView";

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList { length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionResult { isFinal: boolean; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionAlternative { transcript: string; confidence: number; }

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  timestamp: Date;
}

interface InterviewChatProps {
  role: string;
  difficulty: string;
  jobDescription?: string;
  onFinish: (messages: Message[]) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`;

const InterviewChat = ({ role, difficulty, jobDescription, onFinish }: InterviewChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef("");

  // TTS
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  useEffect(() => {
    if (isTyping) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "ai" && lastMsg.text !== lastSpokenRef.current) {
      lastSpokenRef.current = lastMsg.text;
      speak(lastMsg.text);
    }
  }, [messages, isTyping, speak]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported. Try Chrome."); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + " "; else interim = t;
      }
      setInput(finalTranscript + interim);
    };
    recognition.onerror = (e: any) => { if (e.error !== "aborted") toast.error("Mic error: " + e.error); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.info("Listening... Speak your answer");
  }, []);

  const toggleListening = useCallback(() => {
    isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (hasSentInitial.current) return;
    hasSentInitial.current = true;
    const initialContent = role === "others" && jobDescription
      ? `Start the interview based on this job description at ${difficulty} level. Here is the job description:\n\n${jobDescription}\n\nPlease introduce yourself and ask your first question.`
      : `Start the interview. I'm applying for the ${role} position at ${difficulty} level. Please introduce yourself and ask your first question.`;
    streamAI([{ role: "user", content: initialContent }], true);
  }, []);

  const streamAI = async (chatMessages: { role: string; content: string }[], isInitial = false) => {
    setIsTyping(true);
    let fullText = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: chatMessages, role, difficulty, jobDescription }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Request failed" })); toast.error(err.error || "Something went wrong"); setIsTyping(false); return; }
      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const updateAssistant = (text: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "ai") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text } : m));
          return [...prev, { id: prev.length, role: "ai", text, timestamp: new Date() }];
        });
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let ni: number;
        while ((ni = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, ni); buffer = buffer.slice(ni + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullText += content; updateAssistant(fullText.replace("[INTERVIEW_COMPLETE]", "").trim()); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
      if (fullText.includes("[INTERVIEW_COMPLETE]")) setIsComplete(true);
    } catch (e) { console.error(e); toast.error("Failed to get AI response"); }
    finally { setIsTyping(false); }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { id: messages.length, role: "user", text: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const chatHistory = messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
    chatHistory.push({ role: "user", content: input.trim() });
    streamAI(chatHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <section className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="glass border-b border-border/50 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">AI Interviewer</h2>
            <p className="text-xs text-muted-foreground capitalize">{role === "others" ? "Custom Role" : role} · {difficulty}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            onClick={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) window.speechSynthesis?.cancel(); }}
            className="text-muted-foreground hover:text-foreground"
            title={ttsEnabled ? "Mute AI voice" : "Enable AI voice"}
          >
            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            Live AI
          </div>
        </div>
      </div>

      {/* Main content with camera */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Camera sidebar */}
        <div className="hidden md:flex flex-col w-72 p-4 border-r border-border/50 gap-4 shrink-0">
          <WebcamView />
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Interview Mode</p>
            <p className="text-sm font-semibold text-foreground capitalize">{role === "others" ? "Custom Role" : role}</p>
            <p className="text-xs text-primary capitalize">{difficulty} level</p>
          </div>
        </div>

        {/* Messages - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-3xl mx-auto w-full">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "ai" && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "glass rounded-bl-md text-foreground"}`}>
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
      </div>

      {/* Input - fixed at bottom */}
      <div className="border-t border-border/50 px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          {isComplete ? (
            <Button onClick={() => onFinish(messages)} className="w-full py-6 text-lg glow">
              End Interview & View Feedback
            </Button>
          ) : (
            <>
              <textarea
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type or tap 🎤 to speak..."
                rows={1} disabled={isTyping}
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <Button onClick={toggleListening} disabled={isTyping} size="icon" variant={isListening ? "destructive" : "secondary"} className={`h-12 w-12 rounded-xl shrink-0 transition-all ${isListening ? "animate-pulse-glow" : ""}`}>
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button onClick={() => { stopListening(); handleSend(); }} disabled={!input.trim() || isTyping} size="icon" className="h-12 w-12 rounded-xl shrink-0">
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
