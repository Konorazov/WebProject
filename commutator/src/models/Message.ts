interface Message {
  id: number; 
  sender_id: number;
  recipient_id: number;
  content: string;
  timestamp: string;
}

interface GetMessagesRequest{
  sender_id:number,
  recipient_id:number,
}