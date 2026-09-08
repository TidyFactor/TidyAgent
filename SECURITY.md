# Security Policy 🛡️

## 🔒 Sovereign Privacy Guarantee

Tidy is architected as a **Local-First, Sovereign Intelligence Platform**:
- All cognitive memories, SQLite nodes, micro-app data (tasks, snippets, reflections), and vault credentials remain exclusively on your local machine (`~/.tidy/tidy.db`).
- Tidy contains **zero background telemetry**, zero third-party analytics trackers, and zero cloud lock-in sync daemons.
- The desktop application runs with strict Electron context isolation (`contextIsolation: true`, `nodeIntegration: false`).

---

## 🎯 Supported Versions

Security patches and bug fixes are actively provided for the following releases:

| Version | Supported |
| :--- | :--- |
| `1.3.x` | ✅ Yes (Current Active Release) |
| `< 1.3.0` | ❌ No (Please upgrade to v1.3.0+) |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Tidy, **please do not open a public GitHub issue**.

Instead, please report it through one of the following private channels:
1. **GitHub Private Vulnerability Reporting**: Use the **"Report a vulnerability"** button under the Security tab of this repository.
2. **Security Email**: Send an encrypted or plain email to `security@tidyfactor.com`.

### What to include in your report:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or proof-of-concept (PoC).
- Affected version and operating system environment.

### Our Commitment:
- We will acknowledge receipt of your report within **24 hours**.
- We will provide an assessment and timeline within **72 hours**.
- Once a fix is verified, a patched release will be published alongside a coordinated security advisory.
