import React, { useRef, useEffect, useState } from 'react';
import { Video, Play } from 'lucide-react';

// Hardcode connections since MediaPipe npm export is sometimes broken in Vite
const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

export function VideoFeed({ videoFile, onPoseUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const animationFrameId = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/poseWorker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'initialized') {
        setIsReady(true);
      } else if (type === 'results') {
        drawResults(payload);
        if (onPoseUpdate) {
          onPoseUpdate(payload);
        }
      }
    };

    workerRef.current.postMessage({ type: 'init' });

    return () => {
      workerRef.current?.terminate();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (videoFile) {
        setIsWebcamActive(false);
        stopWebcam();
        const video = videoRef.current;
        video.srcObject = null;
        video.src = videoFile;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;

        video.onloadeddata = () => {
            video.play().catch(e => console.error("Video play error:", e));
            processVideoFrame();
        };
    } else {
       // Do not auto-start webcam. Wait for button click.
       stopWebcam();
       setIsWebcamActive(false);

       if (videoRef.current) {
            videoRef.current.src = "";
       }

       // Clear canvas
       if (canvasRef.current) {
           const ctx = canvasRef.current.getContext('2d');
           ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
       }
    }
  }, [videoFile, isReady]);

  const stopWebcam = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
  };

  const startWebcam = async () => {
      if (!videoRef.current) return;

      try {
          const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 480, facingMode: "user" }
          });
          streamRef.current = stream;
          setIsWebcamActive(true);

          const video = videoRef.current;
          video.src = "";
          video.srcObject = stream;
          video.muted = true;
          video.onloadeddata = () => {
              video.play().catch(e => console.error("Webcam play error:", e));
              processVideoFrame();
          };
      } catch (err) {
          console.error("Error accessing webcam: ", err);
          alert("Could not access webcam. Please check permissions.");
      }
  };

  const processVideoFrame = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          try {
              const imageBitmap = await createImageBitmap(videoRef.current);
              workerRef.current.postMessage({ type: 'process', payload: imageBitmap }, [imageBitmap]);
          } catch(e) {
              // ignore bitmap errors during fast frames
          }
          animationFrameId.current = requestAnimationFrame(processVideoFrame);
      }
  };

  const drawResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the actual video frame first!
    if (videoRef.current && (isWebcamActive || videoFile)) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (results.poseLandmarks) {
      // Draw full futuristic skeleton overlay
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#00ffcc'; // Neon Cyan
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffcc';

      // Draw connections
      for (const connection of POSE_CONNECTIONS) {
          const start = results.poseLandmarks[connection[0]];
          const end = results.poseLandmarks[connection[1]];

          if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
              ctx.beginPath();
              ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
              ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
              ctx.stroke();
          }
      }

      // Draw Nodes
      ctx.fillStyle = '#ff0055'; // Neon Pink
      for (const landmark of results.poseLandmarks) {
          if (landmark.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
      }
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover hidden"
        playsInline
      ></video>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-20"
        width={640}
        height={480}
      ></canvas>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-gray-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <Video className="w-10 h-10 text-gray-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-400">Initializing Tracking Engine...</span>
            </div>
        </div>
      )}

      {isReady && !videoFile && !isWebcamActive && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-gray-900/80 backdrop-blur-sm">
               <button
                  onClick={startWebcam}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
               >
                  <Play className="w-5 h-5" /> Start Webcam
               </button>
          </div>
      )}
    </div>
  );
}