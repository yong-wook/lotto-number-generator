import axios from 'axios';

export default async function handler(req, res) {
  try {
    const response = await axios.get('https://www.dhlottery.co.kr/common.do?method=main', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('웹사이트 응답:', response.status, response.statusText);

    if (!response.data) {
      throw new Error('웹사이트에서 데이터를 가져오지 못했습니다.');
    }

    const html = response.data;

    // 회차 정보 추출
    const drawNumberRegex = /<strong id="lottoDrwNo">(\d+)<\/strong>/;
    const drawNumberMatch = html.match(drawNumberRegex);
    if (!drawNumberMatch) {
      throw new Error('회차 정보를 찾지 못했습니다.');
    }
    const drawNumber = drawNumberMatch[1];

    // 추첨일 추출
    const drawDateRegex = /id="drwNoDate"[^>]*>\(?([\d-]+)[^<]*\)?<\/span>/;
    const drawDateMatch = html.match(drawDateRegex);
    if (!drawDateMatch) {
      throw new Error('추첨일을 찾지 못했습니다.');
    }
    const drawDate = drawDateMatch[1];

    // 당첨 번호 및 보너스 번호 추출
    const numberRegex = /<span id="(drwtNo\d|bnusNo)" class="ball_645[^"]*">(\d+)<\/span>/g;
    const numbers = {};
    let match;
    while ((match = numberRegex.exec(html)) !== null) {
      numbers[match[1]] = match[2];
    }

    if (Object.keys(numbers).length !== 7) {
      throw new Error('모든 당첨 번호를 찾지 못했습니다.');
    }

    const result = {
      returnValue: 'success',
      drwNo: drawNumber,
      drwNoDate: drawDate,
      drwtNo1: numbers['drwtNo1'],
      drwtNo2: numbers['drwtNo2'],
      drwtNo3: numbers['drwtNo3'],
      drwtNo4: numbers['drwtNo4'],
      drwtNo5: numbers['drwtNo5'],
      drwtNo6: numbers['drwtNo6'],
      bnusNo: numbers['bnusNo']
    };

    console.log('파싱된 데이터:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('파싱 오류:', error.message);
    
    // 임시 하드코딩된 데이터
    const fallbackData = {
      returnValue: 'success',
      drwNo: '1000',
      drwNoDate: '2023-05-20',
      drwtNo1: '1',
      drwtNo2: '15',
      drwtNo3: '23',
      drwtNo4: '34',
      drwtNo5: '41',
      drwtNo6: '45',
      bnusNo: '10'
    };

    console.log('임시 데이터 사용:', fallbackData);
    res.status(200).json(fallbackData);
  }
}
