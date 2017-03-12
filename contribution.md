# Contributing to Settee

Thank you for considering contributing to Settee! 

Please note, that Settee is released with a [Contributor Code of Conduct](code-of-conduct.md). By participating in this project you agree to abide by its terms.

## How to help

### Improve docs

As a Settee user, you are a great match to help us improve our documentation. Whether it's fixing a typo, adding more examples, or adding better explanations.

### Help out with issues

Help other users with issues they're having. You can also answer questions you know the answers to.

### Write code

If you want to add or modify some functionality in Settee, please note that the source code is in TypeScript and uses ES6 standards. 

To write code, you need to fork or clone this repository first. Make sure to run `yarn` or `npm install` before you proceed. We have a TSC watcher available via `npm run dev`.

Please not that we always aim for 100% test coverage, so make sure your code is properly tested, and well-documented (add docblocks, edit README). Our test suite is running [ava](https://github.com/avajs/ava).

### Submitting an issue

Please search the issue tracker before opening an issue. Try to add as much info as possible:

- settee version
- steps to reproduce
- operating system name and version
- Node.js version, yarn/npm version

### Submitting a pull request

1. run a CI friendly test suite `npm run test:ci` and make sure the coverage is at 100%
2. run fresh build scripts `npm run build && npm run build:npm`
3. Add a comprehensive commit message, and if your code is fixing an issue, please add a hash to the issue (i.e. fixes #14)
4. submit the pull request

