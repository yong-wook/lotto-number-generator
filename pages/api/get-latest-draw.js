import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 가장 최근 회차 정보 가져오기
    const { data, error } = await supabaseAdmin
      .from('lotto_numbers')
      .select('draw_round')
      .order('draw_round', { ascending: false })
      .limit(1);

    if (error) throw error;

    const latestDrawRound = data.length > 0 ? data[0].draw_round : 1164;
    
    return res.status(200).json({ draw_round: latestDrawRound });
  } catch (error) {
    console.error('Error fetching latest draw:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 