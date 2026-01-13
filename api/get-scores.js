import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // 1. FIX: Perbaiki typo nama environment variable
  const supabase = createClient(process.env.SUPBASE_URL, process.env.SUPBASE_KEY);
  
  const { type } = req.query; // 'daily', 'weekly', 'all'
  
  // Ambil data nama & score
  let query = supabase.from('leaderboard').select('name, score');
  const now = new Date();

  // 2. LOGIC: Tambahkan kembali filter waktu agar Tab berfungsi
  if (type === 'daily') {
    // Mulai dari jam 00:00 hari ini (UTC)
    const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
    query = query.gte('created_at', startOfDay);
  } else if (type === 'weekly') {
    // 7 Hari ke belakang
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', lastWeek);
  }

  try {
    // Limit 10 agar list tidak kepanjangan
    const { data, error } = await query.order('score', { ascending: false }).limit(10);
    
    if (error) throw error;
    
    // Set Cache-Control agar Vercel tidak terlalu agresif caching (opsional, bagus untuk leaderboard)
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
