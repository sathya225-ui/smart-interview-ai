import { useRef, useEffect, useState, useCallback } from "react";
import { Video, VideoOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WebcamViewProps {
  onPersonCountWarning?: (warning: boolean) => void;
}

const WebcamView = ({ onPersonCountWarning }: WebcamViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Simple face detection using canvas pixel analysis
  // We use a lightweight skin-color detection heuristic
  const detectPersons = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);

    const imageData = ctx.getImageData(0, 0, 160, 120);
    const data = imageData.data;

    // Detect skin-colored regions using HSV-like heuristic
    let skinPixels = 0;
    const regionMap = new Uint8Array(160 * 120);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Skin color detection heuristic
      if (r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          (r - g) > 15 &&
          Math.abs(r - g) > 15 &&
          r - b > 15) {
        skinPixels++;
        regionMap[i / 4] = 1;
      }
    }

    const totalPixels = 160 * 120;
    const skinRatio = skinPixels / totalPixels;

    // Count distinct blobs using simple connected component analysis
    const visited = new Uint8Array(160 * 120);
    let blobCount = 0;
    const minBlobSize = 80; // minimum pixels for a "person"

    for (let y = 0; y < 120; y++) {
      for (let x = 0; x < 160; x++) {
        const idx = y * 160 + x;
        if (regionMap[idx] && !visited[idx]) {
          // BFS flood fill
          const queue = [idx];
          visited[idx] = 1;
          let size = 0;
          while (queue.length > 0) {
            const cur = queue.pop()!;
            size++;
            const cx = cur % 160, cy = Math.floor(cur / 160);
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < 160 && ny >= 0 && ny < 120) {
                const ni = ny * 160 + nx;
                if (regionMap[ni] && !visited[ni]) {
                  visited[ni] = 1;
                  queue.push(ni);
                }
              }
            }
          }
          if (size >= minBlobSize) blobCount++;
        }
      }
    }

    let newWarning = "";
    if (skinRatio < 0.02 || blobCount === 0) {
      newWarning = "No person detected! Please stay in frame.";
    } else if (blobCount > 1) {
      newWarning = "Multiple persons detected! Only one person allowed.";
    }

    if (newWarning !== warning) {
      setWarning(newWarning);
      onPersonCountWarning?.(!!newWarning);
      if (newWarning) toast.warning(newWarning);
    }
  }, [warning, onPersonCountWarning]);

  useEffect(() => {
    if (enabled) {
      intervalRef.current = window.setInterval(detectPersons, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWarning("");
      onPersonCountWarning?.(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled, detectPersons]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setEnabled(true);
    } catch {
      toast.error("Camera access denied");
      setEnabled(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const toggle = () => {
    if (enabled) {
      stopCamera();
      setEnabled(false);
    } else {
      startCamera();
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card aspect-video">
      {enabled ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <VideoOff className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {warning && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {warning}
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="absolute bottom-2 right-2 h-8 w-8 bg-background/60 backdrop-blur-sm hover:bg-background/80"
      >
        {enabled ? <Video className="h-4 w-4 text-primary" /> : <VideoOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
    </div>
  );
};

export default WebcamView;
