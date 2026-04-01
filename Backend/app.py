import os
import logging
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageOps

# Suppress TensorFlow logging to keep the console clean
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

try:
    from tensorflow.keras.models import load_model
except ImportError:
    print("TensorFlow is not installed. Please install it using requirements.txt")

# Initialize Flask App
app = Flask(__name__)
# Enable CORS for all routes (allows React frontend to communicate with Flask)
CORS(app)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# --- MODEL LOADING ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'mnist_cnn.h5')
# Optional fallback if user actually meant my_model.keras
FALLBACK_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'my_model.keras')

model = None
try:
    if os.path.exists(MODEL_PATH):
        logger.info(f"Loading model from {MODEL_PATH}...")
        model = load_model(MODEL_PATH)
        logger.info("Model loaded successfully!")
    elif os.path.exists(FALLBACK_MODEL_PATH):
        logger.info(f"Loading fallback model from {FALLBACK_MODEL_PATH}...")
        model = load_model(FALLBACK_MODEL_PATH)
        logger.info("Fallback model loaded successfully!")
    else:
        logger.warning(f"Warning: Model not found at {MODEL_PATH}. Prediction will fail until model is added.")
except Exception as e:
    logger.error(f"Failed to load the model: {e}")

# --- PREPROCESSING FUNCTION ---
def preprocess_image(input_image):
    """
    Preprocesses the uploaded image to match the MNIST training data format:
    1. Grayscale
    2. Resize to 28x28
    3. Normalize (divide by 255)
    4. Reshape to (1, 28, 28, 1)
    """
    # 1. Convert to grayscale
    img = input_image.convert('L')
    
    # Optional enhancement: MNIST expects white digits on black background.
    # If the image is mostly white (like a photo of a piece of paper), we invert it.
    # This greatly improves real-world accuracy without breaking standard tests.
    stat = np.array(img)
    if stat.mean() > 127:  
        img = ImageOps.invert(img)

    # 2. Resize to 28x28
    img = img.resize((28, 28), Image.Resampling.LANCZOS)
    
    # Convert to Numpy Array
    img_array = np.array(img)
    
    # 3. Normalize (0 to 1)
    img_array = img_array.astype('float32') / 255.0
    
    # 4. Reshape for CNN input format (Batch Dimension, Height, Width, Channels)
    # Shape becomes: (1, 28, 28, 1)
    img_array = img_array.reshape(1, 28, 28, 1)
    
    return img_array

# --- API ENDPOINTS ---
@app.route('/predict', methods=['POST'])
def predict_digit():
    """
    Endpoint: POST /predict
    Accepts an image file via multipart/form-data and returns the predicted digit.
    """
    logger.info("Received a new prediction request.")

    # 1. Error Handling: Check if model is loaded
    if model is None:
        logger.error("Model is not loaded.")
        return jsonify({"error": "Server error. AI model is currently unavailable."}), 500

    # 2. Error Handling: Check if file is in the request
    if 'file' not in request.files:
        logger.warning("No file part found in the request.")
        return jsonify({"error": "No file uploaded. Please upload a valid image."}), 400
    
    file = request.files['file']

    # 3. Error Handling: Check if user submitted an empty file
    if file.filename == '':
        logger.warning("Empty filename received.")
        return jsonify({"error": "No selected file."}), 400

    try:
        # Load the image using PIL
        image = Image.open(file.stream)
        logger.info(f"Image successfully opened. Format: {image.format}, Size: {image.size}")

        # Preprocess the image
        processed_image = preprocess_image(image)

        # Make prediction
        # model.predict returns an array of probabilities for each class (0-9)
        predictions = model.predict(processed_image)
        
        # Get the highest probability class
        predicted_digit = int(np.argmax(predictions, axis=1)[0])
        
        # Get the actual probability / confidence score for that class
        confidence_score = float(np.max(predictions))

        logger.info(f"Prediction successful! Digit: {predicted_digit}, Confidence: {confidence_score:.4f}")

        # Return Output JSON
        return jsonify({
            "prediction": predicted_digit,
            "confidence": confidence_score
        }), 200

    except Exception as e:
        logger.error(f"Error during prediction process: {str(e)}", exc_info=True)
        return jsonify({"error": f"An error occurred while processing the image: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify backend is running."""
    return jsonify({"status": "healthy", "model_loaded": model is not None}), 200

# --- RUN SERVER ---
if __name__ == '__main__':
    # Run the Flask app
    # host='0.0.0.0' allows external connections if needed (default is 127.0.0.1)
    logger.info("Starting the Flask production server...")
    app.run(host='127.0.0.1', port=5000, debug=True)
