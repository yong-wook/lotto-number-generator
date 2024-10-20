import axios from 'axios';
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../lib/supabase';

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 주의: 이 키는 절대 클라이언트 측에 노출되면 안 됩니다!
)

const checkAndFetchMissingDraws = async (recentDrawNo) => {
  console.log('checkAndFetchMissingDraws 시작:', recentDrawNo);

  // Supabase에서 최신 회차 번호 가져오기
  const { data: latestDraw, error: fetchError } = await supabaseAdmin
    .from('lottoResults')
    .select('drwNo')
    .order('drwNo', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('Supabase 데이터 가져오기 오류:', fetchError);
    return false; // 오류 발생 시 false 반환
  }

  const maxDrawNo = latestDraw.length > 0 ? latestDraw[0].drwNo : 0;
  
  console.log('Supabase에서 가장 큰 회차 번호:', maxDrawNo);
  console.log('최근 회차 번호:', recentDrawNo);

  if (maxDrawNo < recentDrawNo) {
    console.log(`최근 회차 번호(${recentDrawNo})가 Supabase의 최대 회차 번호(${maxDrawNo})보다 큽니다. 비어있는 회차 정보 가져오기...`);
    
    for (let drawNo = maxDrawNo + 1; drawNo <= recentDrawNo; drawNo++) {
      const response = await axios.get(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`);
      const data = response.data;

      if (data.returnValue === "success") {
        console.log('API 응답:', data);
        
        // Supabase에 데이터 추가
        const { error: insertError } = await supabaseAdmin
          .from('lottoResults')
          .insert({
            drwNo: data.drwNo,
            drwNoDate: data.drwNoDate,
            numbers: `${data.drwtNo1},${data.drwtNo2},${data.drwtNo3},${data.drwtNo4},${data.drwtNo5},${data.drwtNo6}`,
            bonus: data.bnusNo
          });

        if (insertError) {
          console.error('Supabase 데이터 삽입 오류:', insertError);
        }
      } else {
        console.log(`회차 ${drawNo}의 당첨 정보 가져오기 실패`);
      }
    }
  } else {
    console.log(`최근 회차 번호(${recentDrawNo})가 Supabase의 최대 회차 번호(${maxDrawNo})보다 작거나 같습니다. 업데이트 필요 없음.`);
    return false; // 업데이트가 필요 없는 경우 false 반환
  }

  return true; // 업데이트가 필요한 경우 true 반환
};

export default async function handler(req, res) {
  try {
    const response = await axios.get('https://www.dhlottery.co.kr/common.do?method=main&mainMode=default', {
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
      throw new Error('추첨일을 찾 못했습니다.');
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

    // Supabase와 비교 및 업데이트
    const needsUpdate = await checkAndFetchMissingDraws(parseInt(drawNumber));

    if (needsUpdate) {
      // Supabase에 최신 데이터 저장 또는 업데이트
      try {
        const { data, error } = await supabaseAdmin
          .from('lottoResults')
          .upsert({
            drwNo: result.drwNo,
            drwNoDate: result.drwNoDate,
            numbers: `${result.drwtNo1},${result.drwtNo2},${result.drwtNo3},${result.drwtNo4},${result.drwtNo5},${result.drwtNo6}`,
            bonus: result.bnusNo
          }, { onConflict: 'drwNo' });

        if (error) {
          console.error('Supabase 데이터 업데이트 오류:', error);
        } else {
          console.log('Supabase 데이터 업데이트 성공');
        }
      } catch (error) {
        console.error('Supabase 작업 중 예외 발생:', error);
      }
    } else {
      console.log('데이터베이스 업데이트가 필요하지 않습니다.');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('파싱 오류:', error.message);
    
    // 오류 발생 시 Supabase에서 최신 데이터 가져오기
    const { data: latestData, error: fetchError } = await supabase
      .from('lottoResults')
      .select('*')
      .order('drwNo', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Supabase 데이터 가져오기 오류:', fetchError);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (latestData && latestData.length > 0) {
      const fallbackData = {
        returnValue: 'success',
        drwNo: latestData[0].drwNo,
        drwNoDate: latestData[0].drwNoDate,
        ...latestData[0].numbers.split(',').reduce((acc, num, index) => {
          acc[`drwtNo${index + 1}`] = num;
          return acc;
        }, {}),
        bnusNo: latestData[0].bonus
      };
      console.log('Supabase에서 가져온 최신 데이터 사용:', fallbackData);
      res.status(200).json(fallbackData);
    } else {
      res.status(500).json({ error: 'No data available' });
    }
  }
}
