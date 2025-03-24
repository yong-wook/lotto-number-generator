import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다' });
  }

  try {
    const { table } = req.body;

    if (!table) {
      return res.status(400).json({ error: '테이블 이름이 필요합니다' });
    }

    let result;
    
    if (table === 'lotto_numbers') {
      // lotto_numbers 테이블의 모든 데이터 삭제
      const { data, error } = await supabaseAdmin
        .from('lotto_numbers')
        .delete()
        .neq('id', 0) // 모든 레코드 선택
        .select();

      if (error) {
        console.error('데이터 삭제 오류:', error);
        return res.status(500).json({ error: '데이터 삭제에 실패했습니다' });
      }
      
      result = {
        table: 'lotto_numbers',
        deleted_count: data.length,
        message: `${data.length}개의 테스트 데이터가 삭제되었습니다`
      };
    } else {
      return res.status(400).json({ error: '지원되지 않는 테이블입니다' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 