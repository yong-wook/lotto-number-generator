import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { randomInt } from 'crypto';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const lottoData = readLottoData();
    const pastNumbers = collectPastNumbers(lottoData);
    const { finalNumbers } = getRecommendedNumbers(pastNumbers, lottoData.drawDates, lottoData.lottoNumbers, lottoData.bonusNumbers); // 구조 분해 할당
    
    res.status(200).json({ finalNumbers }); // minOccurrenceNumbers 제거
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function readLottoData() {
  const filePath = path.join(process.cwd(), 'public', 'lotto_results.csv');
  const fileContent = fs.readFileSync(filePath);
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const lottoNumbers = [];
  const bonusNumbers = [];
  const drawDates = [];

  records.forEach(row => {
    if (row['draw_no']) {
      lottoNumbers.push(row['numbers'].split(', '));
      bonusNumbers.push(row['bonus']);
      drawDates.push(row['date']);
    }
  });

  return { lottoNumbers, bonusNumbers, drawDates };
}

function collectPastNumbers(lottoData) {
  const { lottoNumbers, bonusNumbers, drawDates } = lottoData;
  const pastNumbers = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 0-11
  const currentYear = now.getFullYear();

  drawDates.forEach((date, index) => {
    const drawDate = new Date(date);
    const monthsDifference = (currentYear - drawDate.getFullYear()) * 12 + (currentMonth - (drawDate.getMonth() + 1));
    if (monthsDifference % 6 === 0) {
      pastNumbers.push(...lottoNumbers[index]);
      pastNumbers.push(bonusNumbers[index]);
    }
  });

  return pastNumbers;
}

function getRecommendedNumbers(pastNumbers, drawDates, lottoNumbers, bonusNumbers) {
  if (pastNumbers.length === 0) {
    console.error('과거 번호가 없습니다. 추천 번호를 생성할 수 없습니다.');
    return [null]; // 추천 번호가 없음을 나타내는 null 반환
  }

  const numberCounts = {};

  pastNumbers.forEach(num => {
    numberCounts[num] = (numberCounts[num] || 0) + 1;
  });

  const sortedNumbers = Object.entries(numberCounts).sort((a, b) => b[1] - a[1]);
  
  // 올해 이번달에 당첨번호 및 보너스 번호로 출현한 숫자 제외
  const currentWinningNumbers = new Set();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 0-11
  const currentYear = now.getFullYear();

  drawDates.forEach((date, index) => {
    const drawDate = new Date(date);
    if (drawDate.getFullYear() === currentYear && drawDate.getMonth() + 1 === currentMonth) {
      currentWinningNumbers.add(...lottoNumbers[index]);
      currentWinningNumbers.add(bonusNumbers[index]);
    }
  });

  // sortedNumbers에서 현재 당첨 번호 제외
  const filteredSortedNumbers = sortedNumbers.filter(num => !currentWinningNumbers.has(Number(num[0])));

  // 최대 출현 번호 두 개 선택
  const recommendedNumbers = filteredSortedNumbers.slice(0, 2).map(num => Number(num[0]));

  const leastCommonNumbers = sortedNumbers.slice(-4).map(num => num[0].trim()); // 개행 문자 제거

  const excludedNumbers = new Set(leastCommonNumbers);
  recommendedNumbers.forEach(num => excludedNumbers.add(num)); // 추천 번호도 제외

  // 중복을 방지하기 위해 Set을 사용하여 랜덤 번호 생성
  const randomNumbersSet = new Set();
  while (randomNumbersSet.size < 4) { // 4개 랜덤 번호 생성
    const num = randomInt(1, 46); // 1부터 45까지의 숫자 생성
    if (!excludedNumbers.has(num)) { // 최소 출현 번호 및 추천 번호 제외
      randomNumbersSet.add(num);
    }
  }

  // 추천 번호와 랜덤 번호를 합친 후 오름차순 정렬
  const finalNumbers = [...recommendedNumbers, ...Array.from(randomNumbersSet)].map(Number).sort((a, b) => a - b);

  // 최소 출현 번호가 finalNumbers에 포함되는지 확인
  const hasLeastCommon = leastCommonNumbers.some(num => finalNumbers.includes(Number(num)));
  if (hasLeastCommon) {
    console.error('최소 출현 번호가 finalNumbers에 포함되었습니다:', leastCommonNumbers);
    // 최소 출현 번호가 포함된 경우, 다시 랜덤 번호를 생성
    return getRecommendedNumbers(pastNumbers, drawDates, lottoNumbers, bonusNumbers); // 재귀 호출
  }

  // 디버그용 콘솔 출력
  console.log('추천 번호:', recommendedNumbers);
  console.log('최소 출현 번호:', leastCommonNumbers); // 최소 출현 번호 출력
  console.log('최종 번호:', finalNumbers); 
  // 추천 번호와 최소 출현 번호를 반환
  return { finalNumbers }; // minOccurrenceNumbers 제거
}
