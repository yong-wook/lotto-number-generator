import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { drawRound } = req.body;

    // 1. 해당 회차의 당첨번호 조회
    const { data: winningData, error: winningError } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .eq('drwNo', drawRound)
      .single();

    if (winningError) throw winningError;

    const winningNumbers = winningData.numbers.split(',').map(Number);
    const bonusNumber = winningData.bonus;

    // 2. 해당 회차의 생성된 번호들 조회
    const { data: generatedData, error: generatedError } = await supabaseAdmin
      .from('generated_numbers')
      .select('*')
      .eq('draw_round', drawRound)
      .eq('status', 'pending');

    if (generatedError) throw generatedError;

    // 3. 각 번호세트의 당첨 여부 확인 및 업데이트
    const updates = generatedData.map(entry => {
      const matchedNumbers = entry.numbers.filter(num => winningNumbers.includes(num));
      const isBonusMatched = entry.numbers.includes(bonusNumber);
      
      // 당첨 등수 계산
      let rank = null;
      let amount = 0;
      
      if (matchedNumbers.length === 6) {
        rank = 1;
        amount = winningData.firstWinamnt;
      } else if (matchedNumbers.length === 5 && isBonusMatched) {
        rank = 2;
        amount = winningData.secondWinamnt;
      } else if (matchedNumbers.length === 5) {
        rank = 3;
        amount = winningData.thirdWinamnt;
      } else if (matchedNumbers.length === 4) {
        rank = 4;
        amount = winningData.fourthWinamnt;
      } else if (matchedNumbers.length === 3) {
        rank = 5;
        amount = winningData.fifthWinamnt;
      }

      return {
        id: entry.id,
        matched_numbers: matchedNumbers,
        is_bonus_matched: isBonusMatched,
        winning_rank: rank,
        winning_amount: amount,
        status: 'checked'
      };
    });

    // 4. 일괄 업데이트
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('generated_numbers')
        .update({
          matched_numbers: update.matched_numbers,
          is_bonus_matched: update.is_bonus_matched,
          winning_rank: update.winning_rank,
          winning_amount: update.winning_amount,
          status: update.status
        })
        .eq('id', update.id);

      if (updateError) throw updateError;
    }

    res.status(200).json({ 
      message: '당첨 확인 완료', 
      checked: updates.length 
    });
  } catch (error) {
    console.error('Error checking winning numbers:', error);
    res.status(500).json({ error: 'Failed to check winning numbers' });
  }
} 