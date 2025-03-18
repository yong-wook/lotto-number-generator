import { supabaseAdmin } from '../../lib/supabase';

/**
 * 특정 회차의 추천/제외 번호를 수동으로 업데이트하는 API
 * 데이터가 불일치할 때 사용
 */
export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다' });
  }

  try {
    const { week, recommendedPair, excludedNumbers } = req.body;

    // 필수 필드 확인
    if (!week) {
      return res.status(400).json({ error: '회차 번호는 필수입니다' });
    }

    // recommendedPair와 excludedNumbers 필드 확인
    const updateData = {};
    
    if (recommendedPair && Array.isArray(recommendedPair)) {
      updateData.recommendedPair = recommendedPair;
    }
    
    if (excludedNumbers && Array.isArray(excludedNumbers)) {
      updateData.excludedNumbers = excludedNumbers;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '업데이트할 데이터가 없습니다' });
    }

    // 해당 회차의 레코드 찾기
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('recommendHistory')
      .select('*')
      .eq('week', week.toString())
      .maybeSingle();

    if (checkError) {
      console.error('기존 데이터 확인 오류:', checkError);
      return res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }

    if (!existingData) {
      return res.status(404).json({ error: `${week} 회차 데이터를 찾을 수 없습니다` });
    }

    // 데이터 업데이트
    const { data, error } = await supabaseAdmin
      .from('recommendHistory')
      .update(updateData)
      .eq('week', week.toString())
      .select();

    if (error) {
      console.error('업데이트 오류:', error);
      return res.status(500).json({ error: '데이터 업데이트 중 오류가 발생했습니다' });
    }

    res.status(200).json({ 
      success: true, 
      message: `${week} 회차 데이터가 성공적으로 업데이트되었습니다`,
      data
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 