import { useRef, useEffect, useState } from "react";
import { Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const WebcamView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" style={{ transform: "scaleX(-1)" }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <VideoOff className="h-8 w-8 text-muted-foreground" />
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
