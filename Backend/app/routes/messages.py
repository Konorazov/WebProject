from flask import Blueprint, jsonify, request
from app import db
from app.models import Message

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/history/<int:user1_id>/<int:user2_id>', methods=['GET'])
def get_message_history(user1_id, user2_id):
    """
    Get Full Message History.
    Retrieves all chat messages between two users.
    ---
    tags:
      - Messages
    parameters:
      - in: path
        name: user1_id
        required: true
        schema:
          type: integer
        description: ID of the first user in the chat.
      - in: path
        name: user2_id
        required: true
        schema:
          type: integer
        description: ID of the second user in the chat.
    responses:
      200:
        description: Full message history retrieved successfully.
        content:
          application/json:
            schema:
              type: array # Теперь возвращаем просто массив сообщений
              items:
                $ref: '#/components/schemas/Message' # Ссылка на вашу Message схему
      401: # Добавьте логику авторизации, если нужно
        description: Unauthorized.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      404:
        description: One or both users not found.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    # Здесь должна быть логика аутентификации и авторизации.
    # Например, убедиться, что текущий аутентифицированный пользователь
    # является user1_id или user2_id.
    # Также можно добавить проверку, существуют ли пользователи с такими ID.

    # --- Проверка существования пользователей (опционально, но рекомендуется) ---
    from app.models import User 
    user1 = User.query.get(user1_id)
    user2 = User.query.get(user2_id)
    if not user1 or not user2:
        return jsonify({'msg': 'One or both users not found'}), 404

    messages = Message.query.filter(
        ( (Message.sender_id == user1_id) & (Message.recipient_id == user2_id) ) |
        ( (Message.sender_id == user2_id) & (Message.recipient_id == user1_id) )
    ).order_by(Message.timestamp.asc()).all() 

    return jsonify([msg.to_dict() for msg in messages]), 200