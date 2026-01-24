import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../stores';
import type { WorkflowMode } from '../stores/workflowStore';

export default function Workflows() {
  const { workflows, fetchWorkflows, createWorkflow, executeWorkflow, cancelWorkflow, loading, error, clearError } = useWorkflowStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const steps = formData.get('steps') as string;
    try {
      await createWorkflow({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        mode: formData.get('mode') as WorkflowMode,
        steps: JSON.parse(steps)
      });
      setShowCreateForm(false);
      fetchWorkflows();
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleExecute = async (id: string) => {
    await executeWorkflow(id);
    fetchWorkflows();
  };

  const handleCancel = async (id: string) => {
    await cancelWorkflow(id);
    fetchWorkflows();
  };

  return (
    <div className="workflows-page">
      <div className="page-header">
        <div>
          <h1>Workflows</h1>
          <p>Manage and execute automation workflows</p>
        </div>
        <button className="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Workflow'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}

      {showCreateForm && (
        <form className="create-form" onSubmit={handleCreate}>
          <h2>Create New Workflow</h2>
          <div className="form-group">
            <label>Name</label>
            <input name="name" required placeholder="My workflow" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" placeholder="Optional description" />
          </div>
          <div className="form-group">
            <label>Mode</label>
            <select name="mode" required>
              <option value="AUTO">Auto (fully automatic)</option>
              <option value="SEMI">Semi-auto (with confirmations)</option>
              <option value="TEMPLATE">Template (predefined steps)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Steps (JSON array)</label>
            <textarea
              name="steps"
              required
              rows={6}
              defaultValue='[{"agentName": "assistant", "task": "Analyze the data"}]'
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button type="button" className="secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="workflow-grid">
        {workflows.map(workflow => (
          <div key={workflow.id} className="workflow-card">
            <div className="workflow-card-header">
              <h3>{workflow.name}</h3>
              <span className={`badge status-${workflow.status.toLowerCase()}`}>
                {workflow.status}
              </span>
            </div>
            <p className="workflow-description">{workflow.description || 'No description'}</p>
            <div className="workflow-meta">
              <span>Mode: {workflow.mode}</span>
              <span>{workflow.steps.length} steps</span>
            </div>
            <div className="workflow-actions">
              {workflow.status === 'RUNNING' ? (
                <button className="danger" onClick={() => handleCancel(workflow.id)}>
                  Cancel
                </button>
              ) : workflow.status === 'PENDING' || workflow.status === 'FAILED' ? (
                <button className="primary" onClick={() => handleExecute(workflow.id)}>
                  Execute
                </button>
              ) : (
                <button className="secondary" onClick={() => handleExecute(workflow.id)}>
                  Run Again
                </button>
              )}
              <button className="secondary">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="empty-state">
          <p>No workflows yet. Create your first workflow to get started.</p>
        </div>
      )}

      <style>{`
        .workflows-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .page-header p {
          color: var(--text-secondary);
        }

        .error-banner {
          background-color: rgba(248, 81, 73, 0.1);
          border: 1px solid var(--error-color);
          color: var(--error-color);
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner button {
          background: none;
          border: none;
          color: inherit;
          font-size: 18px;
          cursor: pointer;
        }

        .create-form {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .create-form h2 {
          font-size: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .workflow-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }

        .workflow-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
        }

        .workflow-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .workflow-card-header h3 {
          font-size: 18px;
        }

        .badge {
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

        .workflow-description {
          color: var(--text-secondary);
          margin-bottom: 16px;
          min-height: 40px;
        }

        .workflow-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .workflow-actions {
          display: flex;
          gap: 8px;
        }

        .workflow-actions button {
          flex: 1;
        }

        .empty-state {
          text-align: center;
          padding: 64px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
