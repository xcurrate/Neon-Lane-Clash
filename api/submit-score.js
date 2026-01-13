import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, score } = req.body;

  if (!name || score === undefined || score > 20000) {
    return res.status(400).json({ error: "Data tidak valid!" });
  }

  const supabase = createClient(
    process.env.SUPBASE_URL, 
    process.env.SUPBASE_KEY
  );

  try {
    // 1. Cek dulu apakah user ini sudah punya skor di database
    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('name', name)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 artinya data tidak ditemukan (itu oke)
      throw fetchError;
    }

    // 2. Logika Perbandingan:
    // Update hanya jika: data belum ada ATAU skor baru > skor lama
    if (!existingEntry || score > existingEntry.score) {
      const { error: upsertError } = await supabase
        .from('leaderboard')
        .upsert(
          { 
            name, 
            score, 
            created_at: new Date().toISOString() 
          }, 
          { onConflict: 'name' }
        );

      if (upsertError) throw upsertError;
      return res.status(200).json({ success: true, message: "New High Score!" });
    } else {
      // Jika skor baru lebih rendah, kita tidak update apa-apa
      return res.status(200).json({ success: true, message: "Score not high enough." });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
