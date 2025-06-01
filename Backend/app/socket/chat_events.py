from flask import request
from flask_socketio import emit, disconnect

sio = None
db = None
user_sid_map = None # {user_id: sid}
User = None
Message = None

def register_socket_events(socketio_instance, db_instance, sid_map, user_model, message_model):
    global sio, db, user_sid_map, User, Message
    sio = socketio_instance
    db = db_instance
    user_sid_map = sid_map
    User = user_model
    Message = message_model

    @sio.on('connect')
    def handle_connect():
        print(f"Client connected: {request.sid}. Awaiting 'join_chat'.")

    @sio.on('disconnect')
    def handle_disconnect():
        disconnected_sid = request.sid
        user_id_to_remove = next((uid for uid, sid in user_sid_map.items() if sid == disconnected_sid), None)
        if user_id_to_remove and user_id_to_remove in user_sid_map:
            del user_sid_map[user_id_to_remove]
            print(f"User {user_id_to_remove} (SID: {disconnected_sid}) disconnected from chat.")

    @sio.on('join_chat')
    def handle_join_chat(data):
        
        user_id_str = data.get('user_id')
        client_sid = request.sid

        if not user_id_str:
            return emit('join_chat_error', {'message': 'user_id is required.'}, room=client_sid)
        try:
            user_id = int(user_id_str)
        except ValueError:
            return emit('join_chat_error', {'message': 'Invalid user_id format.'}, room=client_sid)

        if not User.query.get(user_id):
            return emit('join_chat_error', {'message': f'User {user_id} not found.'}, room=client_sid)

        user_sid_map[user_id] = client_sid
        print(f"User {user_id} joined chat with SID {client_sid}.")
        emit('joined_chat_ack', {'user_id': user_id, 'sid': client_sid, 'status': 'success'}, room=client_sid)

    @sio.on('send_personal_message')
    def handle_send_personal_message(data):
        sender_sid = request.sid
        sender_id = next((uid for uid, sid in user_sid_map.items() if sid == sender_sid), None)

        if sender_id is None:
            return emit('message_error', {'error': "Sender not joined to chat. Please 'join_chat' first."}, room=sender_sid)

        recipient_id_str = data.get('recipient_id')
        content = data.get('content')

        if not recipient_id_str or not content:
            return emit('message_error', {'error': 'recipient_id and content are required.'}, room=sender_sid)
        try:
            recipient_id = int(recipient_id_str)
        except ValueError:
            return emit('message_error', {'error': 'Invalid recipient_id format.'}, room=sender_sid)

        if not User.query.get(recipient_id):
            return emit('message_error', {'error': f'Recipient {recipient_id} not found.'}, room=sender_sid)
        if sender_id == recipient_id:
            return emit('message_error', {'error': 'Cannot send message to yourself.'}, room=sender_sid)

        new_message = Message(sender_id=sender_id, recipient_id=recipient_id, content=content)
        db.session.add(new_message)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"DB Error saving PM: {e}")
            return emit('message_error', {'error': 'Database error saving message.'}, room=sender_sid)

        message_to_send = new_message.to_dict()
        recipient_sid = user_sid_map.get(recipient_id)

        if recipient_sid:
            sio.emit('receive_personal_message', message_to_send, room=recipient_sid)
        
        sio.emit('receive_personal_message', message_to_send, room=sender_sid)