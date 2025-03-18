import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다' });
  }

  try {
    const { week, date, recommendedPair, excludedNumbers } = req.body;

    // 필수 필드 확인
    if (!week || !date || !recommendedPair || !excludedNumbers) {
      return res.status(400).json({ error: '모든 필드가 필요합니다' });
    }

    // recommendedPair와 excludedNumbers가 배열인지 확인
    if (!Array.isArray(recommendedPair) || !Array.isArray(excludedNumbers)) {
      return res.status(400).json({ error: 'recommendedPair와 excludedNumbers는 배열이어야 합니다' });
    }

    // 같은 week에 대한 데이터가 이미 있는지 확인
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('recommendHistory')
      .select('id')
      .eq('week', week)
      .maybeSingle();

    if (checkError) {
      console.error('기존 데이터 확인 오류:', checkError);
      return res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }

    let result;

    if (existingData) {
      // 이미 존재하는 데이터 업데이트
      const { data, error } = await supabaseAdmin
        .from('recommendHistory')
        .update({
          date,
          recommendedPair,
          excludedNumbers,
          createdAt: new Date().toISOString()
        })
        .eq('week', week)
        .select();

      if (error) throw error;
      result = data;
    } else {
      // 새 데이터 삽입
      const { data, error } = await supabaseAdmin
        .from('recommendHistory')
        .insert({
          week,
          date,
          recommendedPair,
          excludedNumbers
        })
        .select();

      if (error) throw error;
      result = data;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 