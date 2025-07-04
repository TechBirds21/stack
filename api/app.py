from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Mock user database - in a real app, use a proper database
users = {
    "admin@homeandown.com": {
        "password": "Frisco@Homeandown@2025",  # In a real app, store hashed passwords
        "name": "Admin User",
        "role": "admin"
    }
}

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400
    
    user = users.get(email)
    if user and user['password'] == password:
        # In a real app, generate and return a JWT token
        return jsonify({
            "success": True,
            "user": {
                "email": email,
                "name": user['name'],
                "role": user['role']
            }
        })
    
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)