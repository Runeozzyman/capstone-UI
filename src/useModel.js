import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";

const useModel = (modelUrl) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Loading model...");
        const loadedModel = await tf.loadGraphModel(modelUrl);
        setModel(loadedModel);
        console.log("Model loaded successfully!");
      } catch (error) {
        console.error("Error loading model:", error);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [modelUrl]);

  return { model, loading };
};

export default useModel;
