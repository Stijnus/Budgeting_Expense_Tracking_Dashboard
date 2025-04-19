#!/bin/bash

echo "Running TypeScript type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "TypeScript check failed. Please fix the errors before committing."
  exit 1
fi

echo "TypeScript check passed!"
exit 0
