# LinkSentry — URL Security Analyzer

## About the Project

LinkSentry is a web-based URL security analysis application designed to help users identify potentially unsafe links. It displays scan results using three categories: **Safe**, **Suspicious**, and **Malicious**.

## Features

- URL scanning and risk classification
- Safe, Suspicious, and Malicious result labels
- Security analysis dashboard
- Risk analytics and visual charts
- Scan history and filtering
- Invalid URL handling

## Technology Stack

Update this section to match the technologies actually used in your project.

- Frontend: React, TypeScript, Vite
- Backend: Node.js and Express (if used)
- Charts and visualization: as implemented in the application

## Project Structure

```text
LinkSentry/
├── apps/
│   ├── web/
│   └── api/
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Git

### Run the Frontend

```bash
cd apps/web
npm install
npm run dev
```

### Run the Backend

Open a separate terminal and use the actual backend folder and start command configured in your project.

## Security Notice

LinkSentry provides risk assessments, not a guarantee that a URL is safe. Avoid opening suspicious links during testing. Do not commit API keys, passwords, or `.env` files to GitHub.

## Testing

Test the application with a known example URL, an invalid URL, and scan-history behavior. Document the actual results after testing.

## Limitations and Future Improvements

- Improve URL threat detection and classification accuracy.
- Add stronger validation and error handling.
- Improve reporting and security analytics.
- Deploy the frontend and backend for online access.

## License

Choose and add a license if you intend to distribute the project publicly.
