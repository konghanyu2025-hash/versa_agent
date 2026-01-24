import { useEffect } from 'react';
import { useWorkflowStore, useAgentStore } from '../stores';

export default function Dashboard() {
  const { workflows, fetchWorkflows } = useWorkflowStore();
  const { agents, fetchAgents } = useAgentStore();

  useEffect(() => {
    fetchWorkflows();
    fetchAgents();
  }, [fetchWorkflows, fetchAgents]);

  const runningWorkflows = workflows.filter(w => w.status === 'RUNNING');
  const completedWorkflows = workflows.filter(w => w.status === 'COMPLETED');
  const failedWorkflows = workflows.filter(w => w.status === 'FAILED');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Overview of your VersaAgent instance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-info">
            <div className="stat-value">{agents.length}</div>
            <div className="stat-label">Total Agents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div className="stat-info">
            <div className="stat-value">{workflows.length}</div>
            <div className="stat-label">Total Workflows</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon running">▶️</div>
          <div className="stat-info">
            <div className="stat-value">{runningWorkflows.length}</div>
            <div className="stat-label">Running</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-info">
            <div className="stat-value">{completedWorkflows.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon error">❌</div>
          <div className="stat-info">
            <div className="stat-value">{failedWorkflows.length}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <h2>Recent Workflows</h2>
          {workflows.length === 0 ? (
            <div className="empty-state">
              <p>No workflows yet. Create your first workflow to get started.</p>
            </div>
          ) : (
            <div className="workflow-list">
              {workflows.slice(0, 5).map(workflow => (
                <div key={workflow.id} className="workflow-item">
                  <div className="workflow-info">
                    <h3>{workflow.name}</h3>
                    <p>{workflow.description || 'No description'}</p>
                  </div>
                  <div className={`workflow-status status-${workflow.status.toLowerCase()}`}>
                    {workflow.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Available Agents</h2>
          {agents.length === 0 ? (
            <div className="empty-state">
              <p>No agents configured. Create agents to perform tasks.</p>
            </div>
          ) : (
            <div className="agent-list">
              {agents.map(agent => (
                <div key={agent.name} className="agent-card">
                  <h3>{agent.name}</h3>
                  <p>{agent.role}</p>
                  <div className="agent-model">{agent.llmProvider}/{agent.llmModel}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .dashboard-header p {
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-tertiary);
          border-radius: 8px;
        }

        .stat-icon.running {
          background-color: rgba(210, 153, 34, 0.2);
        }

        .stat-icon.success {
          background-color: rgba(63, 185, 80, 0.2);
        }

        .stat-icon.error {
          background-color: rgba(248, 81, 73, 0.2);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 600;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .dashboard-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .dashboard-section {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
        }

        .dashboard-section h2 {
          font-size: 20px;
          margin-bottom: 16px;
        }

        .workflow-list, .agent-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .workflow-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: var(--bg-tertiary);
          border-radius: 6px;
        }

        .workflow-info h3 {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .workflow-info p {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .workflow-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-pending {
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .status-running {
          background-color: rgba(210, 153, 34, 0.2);
          color: var(--warning-color);
        }

        .status-completed {
          background-color: rgba(63, 185, 80, 0.2);
          color: var(--success-color);
        }

        .status-failed {
          background-color: rgba(248, 81, 73, 0.2);
          color: var(--error-color);
        }

        .agent-card {
          padding: 16px;
          background-color: var(--bg-tertiary);
          border-radius: 6px;
        }

        .agent-card h3 {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .agent-card p {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .agent-model {
          font-size: 12px;
          color: var(--accent-color);
          font-family: monospace;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
