import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Hanya izinkan POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, score } = req.body;

  // VALIDASI BACKEND (Mencegah Skor Palsu Ekstrim)
  if (!name || score === undefined || score > 20000) {
    return res.status(400).json({ error: "Data tidak valid atau skor terlalu tinggi!" });
  }

  const supabase = createClient(
    process.env.SUPBASE_URL, 
    process.env.SUPBASE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ name, score }]);

    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
