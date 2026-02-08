import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin@financemadesimple.de';
  const password = 'Admin2024!';

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = `admin_${Date.now()}`;

  const { data, error } = await supabase
    .from('User')
    .insert({
      id: userId,
      email: email,
      passwordHash: passwordHash,
      role: 'admin',
      name: 'Administrator',
      isActive: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }

  console.log('Admin user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', data.id);
}

createAdmin();
