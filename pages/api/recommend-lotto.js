import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { randomInt } from 'crypto';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const lottoData = readLottoData();
    const pastNumbers = collectPastNumbers(lottoData);
    const recommendedNumbers = getRecommendedNumbers(pastNumbers);
    
    res.status(200).json({ recommendedNumbers });
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

function getRecommendedNumbers(pastNumbers) {
  const numberCounts = {};

  pastNumbers.forEach(num => {
    numberCounts[num] = (numberCounts[num] || 0) + 1;
  });

  const sortedNumbers = Object.entries(numberCounts).sort((a, b) => b[1] - a[1]);
  const recommendedNumber = sortedNumbers[0] ? sortedNumbers[0][0] : null;
  const leastCommonNumbers = sortedNumbers.slice(-4).map(num => num[0]);

  const excludedNumbers = new Set(leastCommonNumbers);
  if (recommendedNumber) excludedNumbers.add(recommendedNumber);

  const remainingNumbers = Object.keys(numberCounts).filter(num => !excludedNumbers.has(num));
  const randomNumbers = [];

  while (randomNumbers.length < 5) {
    const randomIndex = randomInt(0, remainingNumbers.length);
    const randomNum = remainingNumbers[randomIndex];
    if (!randomNumbers.includes(randomNum)) {
      randomNumbers.push(randomNum);
    }
  }

  const additionalRandomNumbers = Array.from({ length: 6 }, () => randomInt(1, 46));

  return [recommendedNumber, ...randomNumbers, ...additionalRandomNumbers];
}
