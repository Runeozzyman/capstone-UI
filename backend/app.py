from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
from ultralytics import YOLO  
import cv2


app = Flask(__name__)
CORS(app)

MODEL_PATH = "model/best.pt"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model file not found at {MODEL_PATH}")

try:
    model = YOLO(MODEL_PATH)  
    print("✅ Model loaded successfully!")
except Exception as e:
    raise RuntimeError(f"❌ Error loading model: {str(e)}")

model.to("cpu")  
model.eval()  

transform = transforms.Compose([
    transforms.Resize((416, 416)),  
    transforms.ToTensor(),
])

#its ass whatever :3
def get_frame_from_webcam(camera_index=0): #pull a screenshot/frame from webcam, instead of passing stuff
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return None

    ret, frame = cap.read()
    cap.release()
    
    if ret:
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)) #convert form numpy bgr frame to PIL rgb.
        return img #numpy frame in bgr
    else:
        print("Error: Failed to grab frame.")
        return None


@app.route("/predict", methods=["POST"])
def predict():
   
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    file = request.files["image"]
    img = Image.open(io.BytesIO(file.read())).convert("RGB")  
    img_tensor = transform(img).unsqueeze(0)  

    img_tensor = transform(img).unsqueeze(0)  # Add batch dimension
    
    results = model(img_tensor)  
    del img
    detections = []
    for r in results:
        for box in r.boxes:
            x_center, y_center, w, h = box.xywh[0].tolist()
            conf = box.conf[0].item()
            if conf < 0.6:
                break
            cls = int(box.cls[0].item())

            x = x_center - (w / 2)
            y = y_center - (h / 2)

            detections.append({
                "x": x,  
                "y": y,
                "width": w,
                "height": h,
                "label": model.names[cls],  
                "confidence": conf,
            })
    #print("RIGHT BEFORE RETURN: ", detections)
    print(f"✅ Sending {len(detections)} detections")
    return jsonify({"detections": detections})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=15000, debug=True)