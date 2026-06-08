import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
  );
  
  const { type } = req.query;
  
  let query = supabase.from('leaderboard').select('name, score');
  const now = new Date();

  if (type === 'daily') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    query = query.gte('created_at', startOfDay);
  } else if (type === 'weekly') {
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', lastWeek);
  }

  try {
    const { data, error } = await query.order('score', { ascending: false }).limit(10);
    
    if (error) throw error;
    
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memuat leaderboard' });
  }
}