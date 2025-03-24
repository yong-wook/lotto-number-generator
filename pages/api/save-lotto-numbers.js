import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다' });
  }

  try {
    const { numbers, draw_round } = req.body;

    if (!Array.isArray(numbers) || numbers.length !== 6) {
      return res.status(400).json({ error: '유효하지 않은 번호 형식입니다' });
    }

    if (!draw_round) {
      return res.status(400).json({ error: '회차 정보가 없습니다' });
    }

    // lotto_numbers 테이블에 저장
    const { data, error } = await supabaseAdmin
      .from('lotto_numbers')
      .insert({
        numbers: numbers,
        draw_round: draw_round
      })
      .select()
      .single();

    if (error) {
      console.error('번호 저장 오류:', error);
      return res.status(500).json({ error: '번호 저장에 실패했습니다' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 