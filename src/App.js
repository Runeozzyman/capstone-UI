import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    if (webcamRef.current && canvasRef.current) {
      const video = webcamRef.current.video;
      if (video && video.readyState === 4) {
        // Fixed size to prevent shifting
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    }
  }, [isCameraOn]);

  // Capture an image and send to the backend every 100ms
  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = await fetch(imageSrc).then((res) => res.blob());
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    try {
      const response = await axios.post("http://localhost:15000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.detections) {
        console.log("✅ Detections:", response.data.detections);
        setDetections(response.data.detections);
      } else {
        setDetections([]);
      }
    } catch (error) {
      console.error("❌ Error sending image:", error);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isCameraOn) {
      interval = setInterval(() => {
        captureImage();
      }, 50); // Capture every 100ms (0.1s)
    }
    return () => clearInterval(interval);
  }, [isCameraOn, captureImage]);

  // Draw bounding boxes
  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || video.readyState !== 4) return;

    const ctx = canvas.getContext("2d");

    // Match canvas size to video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fix scaling: Ensure bounding boxes match video size
    const scaleX = canvas.width / 416;  // YOLO processes images at 416x416
    const scaleY = canvas.height / 416;

    detections.forEach((detection) => {
        let { x, y, width, height, label, confidence } = detection;

        // Convert YOLO's (center_x, center_y) to (top-left_x, top-left_y)
        let rectX = (x) * scaleX;
        let rectY = (y) * scaleY;
        let rectWidth = width * scaleX;
        let rectHeight = height * scaleY;

        console.log(`🟩 Drawing Box: x=${rectX}, y=${rectY}, width=${rectWidth}, height=${rectHeight}`);

        // Draw bounding box
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

        // Draw label
        ctx.fillStyle = "#00FF00";
        ctx.font = "16px Arial";
        ctx.fillText(`${label} (${(confidence * 100).toFixed(2)}%)`, rectX, Math.max(rectY - 5, 10));
    });
  }, [detections]);

  useEffect(() => {
    drawBoundingBoxes();
  }, [detections, drawBoundingBoxes]);

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  return (
    <div className="App">
      <div className="header">
        <h1>NG05: Waste Classification System</h1>
      </div>

      <div className="content">
        <div className="camera-container">
          <div className="camera-box">
            {isCameraOn ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="camera-image"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} // Fixes pop-out issue
                />
                <canvas
                  ref={canvasRef}
                  className="bounding-box-overlay"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                />
              </>
            ) : (
              <div className="camera-placeholder">Camera Off</div>
            )}
            <div className="button-container">
              <button className="camera-button" onClick={toggleCamera}>
                {isCameraOn ? "Stop Camera" : "Start Camera"}
              </button>
            </div>
          </div>
        </div>

        <div className="right-bar">
          <div>
            <header>Classifications</header>
          </div>
          <img src="garb.png" alt="garbage" className="right-bar-image" />
          <img src="recyc.png" alt="recyclable" className="right-bar-image" />
          <img src="comp.png" alt="compost" className="right-bar-image" />

          <div className="statsBox">
            <p>Detected Objects: {detections.length}</p>
            {detections.map((det, index) => (
              <p key={index}>
                {det.label} - Confidence: {(det.confidence * 100).toFixed(2)}%
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
