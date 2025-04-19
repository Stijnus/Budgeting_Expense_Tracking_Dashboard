#!/bin/bash

echo "Running TypeScript type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "TypeScript check failed. Please fix the errors before committing."
  exit 1
fi

echo "Running ESLint..."
npx eslint .
if [ $? -ne 0 ]; then
  echo "ESLint check found issues. Consider fixing them before committing."
  echo "You can run 'npm run lint:fix' to automatically fix some issues."
  # We're returning 0 here to allow the commit even with linting warnings
  # Change to 'exit 1' if you want to block commits with linting errors
  exit 0
fi

echo "All checks passed!"
exit 0
