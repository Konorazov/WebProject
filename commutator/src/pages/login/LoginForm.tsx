import { FormEvent, MouseEvent, useState } from "react";
import styles from "./LoginForm.module.css";
import { LoginRequest } from "../../models/loginModel";
import { loginRequestServer } from "../../api/loginEndpoints";
import { useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const [login, setLogin] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = async (event: MouseEvent) => {
    event.preventDefault();

    const loginData: LoginRequest = {
      login: login,
      password: password,
    };

    try {
      debugger;
      const response = await loginRequestServer(loginData);
      localStorage["userId"] = response.user.id;
      if (response) {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.layout}>
      <main className={styles.loginContainer}>
        <div className={styles.inputBox}>
          <label>Login</label>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          ></input>
        </div>
        <div className={styles.inputBox}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></input>
        </div>
        <button onClick={(e) => handleSubmit(e)}>login</button>
      </main>
    </div>
  );
};
