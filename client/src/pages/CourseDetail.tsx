import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Lesson {
  _id: string;
  title: string;
  order: number;
  xpReward: number;
  completedBy: (string | { toString(): string })[];
}

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
  lessons: Lesson[];
  enrolledStudents: (string | { toString(): string })[];
}

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success('Enrolled successfully!');
      fetchCourse();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      const response = await api.post(`/courses/lessons/${lessonId}/complete`);
      toast.success(`Lesson completed! +${response.data.data.xpEarned} XP`);
      fetchCourse();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete lesson');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!course) {
    return <div className="container">Course not found</div>;
  }

  // Handle both string and ObjectId types from backend
  const isEnrolled = user ? course.enrolledStudents.some(
    (id) => {
      const idStr = typeof id === 'string' ? id : id.toString();
      return idStr === user.id.toString();
    }
  ) : false;
  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1>{course.title}</h1>
        <p className="text-gray" style={{ marginBottom: '1rem' }}>{course.description}</p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge badge-${course.difficulty === 'beginner' ? 'success' : course.difficulty === 'intermediate' ? 'warning' : 'danger'}`}>
            {course.difficulty}
          </span>
          <span>⭐ {course.xpReward} XP</span>
          <span>📚 {course.lessons.length} Lessons</span>
          <span>👤 {course.instructor.username}</span>
        </div>
        {!isEnrolled && (
          <button onClick={handleEnroll} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Enroll in Course
          </button>
        )}
      </div>

      {isEnrolled && (
        <div className="card">
          <h2>Lessons</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sortedLessons.map((lesson) => {
              // Handle both string and ObjectId types from backend
              const isCompleted = user ? lesson.completedBy.some(
                (id) => {
                  const idStr = typeof id === 'string' ? id : id.toString();
                  return idStr === user.id.toString();
                }
              ) : false;
              return (
                <div
                  key={lesson._id}
                  style={{
                    padding: '1rem',
                    background: isCompleted ? 'var(--light)' : 'white',
                    border: '2px solid',
                    borderColor: isCompleted ? 'var(--success)' : 'var(--border)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>
                      {lesson.order}. {lesson.title}
                    </h3>
                    <span className="text-gray">⭐ {lesson.xpReward} XP</span>
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => handleCompleteLesson(lesson._id)}
                      className="btn btn-primary"
                    >
                      Complete
                    </button>
                  )}
                  {isCompleted && (
                    <span className="badge badge-success">✓ Completed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
