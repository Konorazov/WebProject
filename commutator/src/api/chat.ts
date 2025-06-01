import axios from "axios";
import { baseUrl } from "./constants";

export const getMessagesServer = async(data:GetMessagesRequest) => {
    try {
        const response = await axios.get(`${baseUrl}/api/messages/history/${data.sender_id}/${data.recipient_id}`);
        return response.data;
    } catch(error){
        console.error(error);
    }
}

export const getPartnerServer = async(data:number) => {
    try {
        const response = await axios.get(`${baseUrl}/api/user/${data}`);
        return response.data;
    } catch(error){
        console.error(error);
    }
}