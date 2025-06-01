from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flasgger import Swagger
from flask_socketio import SocketIO
import os

from .config import Config 

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
ma = Marshmallow()
socketio = SocketIO()
swagger = Swagger() 

connected_user_sids_map = {} 

def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # --- Конфигурация Swagger (OpenAPI 3.0) ---
    app.config['SWAGGER'] = {
        'title': 'Chat App API',
        'version': '1.0.0',  # Версия твоего API
        'uiversion': 3,      # Используем Swagger UI 3.x
        'openapi': '3.0.2',  # Явно указываем версию спецификации OpenAPI
        'specs_route': '/api/docs/',  # URL для Swagger UI
        'doc_expansion': 'list',    # Отображение операций: 'none', 'list', 'full'
        'validations': True,        # Включить валидацию схем (если Flasgger это поддерживает явно)
        'supported_submit_methods': ['get', 'post', 'put', 'delete', 'patch'], # Методы для "Try it out"
        'components': {
            'schemas': {
                'User': {
                    'type': 'object',
                    'properties': {
                        'id': {
                            'type': 'integer',
                            'description': 'Unique identifier for the user.',
                            'example': 1,
                            'readOnly': True 
                        },
                        'login': {
                            'type': 'string',
                            'description': 'User\'s login.',
                            'example': 'john_doe'
                        },
                        'created_at': {
                            'type': 'string',
                            'format': 'date-time',
                            'description': 'Timestamp of user creation.',
                            'example': '2023-05-29T10:20:30Z',
                            'readOnly': True
                        }
                    }
                },
                'UserInput': { 
                    'type': 'object',
                    'required': ['login', 'password'],
                    'properties': {
                        'login': {
                            'type': 'string',
                            'minLength': 3,
                            'description': 'User\'s desired nickname.',
                            'example': 'new_user_123'
                        },
                        'password': {
                            'type': 'string',
                            'format': 'password', 
                            'minLength': 6,
                            'description': 'User\'s password (at least 6 characters).',
                            'example': 'SecureP@ss1'
                        }
                    }
                },
                'Error': {
                    'type': 'object',
                    'properties': {
                        'msg': {
                            'type': 'string',
                            'description': 'Error message.',
                            'example': 'An error occurred.'
                        }
                    }
                },
                'SuccessMessage': {
                     'type': 'object',
                     'properties': {
                         'msg': {
                             'type': 'string',
                             'description': 'Success message',
                             'example': 'Operation successful'
                         }
                     }
                }
            }
        },
    }

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass 

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, supports_credentials=True)
    ma.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # --- Регистрация Blueprints ---
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from app.routes.user import user_bp
    app.register_blueprint(user_bp, url_prefix='/api/user')
    from app.routes.messages import messages_bp
    app.register_blueprint(messages_bp, url_prefix='/api/messages')

    from . import models
    from app.socket import chat_events
    chat_events.register_socket_events( 
        socketio, 
        db, 
        connected_user_sids_map, 
        models.User, 
        models.Message
    )

    swagger.init_app(app)


    return app