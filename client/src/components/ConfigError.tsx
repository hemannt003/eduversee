import { isApiUrlInvalid } from '../api/api';

const ConfigError = () => {
  if (!isApiUrlInvalid) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          backgroundColor: '#1a1a1a',
          padding: '30px',
          borderRadius: '12px',
          border: '2px solid #ff4444',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h1
          style={{
            color: '#ff4444',
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          ⚠️ Configuration Error
        </h1>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6', fontSize: '16px' }}>
          The API URL is set to <strong>localhost</strong> in production. This means the frontend cannot connect to your backend server.
        </p>

        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', color: '#4CAF50' }}>
            🔧 Quick Fix (5 minutes)
          </h2>
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
            <li>
              Go to{' '}
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4CAF50', textDecoration: 'underline' }}
              >
                Vercel Dashboard
              </a>
            </li>
            <li>Select your project → <strong>Settings</strong> → <strong>Environment Variables</strong></li>
            <li>
              Click <strong>Add New</strong> and enter:
              <ul style={{ marginTop: '10px', marginBottom: 0 }}>
                <li>
                  <strong>Name:</strong> <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>VITE_API_URL</code>
                </li>
                <li>
                  <strong>Value:</strong> <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>https://your-backend-url.com/api</code>
                </li>
                <li>
                  <strong>Environments:</strong> Select all (Production, Preview, Development)
                </li>
              </ul>
            </li>
            <li>Click <strong>Save</strong></li>
            <li>
              Go to <strong>Deployments</strong> → Click <strong>...</strong> on latest deployment → <strong>Redeploy</strong>
            </li>
          </ol>
        </div>

        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>
            <strong>Note:</strong> Replace <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>https://your-backend-url.com/api</code> with your actual backend URL.
            <br />
            Make sure it includes <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>/api</code> at the end.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: '14px', color: '#aaa', textAlign: 'center' }}>
          See <strong>VERCEL_ENV_QUICK_SETUP.md</strong> in the repository for detailed instructions.
        </p>
      </div>
    </div>
  );
};

export default ConfigError;
