import React, { useState } from 'react';
import { useFitness } from '../context/FitnessContext';
import { 
  User, 
  Mail, 
  Lock, 
  GraduationCap, 
  Building2, 
  Calendar, 
  HeartPulse, 
  ArrowRight, 
  Loader2
} from 'lucide-react';

export default function AuthPage() {
  const { loginUser, registerUser, setCurrentPage, authError } = useFitness();
  const [isRegister, setIsRegister] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [hostel, setHostel] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [activityLevel, setActivityLevel] = useState('Moderately Active');

  const departmentsList = [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology & Life Sciences',
    'School of Management',
    'Electrical Engineering'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      const result = isRegister
        ? await registerUser({ name, email, password, college, hostel, department, year })
        : await loginUser({ email, password });

      if (result.success) {
        setCurrentPage(isRegister ? 'profile' : 'dashboard');
      } else {
        setLocalError(result.error || (isRegister ? 'Registration failed. Please try again.' : 'Login failed. Check credentials.'));
      }
    } catch {
      setLocalError('The request could not be completed. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            Fit <span>Connect</span>
          </div>
          <h1 className="auth-title">
            {isRegister ? 'Create Student Account' : 'Welcome Back, Athlete'}
          </h1>
          <p className="auth-subtitle">
            {isRegister 
              ? 'Join FitConnect to represent your department and transform sedentary study habits.' 
              : 'Log in with your college credentials to track workouts and campus challenges.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-pills">
          <button 
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            Student Registration
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            Student Login
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">College Email ID</label>
            <div className="input-with-icon">
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student.roll@campus.edu"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">College / University</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="field-icon" />
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. National Institute of Technology"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hostel / Residence (optional)</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="field-icon" />
                  <input
                    type="text"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Hostel Block 4"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <div className="input-with-icon">
                    <GraduationCap size={18} className="field-icon" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="form-select"
                    >
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <div className="input-with-icon">
                    <Calendar size={18} className="field-icon" />
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="form-select"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Fitness / Activity Level</label>
                <div className="input-with-icon">
                  <HeartPulse size={18} className="field-icon" />
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="form-select"
                  >
                    <option value="Sedentary">Sedentary (mostly sitting, study & lectures 8+ hrs/day)</option>
                    <option value="Lightly Active">Lightly Active (occasional walking or weekend sports)</option>
                    <option value="Moderately Active">Moderately Active (exercise 2-3 times a week)</option>
                    <option value="Very Active">Very Active (athlete or regular daily gym/sports)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {(localError || authError) && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '0.5rem',
              color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600,
            }}>
              {localError || authError}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg w-full mt-2" disabled={submitting}>
            {submitting ? <Loader2 size={18} className="spin-icon" /> : null}
            <span>{isRegister ? 'Register & Setup Profile' : 'Sign In to FitConnect'}</span>
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>

      </div>

      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
        }

        .auth-card {
          width: 100%;
          max-width: 580px;
          padding: 2.5rem;
          border-radius: var(--radius-lg);
        }

        @media (max-width: 600px) {
          .auth-card {
            padding: 1.5rem;
          }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-brand-logo {
          font-family: var(--font-heading);
          font-size: 2.2rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.03em;
          margin-bottom: 0.75rem;
        }

        .auth-brand-logo span {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .auth-tab-pills {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 0.3rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.75rem;
        }

        .auth-tab-btn {
          flex: 1;
          padding: 0.6rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-main);
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-tab-btn.active {
          background: var(--accent-emerald);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-dim);
          pointer-events: none;
        }

        .input-with-icon .form-input,
        .input-with-icon .form-select {
          padding-left: 2.75rem;
        }

        .mt-2 {
          margin-top: 1rem;
        }

      `}</style>
    </div>
  );
}
