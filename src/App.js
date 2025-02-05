import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Adjust canvas size to match webcam video
  useEffect(() => {
    if (webcamRef.current && canvasRef.current) {
      const video = webcamRef.current.video;
      if (video) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    }
  }, [isCameraOn]);

  // Toggle Camera
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
        </div>
      </div>
    </div>
  );
}

export default App;
