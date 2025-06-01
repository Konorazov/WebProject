import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  HashRouter,
} from "react-router-dom";
import { LoginPage } from "../pages/login/LoginPage";
import { RegisterPage } from "../pages/register/RegisterPage";
import { MainPage } from "../pages/main/MainPage";

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: "20px", textAlign: "center" }}>
    <h1>{title}</h1>
    <p>Эта страница еще в разработке.</p>
    <a href="/">На главную (Логин)</a>
  </div>
);

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<MainPage />} />
        <Route
          path="*"
          element={<PlaceholderPage title="404 - Страница не найдена" />}
        />
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
