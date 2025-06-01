import { MouseEvent, useState } from "react";
import styles from "./RegisterForm.module.css";
import { useNavigate } from "react-router-dom";
import { RegisterRequest } from "../../models/registerModel";
import { registerRequestServer } from "../../api/registerEndpoints";

export const RegisterForm = () => {
  const [login, setLogin] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const navigate = useNavigate();

  const handleSubmit = async (event: MouseEvent) => {
    event.preventDefault();

    if (password != confirmPassword) {
      alert("Пароли должны совподать");
      return;
    }

    const registerData: RegisterRequest = {
      login: login,
      password: password,
    };

    try {
      const response = await registerRequestServer(registerData);
      localStorage["userId"] = response.user.id;
      navigate("/");
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
        <div className={styles.inputBox}>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          ></input>
        </div>
        <button onClick={(e) => handleSubmit(e)}>login</button>
      </main>
    </div>
  );
};
