import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

config();

async function createAdminSQL() {
  const email = 'admin@financemadesimple.de';
  const password = 'Admin2024!';

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = `usr_${randomBytes(8).toString('hex')}`;

  const insertQuery = `
INSERT INTO "User" (id, email, "passwordHash", role, name, "isActive", "createdAt", "updatedAt")
VALUES ('${userId}', '${email}', '${passwordHash}', 'admin', 'Administrator', true, NOW(), NOW());
  `.trim();

  console.log('SQL Query to execute:');
  console.log('----------------------------------------');
  console.log(insertQuery);
  console.log('----------------------------------------');
  console.log();
  console.log('Login Credentials:');
  console.log('Email:', email);
  console.log('Password:', password);
}

createAdminSQL();
