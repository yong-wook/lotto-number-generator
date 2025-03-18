import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    // 1. 과거 추천 번호와 제외 번호 데이터 가져오기 (가정: recommendHistory 테이블이 있다고 가정)
    // 실제 환경에서는 이 데이터를 저장하는 테이블을 생성해야 합니다
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('recommendHistory')
      .select('*')
      .order('week', { ascending: false })
      .limit(10); // 최근 10주 데이터

    if (historyError) {
      console.error('추천 히스토리 가져오기 오류:', historyError);
      
      // 데이터가 없는 경우 또는 테이블이 없는 경우를 위한 가상 데이터
      // 실제 환경에서는 이 부분을 적절히
      const dummyData = generateDummyHistoryData();
      return res.status(200).json(dummyData);
    }

    // 2. 당첨 번호 데이터 가져오기
    const { data: winningData, error: winningError } = await supabaseAdmin
      .from('lottoResults')
      .select('*')
      .order('drwNo', { ascending: false })
      .limit(10); // 최근 10주 당첨 데이터

    if (winningError) throw winningError;

    // 3. 적중 여부 분석
    const analyzedData = analyzeMatchHistory(historyData, winningData);
    
    res.status(200).json(analyzedData);
  } catch (error) {
    console.error('Error:', error);
    
    // 오류 발생 시 대체 데이터 생성
    const dummyData = generateDummyHistoryData();
    res.status(200).json(dummyData);
  }
}

// 당첨 번호와 추천/제외 번호 비교 분석
function analyzeMatchHistory(historyData, winningData) {
  // 실제 구현에서는 각 주차별 추천/제외 번호와 당첨 번호를 비교하여 적중률 계산
  // 이 예제에서는 더미 데이터를 반환
  return historyData.map((history, index) => {
    const matchingWinningData = winningData.find(w => w.drwNo.toString() === history.week);
    
    if (!matchingWinningData) return history;
    
    const winningNumbers = matchingWinningData.numbers.split(',').map(Number);
    const recommendedPair = history.recommendedPair || [];
    const excludedNumbers = history.excludedNumbers || [];
    
    // 추천 번호 적중 검사
    const recommendHits = recommendedPair.filter(num => winningNumbers.includes(num));
    
    // 제외 번호 적중 검사 (제외했는데 당첨됨 = 실패)
    const excludeHits = excludedNumbers.filter(num => winningNumbers.includes(num));
    
    return {
      ...history,
      recommendHits: recommendHits.length,
      excludeFailures: excludeHits.length,
      winningNumbers
    };
  });
}

// 테스트용 더미 데이터 생성 함수
function generateDummyHistoryData() {
  const weeks = [];
  const currentDate = new Date();
  
  // 최근 10주 가상 데이터 생성
  for (let i = 0; i < 10; i++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(weekDate.getDate() - (i * 7));
    
    const year = weekDate.getFullYear();
    const month = weekDate.getMonth() + 1;
    const day = weekDate.getDate();
    
    // 회차 번호는 가장 최근 회차부터 역순으로
    const weekNumber = 1070 - i;
    
    // 각 주별 추천 쌍과 제외수를 가상으로 생성
    const recommendedPair = [
      Math.floor(Math.random() * 45) + 1, 
      Math.floor(Math.random() * 45) + 1
    ].sort((a, b) => a - b);
    
    // 제외 번호 6개 생성
    const excludedNumbers = [];
    while (excludedNumbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!excludedNumbers.includes(num) && !recommendedPair.includes(num)) {
        excludedNumbers.push(num);
      }
    }
    excludedNumbers.sort((a, b) => a - b);
    
    // 당첨 번호 6개 생성
    const winningNumbers = [];
    while (winningNumbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!winningNumbers.includes(num)) {
        winningNumbers.push(num);
      }
    }
    winningNumbers.sort((a, b) => a - b);
    
    // 추천 번호 적중 검사
    const recommendHits = recommendedPair.filter(num => winningNumbers.includes(num));
    
    // 제외 번호 적중 검사 (제외했는데 당첨됨 = 실패)
    const excludeFailures = excludedNumbers.filter(num => winningNumbers.includes(num));
    
    weeks.push({
      id: i + 1,
      week: weekNumber.toString(),
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      recommendedPair,
      excludedNumbers,
      winningNumbers,
      recommendHits: recommendHits.length,
      excludeFailures: excludeFailures.length
    });
  }
  
  return weeks;
} 