import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = '/api';

function Registration() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [birthDate, setBirthDate] = useState(() => sessionStorage.getItem("birthDate") || "");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  const validateUsername = (value) => {
    const re = /^[a-zA-Z0-9а-яА-ЯёЁ_-]+$/;
    return re.test(value);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    if (errors.username) {
      if (
        value.trim().length >= 3 &&
        value.length <= 30 &&
        validateUsername(value)
      ) {
        setErrors((prev) => ({ ...prev, username: undefined }));
      }
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      if (value.trim() && validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      if (value.length >= 6 && /[A-ZА-ЯЁ]/.test(value) && /[0-9]/.test(value)) {
        setErrors((prev) => ({ ...prev, password: undefined }));
      }
    }
    if (errors.rePassword && rePassword && value === rePassword) {
      setErrors((prev) => ({ ...prev, rePassword: undefined }));
    }
  };

  const handleRePasswordChange = (e) => {
    const value = e.target.value;
    setRePassword(value);
    if (errors.rePassword) {
      if (value && value === password) {
        setErrors((prev) => ({ ...prev, rePassword: undefined }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Введите никнейм";
    } else if (username.length < 3) {
      newErrors.username = "Никнейм должен быть не менее 3 символов";
    } else if (username.length > 30) {
      newErrors.username = "Никнейм должен быть не более 30 символов";
    } else if (!validateUsername(username)) {
      newErrors.username = "Никнейм может содержать только буквы, цифры, _ и -";
    }

    if (!email.trim()) {
      newErrors.email = "Введите почту";
    } else if (!validateEmail(email)) {
      newErrors.email = "Некорректный формат почты";
    }

    if (!password) {
      newErrors.password = "Введите пароль";
    } else if (password.length < 6) {
      newErrors.password = "Пароль должен быть не менее 6 символов";
    } else if (password.length > 128) {
      newErrors.password = "Пароль слишком длинный";
    } else if (!/[A-ZА-ЯЁ]/.test(password)) {
      newErrors.password =
        "Пароль должен содержать хотя бы одну заглавную букву";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Пароль должен содержать хотя бы одну цифру";
    }

    if (!rePassword) {
      newErrors.rePassword = "Повторите пароль";
    } else if (password !== rePassword) {
      newErrors.rePassword = "Пароли не совпадают";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await axios.post(`${API}/register`, {
        username,
        email,
        password,
        birth_date: birthDate || null,
      });
      login(response.data.user);
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error
        || (data?.errors ? data.errors.join(", ") : null)
        || "Ошибка регистрации. Возможно, почта уже занята.";
      setErrors({ form: msg });
    }
  };

  const EyeIcon = () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="1"
        y1="1"
        x2="23"
        y2="23"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="auth modal-user">
      <form className="auth__inner" onSubmit={handleRegister}>
        <h4 className="auth__title">Регистрация</h4>
        <div className="auth__info">
          <div className="auth__info-inner">
            <label htmlFor="username" className="auth__info-name">
              Введите никнейм
            </label>
            <input
              type="text"
              id="username"
              className={`auth__info-input${errors.username ? " input-error" : ""}`}
              value={username}
              onChange={handleUsernameChange}
            />
            {errors.username && (
              <span className="auth__error">{errors.username}</span>
            )}
          </div>
          <div className="auth__info-inner">
            <label htmlFor="email" className="auth__info-name">
              Введите почту
            </label>
            <input
              type="email"
              id="email"
              className={`auth__info-input${errors.email ? " input-error" : ""}`}
              value={email}
              onChange={handleEmailChange}
            />
            {errors.email && (
              <span className="auth__error">{errors.email}</span>
            )}
          </div>
          {!birthDate && (
            <div className="auth__info-inner">
              <label htmlFor="birth_date" className="auth__info-name">
                Дата рождения
              </label>
              <input
                type="date"
                id="birth_date"
                className="auth__info-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1950-01-01"
              />
            </div>
          )}

          <div className="auth__info-inner">
            <label htmlFor="password" className="auth__info-name">
              Введите пароль
            </label>
            <div className="auth__password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`auth__info-input${errors.password ? " input-error" : ""}`}
                value={password}
                onChange={handlePasswordChange}
              />
              <button
                type="button"
                className="auth__eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <span className="auth__error">{errors.password}</span>
            )}
          </div>
          <div className="auth__info-inner">
            <label htmlFor="re_password" className="auth__info-name">
              Повторите пароль
            </label>
            <div className="auth__password-wrapper">
              <input
                type={showRePassword ? "text" : "password"}
                id="re_password"
                className={`auth__info-input${errors.rePassword ? " input-error" : ""}`}
                value={rePassword}
                onChange={handleRePasswordChange}
              />
              <button
                type="button"
                className="auth__eye-btn"
                onClick={() => setShowRePassword(!showRePassword)}
                aria-label={
                  showRePassword ? "Скрыть пароль" : "Показать пароль"
                }
              >
                {showRePassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.rePassword && (
              <span className="auth__error">{errors.rePassword}</span>
            )}
          </div>
          {errors.form && (
            <span className="auth__error auth__error--form">{errors.form}</span>
          )}
          <button type="submit" className="auth__info-btn">
            Зарегестрироваться
          </button>
          <NavLink to="/auth" className="auth__info-redirect">
            Войти
          </NavLink>
        </div>
      </form>
    </div>
  );
}

export default Registration;
