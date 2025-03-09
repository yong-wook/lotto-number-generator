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
      .limit(4);

    if (recentError) throw recentError;

    const recommendedNumbers = getRecommendedNumbers(data, recentData);
    res.status(200).json(recommendedNumbers);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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

  // 최근 4주간 당첨 번호에서 가장 많이 나온 숫자 찾기
  const recentNumberCounts = {};
  
  recentData.forEach(item => {
    const numbers = item.numbers.split(',').map(Number);
    numbers.forEach(num => {
      recentNumberCounts[num] = (recentNumberCounts[num] || 0) + 1;
    });
    recentNumberCounts[item.bonus] = (recentNumberCounts[item.bonus] || 0) + 1;
  });
  
  // 최근 4주간 가장 많이 나온 숫자 2개 찾기
  const mostCommonRecentNumbers = Object.entries(recentNumberCounts)
    .sort((a, b) => b[1] - a[1])  // 내림차순 정렬
    .slice(0, 2)
    .map(entry => Number(entry[0]));
    
  console.log('최근 4주간 가장 많이 나온 숫자 2개:', mostCommonRecentNumbers);

  // 제외수에 최근 4주간 가장 많이 나온 숫자 2개 추가
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
    excludedNumbers: uniqueExcludedNumbers.slice(0, 6)  // 최대 6개까지만 반환
  };
}
