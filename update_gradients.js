const fs = require('fs');

const file = '/Users/ben/Projects/instagram-carousel-saas/src/app/dashboard/create/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const map = {
  'from-indigo-50': 'from-indigo-50 dark:from-gray-900',
  'via-white': 'via-white dark:via-gray-800',
  'to-purple-50': 'to-purple-50 dark:to-gray-900',
  'from-indigo-600': 'from-indigo-600 dark:from-indigo-400',
  'to-purple-600': 'to-purple-600 dark:to-purple-400',
  'hover:text-indigo-800': 'hover:text-indigo-800 dark:hover:text-indigo-300'
};

const keys = Object.keys(map).join('|');
const regex = new RegExp(`(?<!dark:)\\b(${keys})\\b(?! dark:)`, 'g');

content = content.replace(regex, (match) => {
  return map[match];
});

fs.writeFileSync(file, content, 'utf8');
