from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
from ultralytics import YOLO  
import cv2
import gc  # Garbage collection
import sys


app = Flask(__name__)
CORS(app)
model = None

#MODEL_PATH = "model/best.pt"
MODEL_PATH = "model/best_final3Combined.pt"
#MODEL_PATH = "model/best_dataset3_40epochs.pt"
#MODEL_PATH = "model/best_dataset3_20Epochs.pt"



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



transform = transforms.Compose([
    transforms.Resize((416, 416)),  
    transforms.ToTensor(),
])
def start_model():
    global model
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"❌ Model file not found at {MODEL_PATH}")
    try:
        if model is not None:
            del model
            print("✅ DELETED PREV MODEL INSTANCE SUCCESFFULY")
        model = YOLO(MODEL_PATH)  
        print("✅ ✅ Model loaded successfully!")
    except Exception as e:
        raise RuntimeError(f"❌ Error loading model: {str(e)}")
    model.to("cpu")
    return model
model = start_model()
model.eval()    

@app.route("/restart-model", methods=["POST"])
def restart_model():
    """Restarts this entire Flask application"""
    try:
        print("🔄 Restarting the server...")
        os.execv(sys.executable, ['python'] + sys.argv)  # Restart the script
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Restarting server..."}), 200



@app.route("/predict", methods=["POST"])
def predict():
    try:

        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        file = request.files["image"]
        img = Image.open(io.BytesIO(file.read())).convert("RGB")  
        img_tensor = transform(img).unsqueeze(0)  # Add batch dimension
        global model
        results = model(img_tensor)  
        del img
        detections = []
        for r in results:
            for box in r.boxes:
                x_center, y_center, w, h = box.xywh[0].tolist()
                conf = box.conf[0].item()
                cls = int(box.cls[0].item())
                if conf > 0.1 and h < 300 and w < 300: #cutoff part for all classifications. 
                    #also elimnates when model detects entire screen as something (never quite the correct classificication)
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
                    print(f"✅✅ Sending {len(detections)} detections")      
        return jsonify({"detections": detections})
    except Exception as e:
        print("Model probably still not ready... please wait a bit...")
        return jsonify({"error (at beginnning)": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=15000, debug=True)