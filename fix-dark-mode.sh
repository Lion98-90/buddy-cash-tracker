#!/bin/bash

# List of replacements: from → to
declare -A replacements=(
  ["bg-white"]="bg-white dark:bg-gray-900"
  ["bg-gray-100"]="bg-gray-100 dark:bg-gray-800"
  ["hover:bg-white"]="hover:bg-white dark:hover:bg-gray-800"
  ["hover:bg-gray-100"]="hover:bg-gray-100 dark:hover:bg-gray-700"
  ["text-black"]="text-black dark:text-white"
  ["text-gray-800"]="text-gray-800 dark:text-gray-200"
)

# Target file types
target_files=$(find src -type f \( -name "*.tsx" -o -name "*.jsx" \))

# Loop over replacements
for file in $target_files; do
  for from in "${!replacements[@]}"; do
    to=${replacements[$from]}
    sed -i '' "s/$from/$to/g" "$file" 2>/dev/null || sed -i "s/$from/$to/g" "$file"
  done
done

echo "✅ Tailwind dark mode fixes applied."
