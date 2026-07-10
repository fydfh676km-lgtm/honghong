import bcrypt from 'bcryptjs';

const password = 'test123456';
const hash = '$2b$10$NJIpMupvQfE7PG6VmQTj0eZTVqMdAyvPD2BPKpEHDzkZaP7oZSD8K';

console.log('Testing bcrypt...');
console.log('Password:', password);
console.log('Hash:', hash);

bcrypt.compare(password, hash).then((result) => {
  console.log('bcrypt.compare result:', result);
}).catch((err) => {
  console.error('bcrypt.compare error:', err);
});