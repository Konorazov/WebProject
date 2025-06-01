import styles from "./PersonalChat.module.css";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import { io, Socket } from "socket.io-client";
import { baseUrl } from "../../../api/constants";
import { getMessagesServer } from "../../../api/chat";

// Предполагаем, эти интерфейсы где-то есть или данные им соответствуют

interface ChatPageProps {
  currentUserId: number;
  chatPartnerId: number;
  chatPartnerName?: string;
}

export const PersonalChat: React.FC<ChatPageProps> = ({
  currentUserId,
  chatPartnerId,
  chatPartnerName = `User ${chatPartnerId}`,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isJoined, setIsJoined] = useState(false); // Новое состояние
  const [socketError, setSocketError] = useState<string | null>(null); // Для ошибок сокета/присоединения

  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);

  // Загрузка начальной истории сообщений
  useEffect(() => {
    if (!currentUserId || !chatPartnerId) {
      setMessages([]);
      return;
    }
    const getMessages = async () => {
      const data: GetMessagesRequest = {
        sender_id: currentUserId,
        recipient_id: chatPartnerId,
      };
      try {
        const curMessages = await getMessagesServer(data);
        setMessages(Array.isArray(curMessages) ? curMessages : []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
    };
    getMessages();
  }, [currentUserId, chatPartnerId]);

  // Подключение к Socket.IO и обработка событий
  useEffect(() => {
    if (!currentUserId) return;

    const newSocket = io(baseUrl, {
      // query параметр для userId здесь не нужен, т.к. сервер использует 'join_chat'
    });
    setSocket(newSocket);
    setSocketError(null); // Сбрасываем ошибки при новом подключении
    setIsJoined(false); // Сбрасываем статус присоединения

    newSocket.on("connect", () => {
      console.log(
        "Socket connected:",
        newSocket.id,
        ". Attempting to join chat for user",
        currentUserId
      );
      // Отправляем событие join_chat после успешного подключения
      newSocket.emit("join_chat", { user_id: currentUserId.toString() }); // Убедимся, что user_id это строка, как ожидает сервер
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsJoined(false);
      setSocketError(`Disconnected: ${reason}.`);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setIsJoined(false);
      setSocketError(`Connection Error: ${err.message}`);
    });

    // Обработка подтверждения присоединения к чату
    newSocket.on("joined_chat_ack", (data) => {
      if (data.status === "success" && data.user_id === currentUserId) {
        console.log("Successfully joined chat as user:", data.user_id);
        setIsJoined(true);
        setSocketError(null);
      } else {
        // Это не должно произойти, если сервер правильно обрабатывает user_id
        console.error("Failed to join chat or user_id mismatch:", data);
        setIsJoined(false);
        setSocketError(
          data.message || "Failed to join chat: acknowledgment error."
        );
      }
    });

    // Обработка ошибки присоединения к чату
    newSocket.on("join_chat_error", (err) => {
      console.error("Join chat error from server:", err.message);
      setIsJoined(false);
      setSocketError(`Join chat error: ${err.message}`);
    });

    newSocket.on("receive_personal_message", (incomingMessage: Message) => {
      console.log("Received message via socket:", incomingMessage);
      const isFromCurrentPartner =
        incomingMessage.sender_id === chatPartnerId &&
        incomingMessage.recipient_id === currentUserId;
      const isToCurrentPartnerByMe = // Сообщение от меня, подтвержденное сервером
        incomingMessage.sender_id === currentUserId &&
        incomingMessage.recipient_id === chatPartnerId;

      if (isFromCurrentPartner || isToCurrentPartnerByMe) {
        setMessages((prevMessages) => {
          // Простая проверка на дублирование по ID
          if (!prevMessages.find((msg) => msg.id === incomingMessage.id)) {
            return [...prevMessages, incomingMessage];
          }
          return prevMessages;
        });
      }
    });

    newSocket.on("message_error", (err) => {
      // Обработка ошибок при отправке сообщения
      console.error("Message sending error from server:", err.error);
      setSocketError(`Message error: ${err.error}`);
      // Здесь можно добавить логику для отката оптимистичного обновления, если оно было
    });

    return () => {
      if (newSocket) {
        console.log("Disconnecting socket on unmount or re-render");
        newSocket.disconnect();
      }
      setIsJoined(false); // Сбрасываем статус при размонтировании
    };
  }, [currentUserId, chatPartnerId]); // Зависимости для переподключения/переприсоединения

  const formatTimestamp = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      // Прокрутка только если есть сообщения
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!socket || !isJoined || !messageInput.trim()) {
      // Проверяем, что сокет есть и мы присоединились
      if (!isJoined && socket)
        setSocketError("You must join the chat first to send messages.");
      else if (!socket) setSocketError("Not connected to chat server.");
      return;
    }

    const messageDataToSend = {
      // sender_id НЕ отправляем, сервер определит его по SID
      recipient_id: chatPartnerId.toString(), // Сервер ожидает строку, затем конвертирует в int
      content: messageInput.trim(),
    };

    socket.emit("send_personal_message", messageDataToSend);
    console.log("Sent message via socket:", messageDataToSend);

    setMessageInput("");
    inputRef.current?.focus();
    setSocketError(null);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <p className={styles.chatPartnerNameHeader}>{chatPartnerName}</p>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.8em",
            color: isJoined ? "green" : "orange",
          }}
        >
          {isJoined
            ? "Chat Joined"
            : socket && socket.connected
            ? "Connecting to chat..."
            : "Socket Disconnected"}
        </span>
      </header>

      <main className={styles.main}>
        {socketError && <p className={styles.socketError}>{socketError}</p>}
        {messages.length === 0 && !socketError && (
          <p className={styles.noMessages}>No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageWrapper} ${
              msg.sender_id === currentUserId ? styles.sent : styles.received
            }`}
          >
            <div className={styles.messageBubble}>
              <p className={styles.messageContent}>{msg.content}</p>
              <span className={styles.messageTimestamp}>
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className={styles.footer}>
        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className={styles.messageInput}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={!isJoined}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!messageInput.trim() || !isJoined}
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
};
