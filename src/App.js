import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const webcamRef = useRef(null);

  const startVideoFeed = () => {
    if (webcamRef.current) {
      webcamRef.current.video.play();
    }
  };

  const stopVideoFeed = () => {
    if (webcamRef.current) {
      webcamRef.current.video.pause();
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Waste Classification System</h1>
      </div>

      <div className="content">
        <div className="camera-container">
          <div className="camera-box">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="camera-image"
            />
            <div className="button-container">
              <button className="camera-button" onClick={startVideoFeed}>Start Video Feed</button>
              <button className="camera-button" onClick={stopVideoFeed}>Stop</button>
            </div>
          </div>
        </div>

        <div className="right-bar">
          <p>Classifications</p>
          <img src="garb.png" alt="garbage" className="right-bar-image" />
          <img src="recyc.png" alt="recyclable" className="right-bar-image" />
          <img src="comp.png" alt="compost" className="right-bar-image" />
        </div>
      </div>
    </div>
  );
}

export default App;