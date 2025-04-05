import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { rounds } = req.query; // 예: '1166,1165,1164'

  if (!rounds) {
    return res.status(400).json({ error: 'Missing rounds query parameter' });
  }

  const roundNumbers = rounds.split(',').map(Number).filter(num => !isNaN(num));

  if (roundNumbers.length === 0) {
    return res.status(400).json({ error: 'Invalid round numbers' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('lottoResults')
      .select('drwNo, numbers')
      .in('drwNo', roundNumbers);

    if (error) {
      console.error('Error fetching winning numbers by round:', error);
      return res.status(500).json({ error: error.message });
    }

    // 결과를 { round: [numbers] } 형태의 맵으로 변환
    const winningNumbersMap = data.reduce((acc, row) => {
      let numbersArray = [];
      if (row.numbers && typeof row.numbers === 'string') {
        numbersArray = row.numbers.split(',').map(Number).filter(num => !isNaN(num));
      }
      // 보너스 번호는 당첨 비교에 포함하지 않음
      acc[row.drwNo] = numbersArray;
      return acc;
    }, {});

    res.status(200).json(winningNumbersMap);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 