# Contributing to Kagent

Thank you for your interest in contributing to Kagent! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Documentation](#documentation)
- [Testing](#testing)
- [Community](#community)
- [License](#license)
- [Questions and Help](#questions-and-help)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/website.git
   cd website
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/kagent-dev/website.git
   ```
4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
6. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Pull Request Process

1. Update your fork with the latest changes from upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request from your fork to the main repository

4. Fill out the PR template with all required information

5. Address review comments if requested by maintainers

6. Update your PR if needed:
   ```bash
   git add .
   git commit -m "address review comments"
   git push origin feature/your-feature-name
   ```

7. Once approved, a maintainer will merge your PR

## Style Guide

- Follow the existing code style
- Use meaningful variable and function names
- Write clear comments for complex logic
- Keep functions small and focused
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations

## Documentation

- Update documentation for any changes to APIs, CLIs, or user-facing features
- Add examples for new features
- Update the README if necessary
- Add comments to your code explaining complex logic
- Keep documentation in sync with code changes

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Include edge cases in tests
- Maintain or improve test coverage

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

Example commit message:
```
feat(controller): add support for custom resource validation

This adds validation for the KagentApp custom resource to ensure
that the configuration is valid before applying it to the cluster.

Closes #123
```

## Signing Your Commits

All commits must be signed with a Developer Certificate of Origin (DCO). This is a lightweight way for contributors to certify that they wrote or otherwise have the right to submit the code they are contributing to the project.

### How to Sign Your Commits

1. Configure Git to sign your commits:
   ```bash
   git config --global user.signingkey YOUR_GPG_KEY_ID
   ```

2. Sign your commits when making them:
   ```bash
   git commit -s -m "your commit message"
   ```
   The `-s` flag adds a Signed-off-by line to your commit message.

3. For existing commits that need to be signed, you can amend them:
   ```bash
   git commit --amend -s --no-edit
   ```

4. When pushing changes, make sure to push the signed commits:
   ```bash
   git push --force-with-lease origin your-branch-name
   ```

### DCO Sign-off Format

Each commit message must include a sign-off line in the following format:
```
Signed-off-by: Your Name <your.email@example.com>
```

This line certifies that you have the right to submit the work under the project's license and agree to the Developer Certificate of Origin.

## Community

- Join our [Discord server](https://bit.ly/kagentdiscord) for discussions
- Participate in community calls (scheduled on our website)
- Help answer questions in GitHub issues
- Review pull requests from other contributors

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.

## Questions and Help

If you have any questions about contributing, please open an issue or reach out to the maintainers. 