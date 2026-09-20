const fs = require('fs');

const files = [
  '/Users/ben/Projects/instagram-carousel-saas/src/app/dashboard/page.tsx',
  '/Users/ben/Projects/instagram-carousel-saas/src/app/dashboard/create/page.tsx',
  '/Users/ben/Projects/instagram-carousel-saas/src/app/dashboard/settings/page.tsx',
  '/Users/ben/Projects/instagram-carousel-saas/src/app/dashboard/billing/page.tsx'
];

const map = {
  'bg-gray-50': 'bg-gray-50 dark:bg-gray-900',
  'bg-white': 'bg-white dark:bg-gray-800',
  'text-gray-900': 'text-gray-900 dark:text-white',
  'text-gray-800': 'text-gray-800 dark:text-gray-100',
  'text-gray-700': 'text-gray-700 dark:text-gray-200',
  'text-gray-600': 'text-gray-600 dark:text-gray-300',
  'text-gray-500': 'text-gray-500 dark:text-gray-400',
  'text-gray-400': 'text-gray-400 dark:text-gray-500',
  'bg-gray-200': 'bg-gray-200 dark:bg-gray-700',
  'border-gray-100': 'border-gray-100 dark:border-gray-700',
  'border-gray-300': 'border-gray-300 dark:border-gray-600',
  'bg-indigo-50': 'bg-indigo-50 dark:bg-indigo-900',
  'text-indigo-700': 'text-indigo-700 dark:text-indigo-200',
  'text-indigo-600': 'text-indigo-600 dark:text-indigo-400',
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Use a regex that matches these exact strings preceded and followed by word boundaries,
  // but negative lookahead to avoid replacing if already followed by dark:
  const keys = Object.keys(map).join('|');
  const regex = new RegExp(`(?<!dark:)\\b(${keys})\\b(?! dark:)`, 'g');
  
  content = content.replace(regex, (match) => {
    return map[match];
  });
  
  // special case for border without suffix, only if not border-something
  content = content.replace(/(?<!-)\bborder\b(?!-)/g, 'border dark:border-gray-700');
  
  fs.writeFileSync(file, content, 'utf8');
});
