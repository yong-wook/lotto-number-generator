import { supabaseAdmin } from '../../lib/supabase';
import { randomInt } from 'crypto';

export default async function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다' });
  }

  try {
    // 1. 최근 로또 결과 데이터만 가져오기 (최근 60개 회차)
    const { data: allLottoData, error: lottoError } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .order('drwNo', { ascending: false }) // 최신 회차부터 정렬
      .limit(60); // 최근 60개 회차만 가져옴

    if (lottoError) {
      console.error('로또 데이터 가져오기 오류:', lottoError);
      return res.status(500).json({ error: '로또 데이터를 가져오는 데 실패했습니다' });
    }

    if (!allLottoData || allLottoData.length === 0) {
      return res.status(404).json({ error: '로또 데이터가 없습니다' });
    }
    
    // 현재 날짜 확인
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    
    // 최근 1년 이내의 데이터만 필터링
    const recentLottoData = allLottoData.filter(draw => {
      const drawDate = new Date(draw.drwNoDate);
      return drawDate >= oneYearAgo;
    });
    
    console.log(`총 ${allLottoData.length}개 회차 중 최근 1년 내 ${recentLottoData.length}개 회차를 처리합니다.`);

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

    // 3. 최근 데이터부터 역순으로 처리
    const processedDraws = [];
    const errors = [];
    
    // 중복 회차 방지를 위한 Set
    const processedDrawNos = new Set();

    for (const currentDraw of recentLottoData) {
      const weekNumber = currentDraw.drwNo.toString();
      
      // 이미 처리한 회차이거나 이미 히스토리에 있는 회차는 건너뛰기
      if (processedDrawNos.has(weekNumber) || existingWeeks.has(weekNumber)) {
        console.log(`회차 ${weekNumber}는 이미 처리됨. 건너뜀`);
        continue;
      }
      
      // 처리할 회차로 표시
      processedDrawNos.add(weekNumber);

      try {
        // 해당 회차보다 이전의 모든 로또 데이터 (역순으로 정렬된 데이터에서 이후 항목들)
        const index = allLottoData.findIndex(item => item.drwNo.toString() === weekNumber);
        if (index === -1) continue;
        
        const pastData = allLottoData.slice(index + 1);
        
        // 이전 회차 중 최대 6주 데이터
        const recentPastData = pastData.slice(0, 6);
        
        // 소급 추천 번호 계산
        const recommendedData = getRecommendedNumbers(pastData, recentPastData);
        
        // 날짜 가져오기 및 검증
        let drawDate = currentDraw.drwNoDate;
        if (!drawDate || !isValidDate(drawDate)) {
          drawDate = new Date().toISOString().split('T')[0]; // 유효하지 않은 날짜는 현재 날짜로 대체
        }
        
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
          console.log(`회차 ${weekNumber} (${drawDate}) 추천 데이터 저장 완료`);
        }
      } catch (error) {
        console.error(`회차 ${weekNumber} 처리 중 오류:`, error);
        errors.push({ week: weekNumber, error: error.message });
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

// 날짜 유효성 검사 함수
function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date > new Date('2000-01-01') && date <= new Date();
}

// 소급 추천 번호 계산 함수
function getRecommendedNumbers(lottoData, recentData) {
  const numberPairs = {};
  const numberCounts = {};
  const currentWinningNumbers = new Set();
  
  // 가장 최근 당첨 번호 (현재 기준으로)
  if (recentData.length > 0) {
    const latestDraw = recentData[0]; // 최근 데이터 중 가장 최신 데이터
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