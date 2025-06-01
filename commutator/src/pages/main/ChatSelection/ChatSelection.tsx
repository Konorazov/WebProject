import React, { useState, FormEvent, useEffect } from "react";
import styles from "./ChatSelection.module.css";
import { getPartnerServer } from "../../../api/chat";

interface ChatSelectionPageProps {
  currentUserId: number | null;
  onSelectPartner: (partnerId: number, partnerName?: string) => void;
}

export const ChatSelection: React.FC<ChatSelectionPageProps> = ({
  onSelectPartner,
}) => {
  const [partnerIdInput, setPartnerIdInput] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!partnerIdInput.trim()) {
      return;
    }

    const myId = localStorage["userId"];
    const partnerId = parseInt(partnerIdInput, 10);

    if (isNaN(myId)) {
      return;
    }
    if (isNaN(partnerId)) {
      return;
    }

    if (myId === partnerId) {
      return;
    }

    const partner = await getPartnerServer(partnerId);

    onSelectPartner(partnerId, partner.login);
  };

  return (
    <div className={styles.selectionContainer}>
      <h1>Select Chat Partner</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="partnerId">Chat with User ID:</label>
          <input
            id="partnerId"
            type="text"
            value={partnerIdInput}
            onChange={(e) => setPartnerIdInput(e.target.value)}
            placeholder="Enter partner's User ID"
            required
          />
        </div>
        <button type="submit" className={styles.startButton}>
          Start Chat
        </button>
      </form>
    </div>
  );
};
