import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState("Loading model...");
  const [modelInputShape, setModelInputShape] = useState(""); // Model's expected input shape
  const [debugPredictions, setDebugPredictions] = useState("Waiting for predictions..."); // Model output

  // 🟢 Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatus("Loading model...");
        const loadedModel = await tf.loadGraphModel(process.env.PUBLIC_URL + "/web_model/model.json");
        setModel(loadedModel);
        setStatus("✅ Model loaded successfully!");

        // 🔍 Extract and display model's actual expected input shape
        const shape = loadedModel.inputs[0].shape;
        setModelInputShape(`Model Expected Input Shape: ${JSON.stringify(shape)}`);
      } catch (error) {
        setStatus("❌ Error loading model.");
        setModelInputShape(`Error: ${error.message}`);
      }
    };

    loadModel();
  }, []);

  // 🟢 Object detection function (Ensures 128-Channel Input)
  const detectObjects = useCallback(async () => {
    if (!model || !webcamRef.current || !canvasRef.current) {
      setDebugPredictions("⚠️ detectObjects() not running.");
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      setDebugPredictions("⚠️ Webcam feed not ready.");
      return;
    }

    // Convert webcam frame to a tensor (originally RGB)
    let tensor = tf.browser.fromPixels(video); // Shape: [height, width, 3]

    // 🔍 Convert RGB to grayscale (shape: [height, width, 1])
    tensor = tf.mean(tensor, -1, true); 

    // 🔍 Resize tensor to match model input size (shape: [416, 416, 1])
    tensor = tf.image.resizeBilinear(tensor, [416, 416]);

    // 🔍 Expand dimensions to include batch (shape: [1, 416, 416, 1])
    tensor = tensor.expandDims(0);

    // 🔍 Tile grayscale channel to create 128 channels (shape: [1, 416, 416, 128])
    tensor = tf.tile(tensor, [1, 1, 1, 128]); 

    // 🔍 Normalize pixel values to [0,1]
    tensor = tensor.toFloat().div(255.0);

    // 🔍 Display the actual shape of the input tensor directly on UI
    setDebugPredictions(`🔍 Preprocessed Tensor Shape: ${JSON.stringify(tensor.shape)}`);

    try {
      const predictions = await model.executeAsync(tensor);

      if (!Array.isArray(predictions) || predictions.length === 0) {
        setDebugPredictions("⚠️ Model output is empty!");
        return;
      }

      // Extract predictions (assuming YOLO-style output)
      const [boxes, scores, classes] = predictions.map(t => t.arraySync());

      if (boxes.length === 0 || scores.length === 0) {
        setDebugPredictions("⚠️ Model detected nothing!");
        return;
      }

      setDebugPredictions(`✅ Boxes: ${JSON.stringify(boxes)}\n✅ Scores: ${JSON.stringify(scores)}`);
      drawBoundingBoxes(boxes, scores, classes);
    } catch (error) {
      setDebugPredictions(`❌ Error: ${error.message}`);
    }

    tensor.dispose();
  }, [model]);

  // 🟢 Run object detection every 500ms when model is loaded
  useEffect(() => {
    if (model) {
      const interval = setInterval(() => {
        detectObjects();
      }, 500);
      return () => clearInterval(interval);
    }
  }, [model, detectObjects]); // ✅ Now `detectObjects` is properly referenced

  // 🟢 Draw bounding boxes on the canvas
  const drawBoundingBoxes = (boxes, scores, classes) => {
    if (!canvasRef.current || !webcamRef.current) return;
    const ctx = canvasRef.current.getContext("2d");

    // Get video dimensions
    const video = webcamRef.current.video;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Set canvas size to match video
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous boxes

    boxes.forEach((box, index) => {
      if (scores[index] > 0.5) { // Confidence threshold
        let [y, x, height, width] = box;

        // Convert relative coordinates to absolute pixel positions
        x *= videoWidth;
        y *= videoHeight;
        width *= videoWidth;
        height *= videoHeight;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText(`Class: ${classes[index]}`, x, y - 5);
      }
    });
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
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="camera-image"
            />
            <canvas ref={canvasRef} className="bounding-box-overlay" />
          </div>
        </div>

        <div className="right-bar">
          <p>{status}</p> {/* Displays model status */}
          <p style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>{modelInputShape}</p> {/* Model's actual expected input shape */}
          <p style={{ color: "blue", fontSize: "12px", marginTop: "10px" }}>
            Debug Predictions: {debugPredictions}
          </p> {/* Model output */}
          <img src="garb.png" alt="garbage" className="right-bar-image" />
          <img src="recyc.png" alt="recyclable" className="right-bar-image" />
          <img src="comp.png" alt="compost" className="right-bar-image" />
        </div>
      </div>
    </div>
  );
}

export default App;
