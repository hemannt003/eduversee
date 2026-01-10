import { useEffect, useState } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface LeaderboardUser {
  _id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
}

const Leaderboard = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [type, setType] = useState<'xp' | 'level'>('xp');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get(`/game/leaderboard?type=${type}&limit=100`);
      setUsers(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  // Find user rank using string comparison to handle ObjectId/string mismatches
  const userIndex = users.findIndex((u) => u._id.toString() === user?.id?.toString());
  const userRank = userIndex >= 0 ? userIndex + 1 : 0;

  return (
    <div className="container">
      <h1>Leaderboard</h1>
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setType('xp')}
          className={`btn ${type === 'xp' ? 'btn-primary' : 'btn-outline'}`}
        >
          By XP
        </button>
        <button
          onClick={() => setType('level')}
          className={`btn ${type === 'level' ? 'btn-primary' : 'btn-outline'}`}
        >
          By Level
        </button>
      </div>

      {userRank > 0 && user && (
        <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h2>Your Rank: #{userRank}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user?.username}</p>
              <p>Level {user?.level} • {user?.xp.toLocaleString()} XP</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Level</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>XP</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr
                key={u._id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: u._id.toString() === user?.id?.toString() ? 'var(--light)' : 'transparent',
                }}
              >
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{index + 1}</td>
                <td style={{ padding: '1rem' }}>
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
                      {u.avatar || u.username[0].toUpperCase()}
                    </div>
                    {u.username}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                  {u.level}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {u.xp.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
