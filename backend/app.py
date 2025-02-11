from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
from ultralytics import YOLO  # Assuming YOLO model

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Load PyTorch Model (assuming it's a YOLO model)
MODEL_PATH = "model/best_mv3.pt"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

# Load the model
try:
    model = YOLO(MODEL_PATH)  # If using Ultralytics YOLO
    print("✅ Model loaded successfully!")
except Exception as e:
    raise RuntimeError(f"Error loading model: {str(e)}")

model.to("cpu")  # Ensure model runs on CPU
model.eval()  # Set model to evaluation mode

# Define image preprocessing (Resize to 416x416)
transform = transforms.Compose([
    transforms.Resize((416, 416)),  # Resize input to match model expectations
    transforms.ToTensor(),
])

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = Image.open(io.BytesIO(file.read())).convert("RGB")  # Convert to RGB
    img_tensor = transform(img).unsqueeze(0)  # Add batch dimension

    with torch.no_grad():
        results = model(img_tensor)  # Perform inference

    detections = []
    for r in results:
        for box in r.boxes:  # Assuming YOLO returns box objects
            x, y, w, h = box.xywh[0].tolist()
            conf = box.conf[0].item()
            cls = int(box.cls[0].item())  # Class label
            
            detections.append({
                "x": int(x - w / 2),  # Convert center format to top-left format
                "y": int(y - h / 2),
                "width": int(w),
                "height": int(h),
                "label": cls,
                "confidence": conf,
            })

    return jsonify({"detections": detections})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=15000, debug=True)
