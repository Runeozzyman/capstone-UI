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
      if (video) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    }
  }, [isCameraOn]);

  // Capture an image and send it to the backend
  const captureImage = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const blob = await fetch(imageSrc).then((res) => res.blob());
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      try {
        const response = await axios.post("http://localhost:15000/predict", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setDetections(response.data.detections);
      } catch (error) {
        console.error("Error sending image:", error);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isCameraOn) captureImage();
    }, 1000); // Capture every second

    return () => clearInterval(interval);
  }, [isCameraOn, captureImage]);

  // Draw bounding boxes
  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection) => {
      const { x, y, width, height, label, confidence } = detection;

      // Scale bounding boxes based on the webcam size
      const scaleX = canvas.width / 416;
      const scaleY = canvas.height / 416;

      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);

      ctx.fillStyle = "#00FF00";
      ctx.font = "16px Arial";
      ctx.fillText(`${label} (${(confidence * 100).toFixed(2)}%)`, x * scaleX, (y * scaleY) - 5);
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
                />
                <canvas ref={canvasRef} className="bounding-box-overlay" />
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
