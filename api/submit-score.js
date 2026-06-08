import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, score } = req.body;

  if (!name || typeof score !== 'number' || score < 0 || score > 20000) {
    return res.status(400).json({ error: 'Data tidak valid' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
  );

  try {
    const { data: existingEntry } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('name', name)
      .single();

    if (!existingEntry || score > existingEntry.score) {
      await supabase.from('leaderboard').upsert({
        name,
        score,
        created_at: new Date().toISOString()
      }, { onConflict: 'name' });

      return res.status(200).json({ success: true, message: 'New High Score!' });
    } else {
      return res.status(200).json({ success: true, message: 'Score not high enough.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}