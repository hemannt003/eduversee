import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            <span className="brand-icon">🎓</span>
            EDUverse
          </Link>
          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/achievements">Achievements</Link>
            <Link to="/social">Social</Link>
            <Link to="/profile" className="user-link">
              <span className="user-avatar">
                {user?.avatar || user?.username?.[0]?.toUpperCase()}
              </span>
              <span>Level {user?.level}</span>
            </Link>
            <button onClick={handleLogout} className="btn btn-outline">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
