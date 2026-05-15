import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { modules } from "../config/resources";
const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");
const isAdmin = user.role?.toLowerCase() === "admin";

export default function AppLayout() {
  const navigate = useNavigate();

  // Pegamos o usuário do localStorage
  const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");
  const userRole = (user.role || "").toLowerCase(); // Garantimos que esteja em minúsculo para comparar

  const logout = () => {
    localStorage.removeItem("sisq_token");
    localStorage.removeItem("sisq_user");
    navigate("/login");
  };

  // Função para verificar se o usuário tem permissão para ver o item do menu
  const canAccess = (item) => {
    // Se o item não tiver 'roles' definido no config, permitimos por padrão
    // Ou se a role do usuário estiver na lista de permitidas
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
          <div className="brand-box">
            <div className="brand-mark">S+</div>
            <div>
              <strong>SISAPRENDIZ</strong>
              <p>Gestão de Jovens Aprendizes</p>
            </div>
          </div>

          <nav className="nav-menu">
            {isAdmin && (
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            )}

            {Object.entries(modules)
              .filter(([_, item]) => canAccess(item)) // Filtra baseado na role
              .map(([path, item]) => (
                <NavLink key={path} to={`/modulo/${path}`}>
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="profile-box">
          <strong>{user.name || "Usuário"}</strong>
          <span style={{ textTransform: 'capitalize' }}>{user.role || "perfil"}</span>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}