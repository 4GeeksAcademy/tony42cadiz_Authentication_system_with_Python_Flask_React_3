"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from werkzeug.security import generate_password_hash, check_password_hash

api = Blueprint('api', __name__)

from flask_jwt_extended import create_access_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required

@api.route('/signup', methods=['POST'])
def handle_signup():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({
            "success": False, 
            "msg": "Email and password are required"
        }), 400
    
    user = User.query.filter_by(email=data['email']).first()
    if user:
        return jsonify({
            "success": False,
            "msg": "User already exists"
        }), 409
    
    try:
        new_user = User(
            email=data['email'],
            password=generate_password_hash(data['password']),
            is_active=True
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "msg": "User created successfully",
            "email": data['email']
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "msg": "Server error: " + str(e)
        }), 500

@api.route('/login', methods=['POST'])
def handle_login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required"}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"message": "Invalid credentials"}), 401
    
    access_token = create_access_token(identity=data['email'])
    return jsonify(access_token=access_token), 200

@api.route('/private', methods=['GET'])
@jwt_required()
def private_route():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@api.route("/hello", methods=["GET"])
@jwt_required() 
def get_hello():
    email = get_jwt_identity()
    return jsonify(message=f"Hello {email}"), 200

@api.route('/user', methods=['GET'])
def get_users():
    users = User.query.all()
    if not users:
        return jsonify(message="No users found"), 404
    all_users = list(map(lambda x: x.serialize(), users))
    return jsonify(users=all_users), 200
