import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

interface Stats {
  user: {
    username: string;
    avatar: string;
    xp: number;
    level: number;
    streak: number;
    progressXP: number;
    neededXP: number;
    progressPercent: number;
  };
  achievements: any[];
  badges: any[];
  friends: any[];
}

interface Activity {
  _id: string;
  type: string;
  title: string;
  description: string;
  user: {
    username: string;
    avatar: string;
  };
  createdAt: string;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/game/stats'),
        api.get('/social/activity?limit=5'),
      ]);
      setStats(statsRes.data.data);
      setActivities(activityRes.data.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <p className="text-gray">Continue your learning journey</p>
      </div>

      {stats && (
        <div className="dashboard-grid">
          <div className="card stats-card">
            <h2>Your Progress</h2>
            <div className="level-display">
              <div className="level-badge">Level {stats.user.level}</div>
              <div className="xp-display">{stats.user.xp.toLocaleString()} XP</div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${stats.user.progressPercent}%` }}
                />
              </div>
              <div className="progress-text">
                {stats.user.progressXP} / {stats.user.neededXP} XP to next level
              </div>
            </div>
            <div className="streak-display">
              🔥 {stats.user.streak} day streak
            </div>
          </div>

          <div className="card">
            <h2>Achievements</h2>
            <div className="achievements-preview">
              {stats.achievements.length > 0 ? (
                <div className="achievement-list">
                  {stats.achievements.slice(0, 3).map((ach: any) => (
                    <div key={ach._id} className="achievement-item">
                      <span className="achievement-icon">{ach.icon || '🏆'}</span>
                      <span>{ach.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray">No achievements yet</p>
              )}
              <Link to="/achievements" className="btn btn-outline">
                View All
              </Link>
            </div>
          </div>

          <div className="card">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity._id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'level_up' && '⬆️'}
                      {activity.type === 'lesson_completed' && '✅'}
                      {activity.type === 'achievement_unlocked' && '🏆'}
                      {activity.type === 'course_enrolled' && '📚'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-description">{activity.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray">No recent activity</p>
              )}
            </div>
            <Link to="/social" className="btn btn-outline">
              View Feed
            </Link>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <Link to="/courses" className="action-card">
          <span className="action-icon">📚</span>
          <h3>Browse Courses</h3>
          <p>Explore new learning opportunities</p>
        </Link>
        <Link to="/leaderboard" className="action-card">
          <span className="action-icon">🏆</span>
          <h3>Leaderboard</h3>
          <p>See where you rank</p>
        </Link>
        <Link to="/social" className="action-card">
          <span className="action-icon">👥</span>
          <h3>Social</h3>
          <p>Connect with friends</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
