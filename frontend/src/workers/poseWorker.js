// Pose Worker script to handle MediaPipe logic off the main thread

// Workaround for MediaPipe commonjs export issues in Vite Workers
import * as MP from '@mediapipe/pose';
const Pose = MP.Pose || MP.default?.Pose || window.Pose;

let pose = null;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'init') {
    pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      // Create a serializable clone of the results to prevent DataCloneError
      // MediaPipe passes an `image` object (GpuBuffer or HTML element) that throws errors.
      const safeResults = {
        poseLandmarks: results.poseLandmarks,
        poseWorldLandmarks: results.poseWorldLandmarks
      };
      self.postMessage({ type: 'results', payload: safeResults });
    });

    self.postMessage({ type: 'initialized' });
  }

  if (type === 'process' && pose) {
    try {
        await pose.send({ image: payload });
    } catch (err) {
        console.error("Worker process error: ", err);
    }
  }
};
