import { useEffect, useState } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Friend {
  _id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
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

const Social = () => {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'search'>('feed');

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchActivityFeed();
    } else if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab]);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/social/friends');
      setFriends(response.data.data.friends);
      setSentRequests(response.data.data.sentRequests);
      setReceivedRequests(response.data.data.receivedRequests);
    } catch (error: any) {
      toast.error('Failed to load friends');
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const response = await api.get('/social/activity?limit=20');
      setActivities(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load activity feed');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    try {
      const response = await api.get(`/social/users/search?q=${searchQuery}`);
      setSearchResults(response.data.data);
    } catch (error: any) {
      toast.error('Search failed');
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await api.post(`/social/friends/request/${userId}`);
      toast.success('Friend request sent');
      handleSearch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      await api.post(`/social/friends/accept/${userId}`);
      toast.success('Friend request accepted');
      fetchFriends();
    } catch (error: any) {
      toast.error('Failed to accept request');
    }
  };

  return (
    <div className="container">
      <h1>Social</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('feed')}
          className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-outline'}`}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`btn ${activeTab === 'friends' ? 'btn-primary' : 'btn-outline'}`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-outline'}`}
        >
          Find Users
        </button>
      </div>

      {activeTab === 'feed' && (
        <div className="card">
          <h2>Activity Feed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map((activity) => (
              <div
                key={activity._id}
                style={{
                  padding: '1rem',
                  background: 'var(--light)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  gap: '1rem',
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>
                  {activity.type === 'level_up' && '⬆️'}
                  {activity.type === 'lesson_completed' && '✅'}
                  {activity.type === 'achievement_unlocked' && '🏆'}
                  {activity.type === 'course_enrolled' && '📚'}
                  {activity.type === 'friend_added' && '👥'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500' }}>{activity.title}</p>
                  <p className="text-gray" style={{ fontSize: '0.875rem' }}>
                    {activity.description}
                  </p>
                  <p className="text-gray" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div>
          {receivedRequests.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2>Friend Requests</h2>
              {receivedRequests.map((req: any) => (
                <div
                  key={req._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--light)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span>{req.username}</span>
                  <button
                    onClick={() => handleAcceptRequest(req._id)}
                    className="btn btn-primary"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h2>Your Friends ({friends.length})</h2>
            <div className="grid grid-3">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  style={{
                    padding: '1rem',
                    background: 'var(--light)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
                        Level {friend.level} • {friend.xp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="card">
          <h2>Find Users</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input"
            />
            <button onClick={handleSearch} className="btn btn-primary">
              Search
            </button>
          </div>
          <div>
            {searchResults.map((result) => (
              <div
                key={result._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--light)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <p style={{ fontWeight: '500' }}>{result.username}</p>
                  <p className="text-gray" style={{ fontSize: '0.875rem' }}>
                    Level {result.level} • {result.xp.toLocaleString()} XP
                  </p>
                </div>
                <button
                  onClick={() => handleSendRequest(result._id)}
                  className="btn btn-primary"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
