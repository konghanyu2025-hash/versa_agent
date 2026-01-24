# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.0.x   | Yes |
| 1.x.x   | No |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**.

Instead, open a private issue or contact the maintainer directly.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will:
1. Acknowledge receipt of your report within 48 hours
2. Provide a detailed response within 7 days
3. Work with you to understand and fix the issue
4. Release a fix as soon as possible

## Security Best Practices for Users

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique API keys
- Rotate keys regularly
- Use different keys for development and production

### Database
- Use strong passwords
- Enable SSL/TLS for database connections
- Regular backups
- Limit database user permissions

### Deployment
- Keep dependencies updated
- Use HTTPS in production
- Enable CORS only for trusted domains
- Implement rate limiting
- Use a reverse proxy (nginx, Apache)

### API Keys
- Never expose API keys in client-side code
- Use environment variables for sensitive data
- Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault)
