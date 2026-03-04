import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Code, Palette, LineChart, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  { id: "frontend", label: "Frontend Developer", icon: Code },
  { id: "backend", label: "Backend Developer", icon: Code },
  { id: "designer", label: "UI/UX Designer", icon: Palette },
  { id: "pm", label: "Product Manager", icon: Briefcase },
  { id: "data", label: "Data Analyst", icon: LineChart },
  { id: "hr", label: "HR", icon: Users },
  { id: "others", label: "Others (Job Description)", icon: FileText },
];

const difficulties = [
  { id: "beginner", label: "Fresher", desc: "Entry-level questions" },
  { id: "intermediate", label: "Mid-level", desc: "3-5 years experience" },
  { id: "advanced", label: "Senior", desc: "Leadership & deep expertise" },
];

interface InterviewSetupProps {
  onBegin: (role: string, difficulty: string, jobDescription?: string) => void;
  onBack: () => void;
}

const InterviewSetup = ({ onBegin, onBack }: InterviewSetupProps) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const isOthers = selectedRole === "others";
  const canBegin = selectedRole && selectedDifficulty && (!isOthers || jobDescription.trim().length > 20);

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-6 text-sm flex items-center gap-1 transition-colors">
          ← Back
        </button>

        <h2 className="text-3xl font-bold text-foreground mb-2">Set Up Your Interview</h2>
        <p className="text-muted-foreground mb-8">Choose your role and difficulty level</p>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Select Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`glass rounded-lg p-4 text-left transition-all hover:border-primary/50 ${
                  selectedRole === role.id ? "border-primary glow" : ""
                }`}
              >
                <role.icon className={`h-5 w-5 mb-2 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${selectedRole === role.id ? "text-foreground" : "text-secondary-foreground"}`}>
                  {role.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isOthers && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Paste Job Description</h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here... (minimum 20 characters)"
              rows={6}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">{jobDescription.length} characters</p>
          </motion.div>
        )}

        <div className="mb-10">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDifficulty(d.id)}
                className={`glass rounded-lg p-4 text-center transition-all hover:border-primary/50 ${
                  selectedDifficulty === d.id ? "border-primary glow" : ""
                }`}
              >
                <span className={`text-sm font-semibold block ${selectedDifficulty === d.id ? "text-foreground" : "text-secondary-foreground"}`}>
                  {d.label}
                </span>
                <span className="text-xs text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          disabled={!canBegin}
          onClick={() => onBegin(selectedRole, selectedDifficulty, isOthers ? jobDescription : undefined)}
          className="w-full py-6 text-lg glow hover:glow-strong transition-shadow disabled:opacity-40 disabled:shadow-none"
        >
          Begin Interview
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </section>
  );
};

export default InterviewSetup;
