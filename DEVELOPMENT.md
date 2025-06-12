# Development Guide

This document provides guidelines and instructions for those who want to contribute to the kagent website and documentation.

## Prerequisites

Before you begin development, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (v8 or later) or [yarn](https://yarnpkg.com/) (v1.22 or later)
- [Git](https://git-scm.com/)

## Setting Up the Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/kagent-dev/website.git
   cd src
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   This will start the Next.js development server. Open [http://localhost:3000](http://localhost:3000) to view the site in your browser.


## Documentation Development

The documentation is built using MDX files. To contribute to the documentation:

1. Navigate to the `src/app/docs/` directory
2. Edit existing .mdx files or create new ones
3. If adding a new page, ensure it's properly linked in the navigation (layout.tsx)

## Code Style and Linting

This project uses ESLint and Prettier for code formatting and linting.

- Run linting check:

  ```bash
  npm run lint
  # or
  yarn lint
  ```

- Format code:

  ```bash
  npm run format
  # or
  yarn format
  ```

## Building for Production

To build the site for production:

```bash
npm run build
# or
yarn build
```

To preview the production build locally:

```bash
npm run start
# or
yarn start
```

## Deployment

The site is automatically deployed when changes are pushed to the main branch. The deployment process includes:

1. Linting and testing the code
2. Building the Next.js application
3. Deploying to the hosting platform

## Contributing Workflow

1. **Fork the repository**
2. **Create a new branch** for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
4. **Commit your changes** with descriptive commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
   ```bash
   git commit -m "feat: add new documentation section"
   ```
5. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** against the main branch

## Pull Request Guidelines

- Include a clear description of the changes
- Reference any relevant issues
- Update documentation if necessary
- Add tests for new features

## Getting Help

If you need assistance, you can:

- Create an issue on GitHub
- Reach out to project maintainers
- [Join our community discussion](https://bit.ly/kagentdiscord) on Discord

Thank you for contributing to the kagent project!