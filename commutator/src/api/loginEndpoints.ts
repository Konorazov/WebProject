import axios from "axios";
import { LoginRequest } from "../models/loginModel";
import { baseUrl } from "./constants";

export const loginRequestServer = async (data : LoginRequest) => {
    try {
        const response = await axios.post(`${baseUrl}/api/auth/login`, data);
        return response.data;
    } catch(error) {
        console.error(error);
    }
}