export default function Settings() {
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your VersaAgent instance</p>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h2>LLM Providers</h2>
          <p className="section-description">Configure your API keys for different LLM providers.</p>

          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-header">
                <h3>OpenAI</h3>
                <span className="status-badge not-configured">Not configured</span>
              </div>
              <p className="settings-item-description">
                Add your OpenAI API key to use GPT models.
              </p>
              <input type="password" placeholder="sk-..." />
            </div>

            <div className="settings-item">
              <div className="settings-item-header">
                <h3>Anthropic</h3>
                <span className="status-badge not-configured">Not configured</span>
              </div>
              <p className="settings-item-description">
                Add your Anthropic API key to use Claude models.
              </p>
              <input type="password" placeholder="sk-ant-..." />
            </div>

            <div className="settings-item">
              <div className="settings-item-header">
                <h3>DeepSeek</h3>
                <span className="status-badge configured">Configured</span>
              </div>
              <p className="settings-item-description">
                DeepSeek API key is set in environment variables.
              </p>
              <input type="password" value="••••••••" disabled />
            </div>

            <div className="settings-item">
              <div className="settings-item-header">
                <h3>Ollama (Local)</h3>
                <span className="status-badge configured">Available</span>
              </div>
              <p className="settings-item-description">
                Ollama for running local models. Default: http://localhost:11434
              </p>
              <input type="text" defaultValue="http://localhost:11434" />
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>Database</h2>
          <p className="section-description">PostgreSQL database configuration.</p>

          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-header">
                <h3>Connection Status</h3>
                <span className="status-badge warning">Not connected</span>
              </div>
              <p className="settings-item-description">
                Configure your DATABASE_URL in .env file and run migrations.
              </p>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>About</h2>
          <div className="about-info">
            <div className="about-item">
              <span className="about-label">Version</span>
              <span className="about-value">2.0.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">Description</span>
              <span className="about-value">Intelligent Multi-Agent Collaboration Platform</span>
            </div>
          </div>
        </section>
      </div>

      <div className="settings-actions">
        <button className="primary">Save Settings</button>
        <button className="secondary">Reset to Defaults</button>
      </div>

      <style>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .page-header p {
          color: var(--text-secondary);
        }

        .settings-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 24px;
        }

        .settings-section {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 24px;
        }

        .settings-section h2 {
          font-size: 20px;
          margin-bottom: 8px;
        }

        .section-description {
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-item {
          padding: 16px;
          background-color: var(--bg-tertiary);
          border-radius: 6px;
        }

        .settings-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .settings-item-header h3 {
          font-size: 16px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.configured {
          background-color: rgba(63, 185, 80, 0.2);
          color: var(--success-color);
        }

        .status-badge.not-configured {
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
        }

        .status-badge.warning {
          background-color: rgba(210, 153, 34, 0.2);
          color: var(--warning-color);
        }

        .settings-item-description {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 12px;
        }

        .settings-item input {
          width: 100%;
        }

        .about-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .about-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .about-label {
          color: var(--text-secondary);
        }

        .about-value {
          font-weight: 500;
        }

        .settings-actions {
          display: flex;
          gap: 12px;
        }

        .settings-actions button {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
