import { useEffect, useState } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast';

interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
  rarity: string;
  unlocked: boolean;
}

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/game/achievements');
      setAchievements(response.data.data);
      
      // Check for new achievements
      const checkResponse = await api.post('/game/check-achievements');
      
      // Response structure: { success: true, data: { unlocked: [...] } }
      const unlockedAchievements = checkResponse.data.data?.unlocked || [];
      
      // If new achievements were unlocked, refetch the full list to update UI
      if (unlockedAchievements.length > 0) {
        const updatedResponse = await api.get('/game/achievements');
        setAchievements(updatedResponse.data.data);
        
        // Show notification for newly unlocked achievements
        unlockedAchievements.forEach((achievement: Achievement) => {
          toast.success(`Achievement Unlocked: ${achievement.name}! 🎉`);
        });
      }
    } catch (error: any) {
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  const groupedAchievements = achievements.reduce((acc, ach) => {
    if (!acc[ach.category]) {
      acc[ach.category] = [];
    }
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="container">
      <h1>Achievements</h1>
      <p className="text-gray" style={{ marginBottom: '2rem' }}>
        Unlock achievements by completing various challenges and milestones
      </p>

      {Object.entries(groupedAchievements).map(([category, items]) => (
        <div key={category} className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ textTransform: 'capitalize', marginBottom: '1rem' }}>
            {category} Achievements
          </h2>
          <div className="grid grid-3">
            {items.map((achievement) => (
              <div
                key={achievement._id}
                style={{
                  padding: '1.5rem',
                  background: achievement.unlocked ? 'var(--light)' : 'white',
                  border: '2px solid',
                  borderColor: achievement.unlocked ? 'var(--success)' : 'var(--border)',
                  borderRadius: '0.5rem',
                  opacity: achievement.unlocked ? 1 : 0.6,
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {achievement.icon || '🏆'}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{achievement.name}</h3>
                <p className="text-gray" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {achievement.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge badge-${achievement.rarity === 'legendary' ? 'danger' : achievement.rarity === 'epic' ? 'warning' : 'primary'}`}>
                    {achievement.rarity}
                  </span>
                  <span>⭐ {achievement.xpReward} XP</span>
                </div>
                {achievement.unlocked && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="badge badge-success">✓ Unlocked</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Achievements;
