import React, { useState } from "react";
import axios from "axios";

const ImageUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [prediction, setPrediction] = useState("");

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post("http://localhost:5000/predict", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            setPrediction(response.data.prediction);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error processing the image.");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Upload an Image for Classification</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUpload} style={{ marginLeft: "10px" }}>Upload</button>

            {prediction && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Prediction:</h3>
                    <p>{prediction}</p>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
