import bcrypt from 'bcryptjs';

const password = 'test123456';
const hash = '$2b$10$atXiL5WRRJiEV7T11CPKO.hK8.FnOGV4k5z.4VVweh8atW19xebNy';

bcrypt.compare(password, hash).then((result) => {
  console.log('bcrypt.compare result:', result);
  console.log('password:', password);
  console.log('hash:', hash);
});