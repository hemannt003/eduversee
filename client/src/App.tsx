import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Social from './pages/Social';
import Profile from './pages/Profile';

function App() {
  const { user, token } = useAuthStore();

  return (
    <div className="App">
      <Toaster position="top-right" />
      {token && <Navbar />}
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses"
          element={token ? <Courses /> : <Navigate to="/login" />}
        />
        <Route
          path="/courses/:id"
          element={token ? <CourseDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/leaderboard"
          element={token ? <Leaderboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/achievements"
          element={token ? <Achievements /> : <Navigate to="/login" />}
        />
        <Route
          path="/social"
          element={token ? <Social /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;
