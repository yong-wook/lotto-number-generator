import { supabaseAdmin } from '../../lib/supabase';
import { randomInt } from 'crypto';

export default async function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다' });
  }

  try {
    // 1. 모든 로또 결과 데이터 가져오기
    const { data: allLottoData, error: lottoError } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .order('drwNo', { ascending: true }); // 오래된 회차부터 정렬

    if (lottoError) {
      console.error('로또 데이터 가져오기 오류:', lottoError);
      return res.status(500).json({ error: '로또 데이터를 가져오는 데 실패했습니다' });
    }

    if (!allLottoData || allLottoData.length === 0) {
      return res.status(404).json({ error: '로또 데이터가 없습니다' });
    }

    // 2. 히스토리 테이블에 이미 있는 회차 번호 조회
    const { data: existingHistory, error: historyError } = await supabaseAdmin
      .from('recommendHistory')
      .select('week');

    if (historyError && !historyError.message.includes('does not exist')) {
      console.error('히스토리 데이터 조회 오류:', historyError);
      return res.status(500).json({ error: '히스토리 데이터 조회에 실패했습니다' });
    }

    // 이미 있는 회차 번호 집합 생성
    const existingWeeks = new Set();
    if (existingHistory) {
      existingHistory.forEach(item => existingWeeks.add(item.week));
    }

    // 3. 과거 50개 회차에 대해 소급 추천 번호 생성
    const startIndex = Math.max(0, allLottoData.length - 60); // 최근 60개 회차부터 거꾸로
    const processedDraws = [];
    const errors = [];

    for (let i = allLottoData.length - 1; i >= startIndex; i--) {
      const currentDraw = allLottoData[i];
      
      // 이미 처리된 회차는 건너뛰기
      if (existingWeeks.has(currentDraw.drwNo.toString())) {
        console.log(`회차 ${currentDraw.drwNo}는 이미 처리됨. 건너뜀`);
        continue;
      }

      try {
        // 현재 회차 이전의 모든 로또 데이터
        const pastData = allLottoData.slice(0, i);
        
        // 현재 회차 이전 6주 데이터
        const recentPastData = pastData.slice(Math.max(0, pastData.length - 6));
        
        // 소급 추천 번호 계산
        const recommendedData = getRecommendedNumbers(pastData, recentPastData);
        
        // 회차 정보와 날짜 가져오기
        const weekNumber = currentDraw.drwNo.toString();
        const drawDate = currentDraw.drwNoDate;
        
        // 추천 데이터 저장
        const { error: insertError } = await supabaseAdmin
          .from('recommendHistory')
          .insert({
            week: weekNumber,
            date: drawDate,
            recommendedPair: recommendedData.recommendedPair,
            excludedNumbers: recommendedData.excludedNumbers,
          });
        
        if (insertError) {
          console.error(`회차 ${weekNumber} 저장 오류:`, insertError);
          errors.push({ week: weekNumber, error: insertError.message });
        } else {
          processedDraws.push(weekNumber);
          console.log(`회차 ${weekNumber} 추천 데이터 저장 완료`);
        }
      } catch (error) {
        console.error(`회차 ${currentDraw.drwNo} 처리 중 오류:`, error);
        errors.push({ week: currentDraw.drwNo.toString(), error: error.message });
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `${processedDraws.length}개 회차 처리 완료`, 
      processedDraws,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}

// 소급 추천 번호 계산 함수
function getRecommendedNumbers(lottoData, recentData) {
  const numberPairs = {};
  const numberCounts = {};
  const currentWinningNumbers = new Set();
  
  // 가장 최근 당첨 번호 (현재 기준으로)
  if (recentData.length > 0) {
    const latestDraw = recentData[recentData.length - 1];
    const latestNumbers = latestDraw.numbers ? 
      latestDraw.numbers.split(',').map(Number) : 
      [1, 2, 3, 4, 5, 6].map(i => latestDraw[`drwtNo${i}`]).filter(Boolean).map(Number);
    
    latestNumbers.forEach(num => currentWinningNumbers.add(num));
    
    if (latestDraw.bnusNo) {
      currentWinningNumbers.add(Number(latestDraw.bnusNo));
    }
  }

  // 데이터 분석 - 과거 당첨 패턴 파악
  lottoData.forEach(item => {
    const numbers = item.numbers ? 
      item.numbers.split(',').map(Number) : 
      [1, 2, 3, 4, 5, 6].map(i => item[`drwtNo${i}`]).filter(Boolean).map(Number);
    
    // 모든 숫자의 출현 횟수 계산
    numbers.forEach(num => {
      numberCounts[num] = (numberCounts[num] || 0) + 1;
    });
    
    if (item.bnusNo) {
      const bonusNumber = Number(item.bnusNo);
      numberCounts[bonusNumber] = (numberCounts[bonusNumber] || 0) + 1;
    }

    // 모든 가능한 숫자 쌍에 대해 카운트 증가
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const pair = [numbers[i], numbers[j]].sort((a, b) => a - b).join(',');
        numberPairs[pair] = (numberPairs[pair] || 0) + 1;
      }
    }
  });

  // 가장 많이 함께 나온 두 숫자 찾기
  let maxPair = null;
  let maxCount = 0;

  Object.entries(numberPairs).forEach(([pair, count]) => {
    const [num1, num2] = pair.split(',').map(Number);
    if (count > maxCount && !currentWinningNumbers.has(num1) && !currentWinningNumbers.has(num2)) {
      maxPair = [num1, num2];
      maxCount = count;
    }
  });

  // 가장 많이 함께 나온 쌍이 없으면 랜덤하게 생성
  if (!maxPair) {
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1)
      .filter(num => !currentWinningNumbers.has(num));
    
    if (availableNumbers.length >= 2) {
      const num1Index = Math.floor(Math.random() * availableNumbers.length);
      const num1 = availableNumbers[num1Index];
      availableNumbers.splice(num1Index, 1);
      
      const num2Index = Math.floor(Math.random() * availableNumbers.length);
      const num2 = availableNumbers[num2Index];
      
      maxPair = [num1, num2].sort((a, b) => a - b);
    } else {
      maxPair = [1, 2]; // 기본값
    }
  }

  // 가장 적게 출현한 숫자 찾기
  let leastCommonNumbers = [];
  if (Object.keys(numberCounts).length > 0) {
    leastCommonNumbers = Object.entries(numberCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 4)
      .map(entry => Number(entry[0]));
  } else {
    // 데이터가 없으면 랜덤 생성
    while (leastCommonNumbers.length < 4) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!leastCommonNumbers.includes(num) && !maxPair.includes(num)) {
        leastCommonNumbers.push(num);
      }
    }
  }

  // 최근 데이터에서 가장 많이 나온 숫자 찾기
  const recentNumberCounts = {};
  
  recentData.forEach(item => {
    const numbers = item.numbers ? 
      item.numbers.split(',').map(Number) : 
      [1, 2, 3, 4, 5, 6].map(i => item[`drwtNo${i}`]).filter(Boolean).map(Number);
    
    numbers.forEach(num => {
      recentNumberCounts[num] = (recentNumberCounts[num] || 0) + 1;
    });
    
    if (item.bnusNo) {
      const bonusNumber = Number(item.bnusNo);
      recentNumberCounts[bonusNumber] = (recentNumberCounts[bonusNumber] || 0) + 1;
    }
  });
  
  let mostCommonRecentNumbers = [];
  if (Object.keys(recentNumberCounts).length > 0) {
    mostCommonRecentNumbers = Object.entries(recentNumberCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => Number(entry[0]));
  } else {
    // 데이터가 없으면 랜덤 생성
    while (mostCommonRecentNumbers.length < 2) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!mostCommonRecentNumbers.includes(num)) {
        mostCommonRecentNumbers.push(num);
      }
    }
  }

  // 제외할 숫자 조합
  const combinedExcludedNumbers = [...leastCommonNumbers, ...mostCommonRecentNumbers];
  const uniqueExcludedNumbers = [...new Set(combinedExcludedNumbers)];
  
  // 최종 제외 숫자 (최대 6개)
  const excludedNumbers = uniqueExcludedNumbers.slice(0, 6).sort((a, b) => a - b);

  return { 
    recommendedPair: maxPair,
    excludedNumbers
  };
} 