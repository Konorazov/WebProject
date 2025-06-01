import React, { useState, useEffect, useRef } from "react";
import { PersonalChat } from "./PersonalChat/PersonalChat";
import { ChatSelection } from "./ChatSelection/ChatSelection";

interface ChatPartner {
  id: number;
  name?: string;
}

export const MainPage = () => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] =
    useState<ChatPartner | null>(null);
  const [isLoadingUserId, setIsLoadingUserId] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      try {
        const parsedUserId = parseInt(storedUserId, 10);
        if (!isNaN(parsedUserId)) {
          setCurrentUserId(parsedUserId);
        } else {
          console.error("Stored User ID is not a valid number.");
        }
      } catch (e) {
        console.error("Error parsing stored User ID:", e);
      }
    }
    setIsLoadingUserId(false);
  }, []);

  const handleSelectChatPartner = (partnerId: number, partnerName?: string) => {
    setSelectedChatPartner({
      id: partnerId,
      name: partnerName || `User ${partnerId}`,
    });
  };

  const handleLeaveChat = () => {
    setSelectedChatPartner(null);
  };

  if (isLoadingUserId) {
    return <div className="loading-app">Loading user data...</div>;
  }

  if (!selectedChatPartner || !currentUserId) {
    return (
      <ChatSelection
        currentUserId={currentUserId}
        onSelectPartner={handleSelectChatPartner}
      />
    );
  }

  return (
    <div className="chat-view-container">
      <button onClick={handleLeaveChat} className="back-button">
        ← Change Chat Partner
      </button>
      <PersonalChat
        currentUserId={currentUserId}
        chatPartnerId={selectedChatPartner.id}
        chatPartnerName={selectedChatPartner.name}
      />
    </div>
  );
};
