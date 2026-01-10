import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import toast from 'react-hot-toast';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  instructor: {
    username: string;
    avatar: string;
  };
  enrolledStudents: string[];
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [category, difficulty, search]);

  const fetchCourses = async () => {
    try {
      const params: any = {};
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;

      const response = await api.get('/courses', { params });
      setCourses(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Courses</h1>
      <div className="filters" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
        >
          <option value="">All Categories</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
          <option value="science">Science</option>
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="input"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="grid grid-3">
        {courses.map((course) => (
          <Link
            key={course._id}
            to={`/courses/${course._id}`}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3>{course.title}</h3>
            <p className="text-gray" style={{ marginBottom: '1rem' }}>
              {course.description.substring(0, 100)}...
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge badge-${course.difficulty === 'beginner' ? 'success' : course.difficulty === 'intermediate' ? 'warning' : 'danger'}`}>
                {course.difficulty}
              </span>
              <span>⭐ {course.xpReward} XP</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray)' }}>
              By {course.instructor.username}
            </div>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center" style={{ padding: '3rem' }}>
          <p className="text-gray">No courses found</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
