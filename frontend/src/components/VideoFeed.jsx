import React, { useRef, useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import * as MP from '@mediapipe/camera_utils';

const Camera = MP.Camera || MP.default?.Camera || window.Camera;

export function VideoFeed({ videoFile, onPoseUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameId = useRef(null);
  const [isReady, setIsReady] = useState(false);

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
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (videoFile) {
        // Stop webcam if running
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        const video = videoRef.current;
        video.src = videoFile;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;

        video.onloadeddata = () => {
            video.play();
            processVideoFrame();
        };
    } else {
        startCamera();
    }
  }, [videoFile, isReady]);

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

  const startCamera = () => {
    if (videoRef.current && isReady && Camera && !videoFile) {
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
             try {
                const imageBitmap = await createImageBitmap(videoRef.current);
                workerRef.current.postMessage({ type: 'process', payload: imageBitmap }, [imageBitmap]);
             } catch(e) { }
          }
        },
        width: 640,
        height: 480
      });
      cameraRef.current.start();
    }
  };

  const drawResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // Draw futuristic skeleton overlay
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#00ffcc'; // Neon Cyan
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffcc';

      const rightShoulder = results.poseLandmarks[12];
      const leftShoulder = results.poseLandmarks[11];

      if (rightShoulder && leftShoulder) {
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
        ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
        ctx.stroke();
      }

      ctx.fillStyle = '#ff0055'; // Neon Pink
      for (const landmark of results.poseLandmarks) {
        ctx.beginPath();
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
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
    </div>
  );
}