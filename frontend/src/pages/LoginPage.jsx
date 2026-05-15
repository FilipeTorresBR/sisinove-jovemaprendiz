import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("sisq_token", data.token);
      localStorage.setItem("sisq_user", JSON.stringify(data.user));
      
      if (data.user.role.toLowerCase() === 'admin') {
        navigate("/"); // Admin continua indo para o Dashboard
      } else {
        navigate("/modulo/aprendizes"); // Empresa vai direto para a lista de aprendizes
      }
    } catch (e) {
      setError(e.response?.data?.message || "Falha ao entrar.");
    }
  }

  return (
    <div className="login-screen">
      <img
        style={{ width: 350, marginBottom: 15 }}
        src="/src/assets/sisinove-logo-transparente.png"
      ></img>
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <h1>SISAPRENDIZ</h1>
          <p>Dashboard Jovem Aprendiz da Sisinove</p>
        </div>

        <label>
          E-mail
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
