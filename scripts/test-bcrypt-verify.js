const bcrypt = require('bcryptjs');

const password = 'Admin123!';
const hash = '$2a$10$YRCXvZVmNA8fAHhAbR.EAOlJapYto1NAF8aiX.WZhkoPmruvxd9Qa';

console.log('Testing bcrypt verification...');
console.log('Password:', password);
console.log('Hash:', hash);

const isValid = bcrypt.compareSync(password, hash);
console.log('Valid:', isValid ? '✅ YES' : '❌ NO');

if (isValid) {
  console.log('\n✅ Passwort-Verifizierung funktioniert!');
  console.log('Login sollte funktionieren mit:');
  console.log('Email: admin@financemadesimple.de');
  console.log('Password:', password);
}
