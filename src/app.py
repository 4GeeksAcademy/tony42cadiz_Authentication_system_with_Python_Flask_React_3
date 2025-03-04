"""
This module takes care of starting the API Server, Loading the DB, and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from api.utils import APIException, generate_sitemap
from api.models import db, User
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands

from flask_jwt_extended import (
    create_access_token, get_jwt_identity, jwt_required, JWTManager
)
from flask_bcrypt import Bcrypt
from datetime import timedelta

# Configuración de entorno
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../public/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# Configuración de seguridad
bcrypt = Bcrypt(app)
app.config["JWT_SECRET_KEY"] = os.environ.get('JWT_SECRET', 'default-secret-key')  # 🔒 Evita fallos por falta de variable
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

# Configuración de base de datos
db_url = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://") if db_url else "sqlite:////tmp/test.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicialización de componentes
Migrate(app, db, compare_type=True)
db.init_app(app)
CORS(app)
setup_admin(app)
setup_commands(app)

# Registro de Blueprints
app.register_blueprint(api, url_prefix='/api')

# Manejador de errores
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Generador de sitemap
@app.route('/')
def sitemap():
    return generate_sitemap(app) if ENV == "development" else send_from_directory(static_file_dir, 'index.html')

# Manejo de archivos estáticos
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response

# 🔐 Ruta para generar token de autenticación
@app.route("/api/token", methods=["POST"])
def create_token():
    body = request.get_json(silent=True)
    
    if not body:
        return jsonify({"msg": "Request body is missing"}), 400
    
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"msg": "Invalid credentials"}), 401

    access_token = create_access_token(identity=user.email)
    return jsonify(access_token=access_token), 200

# 📌 Ruta para registrar nuevos usuarios
@app.route('/api/user', methods=['POST'])
def add_new_user():
    body = request.get_json(silent=True)
    
    if not body:
        return jsonify({"msg": "Request body is missing"}), 400
    
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 409  # HTTP 409: Conflicto

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password=hashed_password, is_active=True)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": f"User with email {email} has been created"}), 201  # HTTP 201: Created

# 🚀 Iniciar servidor
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
