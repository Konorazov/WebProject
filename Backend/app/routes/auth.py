from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from app.schemas import user_schema, users_schema

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User Registration.
    Registers a new user in the system.
    ---
    tags:
      - Authentication
    summary: Register a new user
    description: Allows a new user to create an account by providing a login and password.
    requestBody:
      description: login and password for the new user.
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserInput'
    responses:
      201:
        description: User registered successfully.
        content:
          application/json:
            schema:
              type: object
              properties:
                msg:
                  type: string
                  example: User registered successfully
                user:
                  $ref: '#/components/schemas/User'
      400:
        description: Invalid input (e.g., missing fields, login too short, password too short).
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: login already exists.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400

    login = data.get('login')
    password = data.get('password')

    # Валидация (можно вынести в отдельную функцию или использовать Marshmallow для загрузки и валидации)
    if not login or not password:
        return jsonify({"msg": "login and password are required"}), 400
    if len(login) < 3:
        return jsonify({"msg": "login must be at least 3 characters long"}), 400
    if len(password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters long"}), 400

    if User.query.filter_by(login=login).first():
        return jsonify({"msg": "login already exists"}), 409 # 409 Conflict

    new_user = User(login=login)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "msg": "User registered successfully",
        "user": user_schema.dump(new_user)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User Login.
    Authenticates an existing user. (Currently no session/token is issued).
    ---
    tags:
      - Authentication
    summary: Log in an existing user
    description: Allows an existing user to log in using their login and password.
    requestBody:
      description: User credentials for login.
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserInput'
    responses:
      200:
        description: Login successful.
        content:
          application/json:
            schema:
              type: object
              properties:
                msg:
                  type: string
                  example: Login successful
                user:
                  $ref: '#/components/schemas/User'
      400:
        description: Missing login or password.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      401:
        description: Invalid login or password.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON in request"}), 400

    login = data.get('login')
    password = data.get('password')

    if not login or not password:
        return jsonify({"msg": "login and password are required"}), 400

    user = User.query.filter_by(login=login).first()

    if user and user.check_password(password):
        # Здесь позже будет генерация JWT токена
        return jsonify({
            "msg": "Login successful",
            "user": user_schema.dump(user)
        }), 200
    else:
        return jsonify({"msg": "Invalid login or password"}), 401
