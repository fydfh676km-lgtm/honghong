import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../src/storage/database/supabase-client';

async function test() {
  // 模拟注册流程
  const password = 'test123456';
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('注册时生成的hash:', passwordHash);

  // 模拟登录流程
  const { data: user, error } = await getSupabaseAdmin()
    .from('users')
    .select('id, username, password_hash, created_at')
    .eq('username', 'testuser2')
    .single();

  if (error) {
    console.error('查询错误:', error);
    return;
  }

  console.log('查询到的用户:', user);
  console.log('数据库中的hash:', user.password_hash);

  // 比较密码
  const isValid = await bcrypt.compare(password, user.password_hash);
  console.log('密码比较结果:', isValid);
}

test();