import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="header">
        <h1>Waste Classification System</h1>
      </div>

      <div className="content">
        <div className="camera-container">
          <div className="camera-box">
            <img src="cam.png" alt="camera" className="camera-image" />
            <div className="button-container">
              <button className="camera-button">Start Video Feed</button>
              <button className="camera-button">Stop</button>
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