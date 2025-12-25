// 1. Global Declarations for CDN variables
declare const Hands: any;
declare const HAND_CONNECTIONS: any;
declare function drawConnectors(ctx: any, landmarks: any, connections: any, style?: any): void;
declare function drawLandmarks(ctx: any, landmarks: any, style?: any): void;

// 2. DOM Elements
const videoElement = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d")!;
const overlayImg = document.getElementById("overlay-img") as HTMLImageElement;
const gestureText = document.getElementById("Gesture-output-text") as HTMLDivElement;

// 3. Initialize MediaPipe Hands with direct WASM links
const hands = new Hands({
  locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6, // Slightly higher for better stability
  minTrackingConfidence: 0.5
});

// 4. Processing Results
hands.onResults((results: any) => {
  // Clear the canvas every single frame
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  let currentGesture = "No Gesture Detected...";
  let showImg = "/normal.png";

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw the skeleton
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 5 });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });

      // Landmark indices: 4=ThumbTip, 3=ThumbIP, 8=IndexTip, 6=IndexPIP
      const isThumbUp = landmarks[4].x < landmarks[3].x; // Adjust if mirroring is off
      const isIndexUp = landmarks[8].y < landmarks[6].y;
      const isMiddleUp = landmarks[12].y < landmarks[10].y;
      const isRingUp = landmarks[16].y < landmarks[14].y;
      const isPinkyUp = landmarks[20].y < landmarks[18].y;

      const states = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp];

      // Gesture Recognition Logic
      if (states.every((s) => !s)) {
        currentGesture = "SHOCKED";
        showImg = "/shocked.png";
      } else if (!isThumbUp && isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        currentGesture = "EUREKA";
        showImg = "/eurika.jpg";
      } else if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        currentGesture = "HMM";
        showImg = "/hmm.png";
      } else {
        currentGesture = "HAND DETECTED";
      }
    }
  }

  // Update visual UI
  gestureText.innerText = currentGesture;
  overlayImg.src = showImg;
  canvasCtx.restore();
});

// 5. Camera & Loop Controller
async function startApp() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 700, height: 480 },
    });

    videoElement.srcObject = stream;
    
    // Wait for the video to actually start playing before looping
    videoElement.onloadeddata = async () => {
      await videoElement.play();
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      const runDetection = async () => {
        if (!videoElement.paused && !videoElement.ended) {
          await hands.send({ image: videoElement });
        }
        requestAnimationFrame(runDetection);
      };
      
      console.log("AI Gesture Tracker Started!");
      runDetection();
    };
  } catch (err) {
    console.error("Critical Error:", err);
    gestureText.innerText = "CAMERA BLOCKED";
  }
}

startApp();