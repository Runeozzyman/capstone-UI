import React, { useRef, useState } from "react";
import useModel from "../hooks/useModel";

const ModelComponent = () => {
  const modelUrl = process.env.PUBLIC_URL + "/web_model/model.json";
  const { model, loading } = useModel(modelUrl);
  const videoRef = useRef(null);
  const [predictions, setPredictions] = useState([]);

  const detectObjects = async () => {
    if (!model || !videoRef.current) return;

    const video = videoRef.current;
    const tensor = tf.browser.fromPixels(video).expandDims(0).toFloat().div(255);
    
    const predictions = await model.executeAsync(tensor);
    console.log(predictions);

    setPredictions(predictions); 
  };

  return (
    <div>
      <h2>Live Object Detection</h2>

      {loading ? (
        <p>Loading model...</p>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline width="640" height="480" />
          <button onClick={detectObjects}>Detect Objects</button>

          <div>
            <h3>Predictions:</h3>
            <pre>{JSON.stringify(predictions, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelComponent;
