import { motion } from "framer-motion";
import { ArrowRight, Brain, Mic, BarChart3, History, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroSectionProps {
  onStart: () => void;
}

const features = [
  { icon: Brain, label: "AI-Powered Questions", desc: "Tailored to your role" },
  { icon: Mic, label: "Real-time Feedback", desc: "Instant analysis" },
  { icon: BarChart3, label: "Performance Score", desc: "Track your growth" },
];

const HeroSection = ({ onStart }: HeroSectionProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Auth nav */}
      <div className="absolute top-0 right-0 z-20 p-4 flex items-center gap-2">
        {user ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-muted-foreground hover:text-foreground">
              <History className="h-4 w-4 mr-1" /> History
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
            <LogIn className="h-4 w-4 mr-1" /> Sign In
          </Button>
        )}
      </div>

      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {user && (
            <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-1">
              <User className="h-3.5 w-3.5" /> Signed in as {user.email}
            </p>
          )}
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 text-primary mb-6 glow">
            AI-Powered Interview Prep
          </span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Smart Interview</span>
            <br />
            <span className="text-gradient">Simulator</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Practice with an AI HR interviewer. Get real-time feedback, improve your answers, and land your dream job.
          </p>

          <Button size="lg" onClick={onStart} className="text-lg px-8 py-6 glow hover:glow-strong transition-shadow">
            Start Interview
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="glass rounded-xl p-6 text-center"
            >
              <f.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{f.label}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
