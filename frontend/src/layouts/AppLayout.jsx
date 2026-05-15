import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { modules } from "../config/resources";

export default function AppLayout() {
  const navigate = useNavigate();

  // 1. Centraliza a leitura do usuário dentro do componente
  const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");
  const userRole = (user.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  const logout = () => {
    localStorage.removeItem("sisq_token");
    localStorage.removeItem("sisq_user");
    window.location.href = "/login"; 
  };

  // 2. Redirecionamento ao clicar na marca (Brand)
  const handleBrandClick = () => {
    if (isAdmin) {
      navigate("/");
    } else {
      // Se não for admin, leva para o primeiro módulo que ele tem acesso
      navigate("/empresa-profile"); 
    }
  };

  const canAccess = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <img
            style={{ width: 200, marginBottom: 5 }}
            src="/src/assets/sisinove-logo-transparente.png"
            alt="Logo Sisinove"
          />
          {/* Adicionado clique na marca para evitar ficar preso */}
          <div className="brand-box" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
            <div className="brand-mark">S+</div>
            <div>
              <strong>SISAPRENDIZ</strong>
              <p>Gestão de Jovens Aprendizes</p>
            </div>
          </div>

          <nav className="nav-menu">
            {/* Dashboard só aparece para Admin */}
            {isAdmin && (
              <NavLink to="/" end>
                Dashboard
              </NavLink>
            )}

            {!isAdmin && user.role === 'empresas' && (
              <NavLink to="/empresa-profile">
                Informações do Vínculo
              </NavLink>
            )}

            {Object.entries(modules)
              .filter(([_, item]) => canAccess(item))
              .map(([path, item]) => (
                <NavLink key={path} to={`/modulo/${path}`}>
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="profile-box">
          <strong>{user.name || "Usuário"}</strong>
          <span style={{ textTransform: 'capitalize' }}>
            {user.role || "perfil"}
          </span>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}