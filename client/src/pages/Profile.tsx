import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import toast from 'react-hot-toast';

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

const Profile = () => {
  const { updateUser } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/game/stats');
      setStats(response.data.data);
      if (response.data.data.user) {
        updateUser(response.data.data.user);
      }
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!stats) {
    return <div className="container">Failed to load profile</div>;
  }

  return (
    <div className="container">
      <h1>Profile</h1>
      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h2>Your Stats</h2>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="text-gray">Username:</span>
              <span style={{ fontWeight: '500' }}>{stats.user.username}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="text-gray">Level:</span>
              <span style={{ fontWeight: '500' }}>{stats.user.level}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="text-gray">Total XP:</span>
              <span style={{ fontWeight: '500' }}>{stats.user.xp.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="text-gray">Streak:</span>
              <span style={{ fontWeight: '500' }}>🔥 {stats.user.streak} days</span>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-gray">Progress to Level {stats.user.level + 1}</span>
                <span className="text-gray">{stats.user.progressPercent}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${stats.user.progressPercent}%` }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginTop: '0.5rem' }}>
                {stats.user.progressXP} / {stats.user.neededXP} XP
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Achievements & Badges</h2>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Achievements ({stats.achievements.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {stats.achievements.slice(0, 6).map((ach: any) => (
                  <span key={ach._id} style={{ fontSize: '2rem' }} title={ach.name}>
                    {ach.icon || '🏆'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Badges ({stats.badges.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {stats.badges.slice(0, 6).map((badge: any) => (
                  <span key={badge._id} style={{ fontSize: '2rem' }} title={badge.name}>
                    {badge.icon || '🎖️'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Friends ({stats.friends.length})</h2>
        <div className="grid grid-3" style={{ marginTop: '1rem' }}>
          {stats.friends.map((friend: any) => (
            <div
              key={friend._id}
              style={{
                padding: '1rem',
                background: 'var(--light)',
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {friend.avatar || friend.username[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '500' }}>{friend.username}</p>
                  <p className="text-gray" style={{ fontSize: '0.875rem' }}>
                    Level {friend.level}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
