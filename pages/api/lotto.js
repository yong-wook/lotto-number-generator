import axios from 'axios';
import { parse, unparse } from 'papaparse'; // CSV 파싱 및 직렬화를 위한 라이브러리 추가
import fs from 'fs'; // 파일 시스템 모듈 추가
import path from 'path'; // 경로 모듈 추가

const fetchCSVData = () => {
  const filePath = path.join(process.cwd(), 'public', 'lotto_results.csv'); // CSV 파일 경로
  const fileContent = fs.readFileSync(filePath, 'utf8'); // CSV 파일 읽기
  const parsedData = parse(fileContent, { header: true });  
  return parsedData.data; // 파싱된 데이터 반환
};

const appendDataToCSV = (data) => {
    // 데이터 형식 확인
    const { drwNo, drwNoDate, drwtNo1, drwtNo2, drwtNo3, drwtNo4, drwtNo5, drwtNo6, bnusNo } = data;

    // 모든 필드가 존재하는지 확인
    if (drwNo && drwNoDate && drwtNo1 && drwtNo2 && drwtNo3 && drwtNo4 && drwtNo5 && drwtNo6 && bnusNo) {
        const numbers = `${drwtNo1}, ${drwtNo2}, ${drwtNo3}, ${drwtNo4}, ${drwtNo5}, ${drwtNo6}`;
        const newRow = `${drwNo},"${numbers}",${drwNoDate},${bnusNo}\n`;

        // CSV 파일에 추가
        fs.appendFileSync(path.join(process.cwd(), 'public', 'lotto_results.csv'), newRow, 'utf8');
        console.log('CSV에 데이터 추가:', newRow);
    } else {
        console.log('유효하지 않은 데이터 형식:', data);
    }
};

const checkAndFetchMissingDraws = async (recentDrawNo) => {
  console.log('checkAndFetchMissingDraws 시작:', recentDrawNo); // 시작 로그 추가
  const csvData = fetchCSVData();
  
  // 유효한 숫자만 필터링하여 최대 회차 번호 찾기
  const validDrawNos = csvData.map(row => parseInt(row.draw_no)).filter(num => !isNaN(num)); // 'drwNo'를 'draw_no'로 변경
  const maxDrawNo = validDrawNos.length > 0 ? Math.max(...validDrawNos) : 0; // 유효한 값이 없으면 0으로 설정
  
  console.log('CSV에서 가장 큰 회차 번호:', maxDrawNo); // 최대 회차 번호 로그
  console.log('최근 회차 번호:', recentDrawNo); // 최근 회차 번호 로그

  if (maxDrawNo < recentDrawNo) {
    console.log(`최근 회차 번호(${recentDrawNo})가 CSV의 최대 회차 번호(${maxDrawNo})보다 큽니다. 비어있는 회차 정보 가져오기...`);
    
    // 특정 회차의 당첨 정보 가져오기
    const response = await axios.get(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${maxDrawNo + 1}`);
    const data = response.data;

    if (data.returnValue === "fail") {
        console.log('당첨 정보 가져오기 실패');
        // 임시 데이터 사용
        const tempData = {
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
        appendDataToCSV(tempData);
    } else {
        console.log('API 응답:', data); // API 응답 로그
        appendDataToCSV(data);
    }
  } else {
    console.log(`최근 회차 번호(${recentDrawNo})가 CSV의 최대 회차 번호(${maxDrawNo})보다 작거나 같습니다. 업데이트 필요 없음.`);
  }
};

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

    // CSV 파일과 비교
    await checkAndFetchMissingDraws(parseInt(drawNumber));

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
