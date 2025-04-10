import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";
import UpdateIcons from "./components/UpdateIcons.js";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [detections, setDetections] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    const setPreferredCamera = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      const externalCam = videoDevices.find((device) =>
        device.label.includes("C920")
      );
      if (externalCam) {
        setSelectedDeviceId(externalCam.deviceId);
      } else if (videoDevices[0]) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    };
    setPreferredCamera();
  }, []);

  useEffect(() => {
    if (webcamRef.current && canvasRef.current) {
      const video = webcamRef.current.video;
      if (video && video.readyState === 4) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    }
  }, [isCameraOn]);

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
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isCameraOn, captureImage]);

  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || video.readyState !== 4) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / 416;
    const scaleY = canvas.height / 416;

    detections.forEach((detection) => {
      let { x, y, width, height, label, confidence } = detection;

      let rectX = x * scaleX;
      let rectY = y * scaleY;
      let rectWidth = width * scaleX;
      let rectHeight = height * scaleY;

      console.log(`🟩 Drawing Box: x=${rectX}, y=${rectY}, width=${rectWidth}, height=${rectHeight}`);

      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 4;
      ctx.strokeRect(rectX, rectY, rectWidth, rectHeight * 1.17);

      const textBackgroundColor = "#00FF00";
      const fontSize = 15;
      ctx.font = `${fontSize}px Arial`;

      const text = `${label} (${(confidence * 100).toFixed(2)}%)`;
      const textWidth = ctx.measureText(text).width;
      const textHeight = fontSize;

      ctx.fillStyle = textBackgroundColor;
      ctx.fillRect(rectX - 2, rectY - textHeight - 5, textWidth + 10, textHeight + 5);
      ctx.lineWidth = 4;
      ctx.fillStyle = "#000000";
      ctx.fillText(text, rectX + 5, Math.max(rectY - 5, 10));
    });
  }, [detections]);

  useEffect(() => {
    drawBoundingBoxes();
  }, [detections, drawBoundingBoxes]);

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const restartModel = async () => {
    try {
      setIsCameraOn(false);
      setIsActive(false);
      alert("Restarting model. Please ensure the camera is off during this process...");
      setTimeout(() => {
        setIsActive(true);
        setIsCameraOn(true);
      }, 7000);
      const response = await fetch("http://127.0.0.1:15000/restart-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to restart model");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>NG05: Waste Classification System</h1>
        <div className="sub-header">
          <h3>by Austin Wort, Nathan Vu, Hayaan Ahmad, Marcus Uy</h3>
        </div>
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
                  videoConstraints={{
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
              <button className="camera-button style-camera" onClick={toggleCamera}>
                {isCameraOn ? "Stop Camera" : "Start Camera"}
              </button>
              <button className="camera-button style-restart" onClick={restartModel}>
                Restart Model
              </button>
            </div>
          </div>
        </div>

        <div className="right-bar">
          <div>
            <header>Classifications</header>
          </div>
          <UpdateIcons 
            isGarbage={detections.some((det) => det.label === "GARBAGE")} 
            isRecyclable={detections.some((det) => det.label === "RECYCLABLE")} 
            isCompost={detections.some((det) => det.label === "COMPOST")}
          />

          <div className="statsBox">
            <p>Detected Objects: {detections.length}</p>
            <p className="alert">
              {isActive ? "" : "Model is restarting...Please ensure camera remains off for a few seconds..."}
            </p>
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
