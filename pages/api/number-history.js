import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 새로운 번호 저장
    try {
      const { numbers, drawRound } = req.body;
      
      const { data, error } = await supabaseAdmin
        .from('lotto_numbers')
        .insert({
          numbers: numbers,
          draw_round: drawRound,
          is_winner: null,  // 추첨 전이므로 null로 설정
          matching_count: null  // 추첨 전이므로 null로 설정
        })
        .select()
        .single();

      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error saving numbers:', error);
      res.status(500).json({ error: 'Failed to save numbers' });
    }
  } else if (req.method === 'GET') {
    // 저장된 번호 조회
    try {
      const { data, error } = await supabaseAdmin
        .from('lotto_numbers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);  // 최근 50개만 조회

      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching numbers:', error);
      res.status(500).json({ error: 'Failed to fetch numbers' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}