# Node Kit

Basic tools for quick node.js projects

## Using in other projects

```
npm add @brianbuie/node-kit
```

```js
import { thing } from '@brianbuie/node-kit';
```

## Publishing changes to this package

Commit all changes, then run

```
npm version [patch|minor|major] [-m "custom commit message"]
```

- Bumps version in `package.json`
- Runs tests
- Commits changes
- Tags commit with new version
- Pushes commit and tags to github
- The new tag will trigger github action to publish to npm
