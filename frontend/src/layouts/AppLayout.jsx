import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { modules } from "../config/resources";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false); // Controle do menu mobile

  const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");
  const userRole = (user.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  const logout = () => {
    localStorage.removeItem("sisq_token");
    localStorage.removeItem("sisq_user");
    window.location.href = "/login";
  };

  const handleBrandClick = () => {
    setMenuOpen(false);
    if (isAdmin) {
      navigate("/");
    } else {
      navigate("/modulo/aprendizes");
    }
  };

  const canAccess = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  // Fecha o menu ao clicar em um link no mobile
  const handleNavLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      {/* BARRA SUPERIOR MOBILE (Só aparece em telas pequenas) */}
      <header className="mobile-navbar">
        <div className="mobile-logo" onClick={handleBrandClick}>
          {/* Substituído o texto antigo pela logo oficial que você indicou */}
          <img
            style={{ height: 35, width: "auto", objectFit: "contain" }}
            src="/src/assets/sisinove-logo-transparente.png"
            alt="Logo Sisinove"
          />
        </div>

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* SIDEBAR (Vira o menu drop-down no mobile quando menuOpen é true) */}
      <aside className={`sidebar ${menuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top-wrapper">
          <div className="desktop-logo-box">
            <img
              style={{ width: 200, marginBottom: 5 }}
              src="/src/assets/sisinove-logo-transparente.png"
              alt="Logo Sisinove"
            />
            <div className="brand-box" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
              <div className="brand-mark">S+</div>
              <div>
                <strong>SISAPRENDIZ</strong>
                <p>Gestão de Jovens Aprendizes</p>
              </div>
            </div>
          </div>

          <nav className="nav-menu">
            {isAdmin && (
              <NavLink to="/" end onClick={handleNavLinkClick}>
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
                <NavLink key={path} to={`/modulo/${path}`} onClick={handleNavLinkClick}>
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="profile-box">
          <div>
            <strong>{user.name || "Usuário"}</strong>
            <span style={{ textTransform: 'capitalize', display: 'block', fontSize: '0.8rem', color: '#aaa' }}>
              {user.role || "perfil"}
            </span>
          </div>
          <button onClick={logout} className="logout-btn">Sair</button>
        </div>
      </aside>

      {/* Overlay de fundo para fechar o menu ao clicar fora no mobile */}
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}