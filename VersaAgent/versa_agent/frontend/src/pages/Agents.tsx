import { useEffect, useState } from 'react';
import { useAgentStore } from '../stores';
import type { Agent } from '../stores/agentStore';

export default function Agents() {
  const { agents, fetchAgents, createAgent, deleteAgent, loading, error, clearError } = useAgentStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const capabilities = formData.get('capabilities') as string;
    try {
      await createAgent({
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        systemPrompt: formData.get('systemPrompt') as string || undefined,
        llmProvider: formData.get('llmProvider') as string,
        llmModel: formData.get('llmModel') as string,
        capabilities: capabilities ? JSON.parse(capabilities) : undefined
      });
      setShowCreateForm(false);
      fetchAgents();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Delete agent "${name}"?`)) {
      try {
        await deleteAgent(name);
        fetchAgents();
      } catch (err) {
        // Error handled by store
      }
    }
  };

  return (
    <div className="agents-page">
      <div className="page-header">
        <div>
          <h1>Agents</h1>
          <p>Configure AI agents for specific tasks</p>
        </div>
        <button className="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Agent'}
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
          <h2>Create New Agent</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input name="name" required placeholder="e.g., analyst" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input name="role" required placeholder="e.g., Data Analyst" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>LLM Provider</label>
              <select name="llmProvider" required>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="deepseek">DeepSeek</option>
                <option value="zhipu">Zhipu AI</option>
                <option value="moonshot">Moonshot</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            <div className="form-group">
              <label>Model</label>
              <input name="llmModel" required placeholder="e.g., gpt-4o" />
            </div>
          </div>
          <div className="form-group">
            <label>System Prompt</label>
            <textarea
              name="systemPrompt"
              rows={4}
              placeholder="You are a helpful assistant specializing in..."
            />
          </div>
          <div className="form-group">
            <label>Capabilities (JSON object, optional)</label>
            <textarea
              name="capabilities"
              rows={3}
              placeholder='{"skills": ["analysis", "reporting"]}'
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

      <div className="agent-grid">
        {agents.map(agent => (
          <div key={agent.name} className="agent-card">
            <div className="agent-card-header">
              <div className="agent-icon">🤖</div>
              <div className="agent-info">
                <h3>{agent.name}</h3>
                <p className="agent-role">{agent.role}</p>
              </div>
            </div>
            <div className="agent-details">
              <div className="agent-detail">
                <span className="label">Provider:</span>
                <span className="value">{agent.llmProvider}</span>
              </div>
              <div className="agent-detail">
                <span className="label">Model:</span>
                <span className="value">{agent.llmModel}</span>
              </div>
              {agent.systemPrompt && (
                <div className="agent-prompt">
                  <span className="label">System Prompt:</span>
                  <p>{agent.systemPrompt.substring(0, 100)}...</p>
                </div>
              )}
            </div>
            <div className="agent-actions">
              <button className="secondary">Edit</button>
              <button className="secondary">Test</button>
              <button className="danger" onClick={() => handleDelete(agent.name)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="empty-state">
          <p>No agents configured. Create agents to perform tasks.</p>
        </div>
      )}

      <style>{`
        .agents-page {
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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

        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }

        .agent-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
        }

        .agent-card-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .agent-icon {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-tertiary);
          border-radius: 8px;
        }

        .agent-info h3 {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .agent-role {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .agent-details {
          margin-bottom: 16px;
        }

        .agent-detail {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 14px;
        }

        .agent-detail .label {
          color: var(--text-secondary);
        }

        .agent-prompt {
          padding: 8px 0;
          font-size: 14px;
        }

        .agent-prompt .label {
          display: block;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .agent-prompt p {
          background-color: var(--bg-tertiary);
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .agent-actions {
          display: flex;
          gap: 8px;
        }

        .agent-actions button {
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
