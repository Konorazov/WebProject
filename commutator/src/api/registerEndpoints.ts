import axios from "axios";
import { baseUrl } from "./constants";
import { RegisterRequest } from "../models/registerModel";

export const registerRequestServer = async (data : RegisterRequest) => {
    try {
        const response = await axios.post(`${baseUrl}/api/auth/register`, data);
        return response.data;
    } catch(error) {
        console.error(error);
    }
}