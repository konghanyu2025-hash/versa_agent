import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/workflows', label: 'Workflows', icon: '⚙️' },
    { path: '/agents', label: 'Agents', icon: '🤖' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>VersaAgent 2.0</h1>
          <p className="version">智能多代理协作平台</p>
        </div>
        <ul className="nav-links">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">
        {children}
      </main>
      <style>{`
        .app {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar {
          width: 250px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h1 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .sidebar-header .version {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .nav-links {
          list-style: none;
          padding: 10px;
          margin: 0;
        }

        .nav-links li {
          margin-bottom: 4px;
        }

        .nav-links a {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 6px;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }

        .nav-links a:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .nav-links a.active {
          background-color: var(--accent-color);
          color: white;
        }

        .nav-links .icon {
          margin-right: 10px;
          font-size: 18px;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
      `}</style>
    </div>
  );
}
