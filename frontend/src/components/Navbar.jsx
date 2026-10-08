import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [showSubjectPanel, setShowSubjectPanel] = useState(false);

  // Fetch subjects for dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/questions/subjects");
        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };
    fetchSubjects();
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  return (
    <nav className="glass-navbar">
        <div className="nav-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to={user ? "/dashboard" : "/"} className="nav-brand-glow">
             Exam Quest
          </Link>
          
          {/* Hamburger Menu Icon */}
          <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
          </div>

          <div className={`nav-menu ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            {user ? (
              <>
              <Link
                to="/dashboard"
                className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                to="/news-feed"
                className={`nav-item ${isActive("/news-feed") ? "active" : ""}`}
              >
                News Feed
              </Link>
              <Link
                to="/questions"
                className={`nav-item ${isActive("/questions") ? "active" : ""}`}
              >
                Start Test
              </Link>
              <Link
                to="/practicals"
                className={`nav-item ${isActive("/practicals") ? "active" : ""}`}
              >
                Practicals
              </Link>
              <Link
                to="/results"
                className={`nav-item ${isActive("/results") ? "active" : ""}`}
              >
                Results History
              </Link>
              <Link
                to="/feedback"
                className={`nav-item ${isActive("/feedback") ? "active" : ""}`}
              >
                Feedback
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/add-question"
                  className={`nav-item admin-badge ${isActive("/add-question") ? "active" : ""}`}
                >
                  Add Question
                </Link>
              )}
              {user.role === "admin" && (
                <Link
                  to="/admin/feedback"
                  className={`nav-item admin-badge ${isActive("/admin/feedback") ? "active" : ""}`}
                >
                  Feedback Inbox
                </Link>
              )}
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`nav-item admin-badge ${isActive("/admin") ? "active" : ""}`}
                >
                  Admin
                </Link>
              )}
              <div className="user-profile">
                <span
                  className="user-avatar"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  style={{ cursor: "pointer" }}
                  title="Account menu"
                >
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </span>
                <div className={`user-info-dropdown ${isProfileDropdownOpen ? "dropdown-visible" : ""}`}>
                  <div className="user-info-name">{user.name || "User"}</div>
                  <div className="user-info-role">{user.role}</div>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate("/profile");
                    }}
                    className="btn-logout-dropdown"
                    style={{ marginBottom: "5px", backgroundColor: "#0a06be", color: "#fff" }}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="btn-logout-dropdown"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>

            ) : (
              <>
                {location.pathname !== "/register" ? (
                  <Link to="/register" className="btn-nav-primary">
                    Sign Up
                  </Link>
                ) : (
                  <Link to="/" className="btn-nav-primary">
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
      </div>
    </nav>
  );
};

export default Navbar;
