from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image
import os
from ultralytics import YOLO  
import gc  # Garbage collection


#######PROGRAM TO VIEW MODEL RUNNING WITHOUT SENDING TO FRONTEND USING WEBCAM DIRECTLY########

app = Flask(__name__)
CORS(app)
#cap = cv2.VideoCapture(0)  # Open webcam

MODEL_PATH = "model/best.pt"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model file not found at {MODEL_PATH}")

try:
    model = YOLO(MODEL_PATH)  
    print("✅ Model loaded successfully! ver0.1")
    print(model.names)
except Exception as e:
    raise RuntimeError(f"❌ Error loading model: {str(e)}")

def display_results(label, conf, x,y,w,h):
    print("==============")
    print("CONFIDENCE: ", conf)    
    print("LABEL: ", label)
    print("X: ", x)
    print("Y: ", y)
    print("W: ", w)
    print("H: ", h)
#results = model(source=0, stream=True)  # generator of Results objects
#@app.route("/predict", methods=["POST"])
def predict_nosend(): 
    results = model(source=0, stream=True, save=False, show=True)  # generator of Results objects. webcam mode
    while True:     
        for r in results:
            detections = []
            for box in r.boxes:
                x_center, y_center, w, h = box.xywh[0].tolist()
                conf = box.conf[0].item()
                label = model.names[int(box.cls[0].item())]
                x = x_center - (w / 2)
                y = y_center - (h / 2)
                display_results(label, conf, x,y,w,h) #splitted it cuz ugly idk
                detections.append({
                "x": x,  
                "y": y,
                "width": w,
                "height": h,
                "label": label,  
                "confidence": conf,
                })
                torch.cuda.empty_cache()  # If using GPU               
            gc.collect()  # Force garbage collection
        print("RIGHT BEFORE RETURN: ", detections)
        print(f"✅ Sending {len(detections)} detections")


if __name__ == "__main__":
    predict_nosend()



