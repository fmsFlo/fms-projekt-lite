const { execSync } = require('child_process');

if (process.env.NETLIFY) {
  console.log('NETLIFY detected — skipping prisma migrate during build.');
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.log('No DATABASE_URL — skipping prisma migrate.');
  process.exit(0);
}

console.log('Running prisma migrate deploy...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

