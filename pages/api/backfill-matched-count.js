import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('Starting backfill for matched_count...');
  let updatedCount = 0;
  let errors = [];

  try {
    // 1. lotto_numbers 테이블의 모든 데이터 조회 (ID, draw_round, numbers 필요)
    const { data: allUserNumbers, error: fetchError } = await supabaseAdmin
      .from('lotto_numbers')
      .select('id, draw_round, numbers');

    if (fetchError) {
      console.error('Error fetching user numbers:', fetchError);
      throw new Error('Failed to fetch user numbers.');
    }

    if (!allUserNumbers || allUserNumbers.length === 0) {
      return res.status(200).json({ message: 'No user numbers found to backfill.', updatedCount });
    }

    console.log(`Fetched ${allUserNumbers.length} user number entries.`);

    // 2. 필요한 모든 회차 번호 추출
    const uniqueRounds = [...new Set(allUserNumbers.map(item => item.draw_round).filter(round => round != null))];
    
    if (uniqueRounds.length === 0) {
        return res.status(200).json({ message: 'No valid rounds found in user numbers.', updatedCount });
    }

    console.log(`Found ${uniqueRounds.length} unique rounds to check.`);

    // 3. 해당 회차들의 당첨 번호 조회 (lottoResults)
    const { data: winningNumbersData, error: winningNumbersError } = await supabaseAdmin
      .from('lottoResults')
      .select('drwNo, numbers') // `numbers` 컬럼은 '1,2,3,4,5,6' 형태의 문자열
      .in('drwNo', uniqueRounds);

    if (winningNumbersError) {
      console.error('Error fetching winning numbers:', winningNumbersError);
      throw new Error('Failed to fetch winning numbers.');
    }

    // 당첨 번호를 회차별로 맵으로 변환 { drwNo: [num1, num2, ...] }
    const winningNumbersMap = winningNumbersData.reduce((acc, row) => {
      if (row.numbers && typeof row.numbers === 'string') {
        acc[row.drwNo] = row.numbers.split(',').map(Number).filter(num => !isNaN(num));
      }
      return acc;
    }, {});

    console.log(`Fetched winning numbers for ${Object.keys(winningNumbersMap).length} rounds.`);

    // 4. 각 사용자 번호에 대해 matched_count 계산 및 업데이트
    for (const userNumberEntry of allUserNumbers) {
      const round = userNumberEntry.draw_round;
      const userNums = userNumberEntry.numbers || [];
      const winningNums = winningNumbersMap[round];

      // 해당 회차 당첨 번호가 없거나 사용자 번호가 없으면 건너뜀
      if (!winningNums || userNums.length === 0) {
        continue;
      }

      const count = userNums.filter(num => winningNums.includes(Number(num))).length;

      // 계산된 count로 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('lotto_numbers')
        .update({ matched_count: count })
        .eq('id', userNumberEntry.id);

      if (updateError) {
        console.error(`Error updating matched_count for id ${userNumberEntry.id}:`, updateError);
        errors.push({ id: userNumberEntry.id, error: updateError.message });
      } else {
        updatedCount++;
      }
    }

    console.log(`Backfill completed. Updated ${updatedCount} entries.`);
    res.status(200).json({ 
      message: `Backfill completed. Updated ${updatedCount} entries.`, 
      updatedCount, 
      errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error) {
    console.error('Error during backfill process:', error);
    res.status(500).json({ error: 'Backfill process failed.', details: error.message, updatedCount, errors });
  }
} 