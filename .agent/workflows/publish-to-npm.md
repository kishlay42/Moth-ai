---
description: How to publish Flame to NPM
---
# Publish to NPM

Follow these steps to publish your package to the public NPM registry.

1.  **Login to NPM** (One-time setup)
    ```bash
    npm login
    ```
    *   Follow the prompts to authenticate via your browser.

2.  **Verify Build**
    *   Ensure your project builds without errors.
    ```bash
    npm run build
    ```

3.  **Publish**
    *   This will automatically run the build script before publishing.
    ```bash
    npm publish --access public
    ```
    *   Note: Use `--access public` for the first publish of a scoped package (e.g., `@username/flame`). For unscoped packages, it's public by default.

## Versioning

When releasing updates, remember to bump the version number:

```bash
# Patch (1.0.0 -> 1.0.1)
npm version patch

# Minor (1.0.0 -> 1.1.0)
npm version minor

# Major (1.0.0 -> 2.0.0)
npm version major
```
Then run `npm publish`.
