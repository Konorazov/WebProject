from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from app.schemas import user_schema, users_schema

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/users', methods=['GET'])
def get_all_users():
    """
    Get All Users.
    Retrieves a list of all registered users.
    ---
    tags:
      - Users
    summary: Retrieve all users
    description: Fetches a list of all users currently registered in the system.
    responses:
      200:
        description: A list of users.
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/User'
      500: # Пример ответа об ошибке сервера, если что-то пойдет не так с запросом к БД
        description: Internal server error.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    try:
        all_users = User.query.all()
        return jsonify(users_schema.dump(all_users)), 200
    except Exception as e:
        # Логирование ошибки e
        return jsonify({"msg": "Failed to retrieve users"}), 500
    

@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    """
    Get User by ID.
    Retrieves public information about a user.
    ---
    tags:
      - Users
    parameters:
      - in: path
        name: user_id
        required: true
        schema:
          type: integer
        description: The ID of the user to retrieve.
    responses:
      200:
        description: User information retrieved successfully.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User' # Ссылка на вашу User схему в Swagger
      404:
        description: User not found.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    user = User.query.get(user_id)
    if user:
        # return user_schema.dump(user), 200 # Вариант с Marshmallow
        return jsonify({
            'id': user.id,
            'login': user.login,
            'created_at': user.created_at.isoformat() + 'Z' if user.created_at else None
        }), 200
    return jsonify({'msg': 'User not found'}), 404