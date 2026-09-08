# Support & Assistance for Tidy Ecosystem

Thank you for building with **Tidy**. Whether you are integrating `@tidy/core`, deploying `@tidy/mcp`, running `@tidy/cli`, or extending desktop/web apps, here is how to get support:

---

## 🧭 Which Channel Should I Use?

| Need / Query | Best Channel | Response Time |
|---|---|---|
| **Bug Reports & Glitches** | [GitHub Issues](https://github.com/TidyFactor/Agent/issues/new/choose) | 24–48 hours |
| **Feature Requests & Ideas** | [GitHub Issues (Feature Request)](https://github.com/TidyFactor/Agent/issues/new?template=feature_request.yml) | 48–72 hours |
| **Security & Vulnerabilities** | [Private Vulnerability Reporting](https://github.com/TidyFactor/Agent/security/advisories/new) or `security@tidyfactor.com` | Within 24 hours |
| **Architecture & Integrations** | [TidyFactor Documentation](https://github.com/TidyFactor/Agent/blob/main/ARCHITECTURE.md) | Self-serve |

---

## 🛠️ Diagnostics Before Opening an Issue

Before submitting a bug report:
1. Verify you are running **Node.js >= 22.0.0** (`node -v`) for native `node:sqlite` support.
2. Run the automated test suite to ensure database integrity:
   ```bash
   npm test
   ```
3. Check that your local SQLite database is accessible:
   ```bash
   node bin/tidy.js whoami
   ```
4. Search existing closed issues to see if the issue has already been addressed.
