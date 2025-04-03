FROM python:3.10

# Install system dependencies
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

WORKDIR /app

COPY . /app

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install flask flask-cors torch torchvision pillow ultralytics opencv-python

EXPOSE 15000

CMD ["python", "app.py"]
