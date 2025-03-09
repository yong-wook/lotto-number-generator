import axios from 'axios';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  const { currentDrawNo } = req.query;

  if (!currentDrawNo) {
    return res.status(400).json({ error: '현재 회차 번호가 제공되지 않았습니다.' });
  }

  try {
    // 최근 4주간의 당첨 번호를 DB에서 가져옵니다
    const { data, error } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .lte('drwNo', currentDrawNo - 1)  // 현재 회차보다 작거나 같은 회차
      .gte('drwNo', currentDrawNo - 4)  // 현재 회차 - 4보다 크거나 같은 회차
      .order('drwNo', { ascending: false });
    
    if (error) {
      throw error;
    }

    // 데이터 형식을 클라이언트에서 기대하는 형식으로 변환
    const formattedData = data.map(item => {
      const numbers = item.numbers.split(',').map(Number);
      return {
        drwNo: item.drwNo,
        drwNoDate: item.drwNoDate,
        drwtNo1: numbers[0],
        drwtNo2: numbers[1],
        drwtNo3: numbers[2],
        drwtNo4: numbers[3],
        drwtNo5: numbers[4],
        drwtNo6: numbers[5],
        bnusNo: item.bonus
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('과거 로또 번호 가져오기 실패:', error);
    res.status(500).json({ error: '과거 로또 번호를 가져오는 데 실패했습니다.' });
  }
}
