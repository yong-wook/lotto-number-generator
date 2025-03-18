import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';
import { randomInt } from 'crypto';

export default async function handler(req, res) {
  try {
    // 모든 로또 결과 데이터 가져오기
    const { data, error } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .order('drwNo', { ascending: false });

    if (error) throw error;

    // 최근 4주간의 당첨 번호 가져오기
    const { data: recentData, error: recentError } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .order('drwNo', { ascending: false })
      .limit(6);

    if (recentError) throw recentError;

    // 추천 번호 생성
    const recommendedNumbers = getRecommendedNumbers(data, recentData);
    
    // 현재 시간 및 최신 회차 정보 가져오기
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 최신 회차 + 1을 다음 회차로 설정
    const nextDrawNo = recentData && recentData.length > 0 ? recentData[0].drwNo + 1 : 1;
    
    // recommendHistory 테이블에 저장
    try {
      // 먼저 이 회차에 대한 데이터가 이미 있는지 확인
      const { data: existingEntry, error: checkError } = await supabaseAdmin
        .from('recommendHistory')
        .select('*')
        .eq('week', nextDrawNo.toString())
        .maybeSingle();
        
      if (checkError && !checkError.message.includes('does not exist')) {
        console.error('기존 추천 데이터 확인 오류:', checkError);
      } else {
        if (existingEntry) {
          // 기존 데이터가 있을 경우, 새 추천 데이터와 비교
          const isRecommendedPairChanged = !arraysEqual(
            existingEntry.recommendedPair || [], 
            recommendedNumbers.recommendedPair || []
          );
          
          const isExcludedNumbersChanged = !arraysEqual(
            existingEntry.excludedNumbers || [], 
            recommendedNumbers.excludedNumbers || []
          );
          
          // 데이터가 변경된 경우에만 업데이트
          if (isRecommendedPairChanged || isExcludedNumbersChanged) {
            const { error: updateError } = await supabaseAdmin
              .from('recommendHistory')
              .update({
                date: formattedDate,
                recommendedPair: recommendedNumbers.recommendedPair,
                excludedNumbers: recommendedNumbers.excludedNumbers,
                updatedAt: new Date().toISOString()
              })
              .eq('id', existingEntry.id);
              
            if (updateError) {
              console.error('추천 데이터 업데이트 오류:', updateError);
            } else {
              console.log(`회차 ${nextDrawNo} 추천 데이터 변경되어 업데이트됨`);
            }
          } else {
            console.log(`회차 ${nextDrawNo} 추천 데이터 변경 없음, 업데이트 건너뜀`);
          }
        } else {
          // 새 데이터 삽입
          const { error: insertError } = await supabaseAdmin
            .from('recommendHistory')
            .insert({
              week: nextDrawNo.toString(),
              date: formattedDate,
              recommendedPair: recommendedNumbers.recommendedPair,
              excludedNumbers: recommendedNumbers.excludedNumbers,
              createdAt: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('추천 데이터 저장 오류:', insertError);
          } else {
            console.log(`회차 ${nextDrawNo} 추천 데이터 저장됨`);
          }
        }
      }
    } catch (saveError) {
      console.error('추천 데이터 저장 중 오류:', saveError);
      // 저장 실패해도 사용자에게는 추천 번호만 제공
    }

    res.status(200).json(recommendedNumbers);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// 두 배열이 동일한지 비교하는 헬퍼 함수
function arraysEqual(arr1, arr2) {
  // 길이가 다르면 다른 배열
  if (arr1.length !== arr2.length) return false;
  
  // 배열 정렬 후 비교 (순서 상관없이 같은 요소들을 포함하는지 확인)
  const sorted1 = [...arr1].sort((a, b) => a - b);
  const sorted2 = [...arr2].sort((a, b) => a - b);
  
  // 모든 요소 비교
  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i] !== sorted2[i]) return false;
  }
  
  return true;
}

function getRecommendedNumbers(lottoData, recentData) {
  const numberPairs = {};
  const numberCounts = {};
  const currentWinningNumbers = new Set();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 6개월 단위로 과거 데이터 수집
  const pastData = lottoData.filter(item => {
    const drawDate = new Date(item.drwNoDate);
    const monthsDifference = (currentYear - drawDate.getFullYear()) * 12 + (currentMonth - (drawDate.getMonth() + 1));
    return monthsDifference % 6 === 0;
  });

  pastData.forEach(item => {
    const numbers = item.numbers.split(',').map(Number);
    const drawDate = new Date(item.drwNoDate);

    // 현재 월의 당첨 번호 제외
    if (drawDate.getFullYear() === currentYear && drawDate.getMonth() + 1 === currentMonth) {
      numbers.forEach(num => currentWinningNumbers.add(num));
      currentWinningNumbers.add(item.bonus);
      return;
    }

    // 모든 숫자의 출현 횟수 계산
    numbers.forEach(num => {
      numberCounts[num] = (numberCounts[num] || 0) + 1;
    });
    numberCounts[item.bonus] = (numberCounts[item.bonus] || 0) + 1;

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

  console.log('가장 많이 함께 나온 두 숫자:', maxPair, '횟수:', maxCount);

  // 가장 적게 출현한 숫자 4개 찾기
  const leastCommonNumbers = Object.entries(numberCounts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(entry => Number(entry[0]));

  console.log('가장 적게 출현한 숫자 4개:', leastCommonNumbers);

  // 최근 6주간 당첨 번호에서 가장 많이 나온 숫자 2개 찾기
  const recentNumberCounts = {};
  
  recentData.forEach(item => {
    const numbers = item.numbers.split(',').map(Number);
    numbers.forEach(num => {
      recentNumberCounts[num] = (recentNumberCounts[num] || 0) + 1;
    });
    recentNumberCounts[item.bonus] = (recentNumberCounts[item.bonus] || 0) + 1;
  });
  
  // 최근 6주간 가장 많이 나온 숫자 2개 찾기
  const mostCommonRecentNumbers = Object.entries(recentNumberCounts)
    .sort((a, b) => b[1] - a[1])  // 내림차순 정렬
    .slice(0, 2)
    .map(entry => Number(entry[0]));
    
  console.log('최근 6주간 가장 많이 나온 숫자 2개:', mostCommonRecentNumbers);

  // 제외수에 최근 6주간 가장 많이 나온 숫자 2개 추가
  const combinedExcludedNumbers = [...leastCommonNumbers, ...mostCommonRecentNumbers];
  
  // 중복 제거
  const uniqueExcludedNumbers = [...new Set(combinedExcludedNumbers)];
  
  // 나머지 4개의 숫자 선택
  const excludedNumbers = new Set([...maxPair, ...currentWinningNumbers, ...uniqueExcludedNumbers]);
  const randomNumbersSet = new Set();
  while (randomNumbersSet.size < 4) {
    const num = randomInt(1, 46);
    if (!excludedNumbers.has(num)) {
      randomNumbersSet.add(num);
    }
  }

  const finalNumbers = [...maxPair, ...Array.from(randomNumbersSet)].sort((a, b) => a - b);

  console.log('최종 번호:', finalNumbers);

  return { 
    finalNumbers,
    recommendedPair: maxPair,
    excludedNumbers: uniqueExcludedNumbers.slice(0, 6).sort((a, b) => a - b)  // 최대 6개까지만 반환하고 오름차순 정렬
  };
}
