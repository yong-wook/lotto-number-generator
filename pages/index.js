import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';

export default function Home() {
  const [recentWinningNumbers, setRecentWinningNumbers] = useState(null);
  const [currentDrawNo, setCurrentDrawNo] = useState(null);
  const [pastWinningNumbers, setPastWinningNumbers] = useState([]);
  const [showPastNumbers, setShowPastNumbers] = useState(false);
  const [excludeNumbers, setExcludeNumbers] = useState('');
  const [includeNumbers, setIncludeNumbers] = useState('');
  const [lottoNumbers, setLottoNumbers] = useState([]);
  const [finalNumbers, setFinalNumbers] = useState([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [savedNumbers, setSavedNumbers] = useState([]);
  const [showSavedNumbers, setShowSavedNumbers] = useState(true);
  const [showGenerator, setShowGenerator] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); // 다크 모드 상태 기본값을 true로 설정
  const [recommendedPair, setRecommendedPair] = useState([]);
  const [excludedNumbers, setExcludedNumbers] = useState([]);
  const [currentWeekInfo, setCurrentWeekInfo] = useState('');
  // 히스토리 관련 상태 추가
  const [recommendHistory, setRecommendHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [showGeneratedHistory, setShowGeneratedHistory] = useState(false);
  const [loadingGeneratedHistory, setLoadingGeneratedHistory] = useState(false);
  const [winningNumbersMap, setWinningNumbersMap] = useState({}); // 당첨 번호 맵 상태 추가
  const [selectedWeeks, setSelectedWeeks] = useState(4); // 선택된 주 상태 추가 (기본값 4주)
  const numbersRef = useRef(null);
  const [statsRecommendedNumbers, setStatsRecommendedNumbers] = useState([]); // 통계 기반 추천 번호 상태
  
  // 마지막으로 눌린 버튼을 추하는 상태 추가
  const [lastButtonPressed, setLastButtonPressed] = useState(null);
  
  // 암호 관련 상태 추가
  const [historyPassword, setHistoryPassword] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // 현재 날짜를 기반으로 "몇년 몇월의 몇째 주" 형태로 포맷팅하는 함수
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // 현재 날짜가 해당 월의 몇 번째 주인지 계산
    const firstDayOfMonth = new Date(year, now.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    
    // 현재 날짜의 일(day)
    const currentDay = now.getDate();
    
    // 첫 번째 주에 며칠이 포함되어 있는지 계산 (7 - 첫날의 요일)
    const daysInFirstWeek = 7 - dayOfWeek;
    
    let weekNumber;
    if (currentDay <= daysInFirstWeek) {
      weekNumber = 1;
    } else {
      weekNumber = Math.ceil((currentDay - daysInFirstWeek) / 7) + 1;
    }
    
    return `${year}년 ${month}월 ${weekNumber}째주`;
  };

  const fetchCurrentLottoNumber = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const response = await fetch('/api/lotto');
      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }
      const data = await response.json();
      setRecentWinningNumbers(data);
      setCurrentDrawNo(data.drwNo);
    } catch (error) {
      console.error('현재 로또 번호 가져오기 실패:', error);
      setRecentWinningNumbers(null);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const fetchPastWinningNumbers = useCallback(async () => {
    if (!currentDrawNo) return; // currentDrawNo가 없으면 API 호출 방지
    setLoadingPast(true);
    try {
      // API 호출 시 selectedWeeks를 파라미터로 추가
      const response = await fetch(`/api/past-lotto?currentDrawNo=${currentDrawNo}&weeks=${selectedWeeks}`);
      const data = await response.json();
      setPastWinningNumbers(data);
    } catch (error) {
      console.error("Error fetching past winning numbers:", error);
    } finally {
      setLoadingPast(false);
    }
  }, [currentDrawNo, selectedWeeks]); // 의존성 배열에 currentDrawNo와 selectedWeeks 추가

  const togglePastNumbers = useCallback(() => {
    if (!showPastNumbers) {
      fetchPastWinningNumbers(); // 항상 최신 selectedWeeks 기준으로 fetch
    }
    setShowPastNumbers(!showPastNumbers);
  }, [showPastNumbers, currentDrawNo, selectedWeeks, fetchPastWinningNumbers]); // selectedWeeks와 fetchPastWinningNumbers 의존성 추가

  // 추천 히스토리 가져오기 함수 추가
  const fetchRecommendHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/recommendation-history');
      const data = await response.json();
      setRecommendHistory(data);
    } catch (error) {
      console.error('추천 히스토리 가져오기 실패:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 히스토리 표시 토글 함수 수정
  const toggleHistory = useCallback(() => {
    if (!showHistory) {
      if (!isPasswordCorrect) {
        // 암호가 맞지 않으면 암호 입력창 표시
        setShowPasswordInput(true);
      } else {
        // 암호가 이미 맞았다면 히스토리 데이터 가져오기
        fetchRecommendHistory();
      }
    }
    setShowHistory(!showHistory);
  }, [showHistory, isPasswordCorrect]);

  // 암호 확인 함수 추가
  const checkPassword = useCallback(() => {
    const trimmedPassword = historyPassword.trim();
    if (trimmedPassword === '열려라 참깨') {
      setIsPasswordCorrect(true);
      setShowPasswordInput(false);
      fetchRecommendHistory();
    } else {
      alert('암호가 맞지 않습니다.');
    }
  }, [historyPassword]);

  useEffect(() => {
    fetchCurrentLottoNumber();
  }, [fetchCurrentLottoNumber]);

  // selectedWeeks가 변경되고, 과거 번호가 이미 표시된 상태라면 다시 데이터를 가져옵니다.
  useEffect(() => {
    if (showPastNumbers) {
      fetchPastWinningNumbers();
    }
  }, [selectedWeeks, showPastNumbers, fetchPastWinningNumbers]); // fetchPastWinningNumbers는 useCallback으로 감싸져 있으므로 의존성에 직접 추가해도 됨

  // 페이지 로드 시 현재 주 정보 설정
  useEffect(() => {
    setCurrentWeekInfo(getCurrentWeekInfo());
  }, []);

  // 페이지 로드 시 자동으로 추천 정보 가져오기
  useEffect(() => {
    const fetchRecommendInfo = async () => {
      try {
        const response = await fetch('/api/recommend-lotto');
        const data = await response.json();
        console.log("자동 추천 정보:", data);
        setRecommendedPair(data.recommendedPair);
        setExcludedNumbers(data.excludedNumbers);
      } catch (error) {
        console.error('추천 정보 가져오기 실패:', error);
      }
    };
    
    fetchRecommendInfo();
  }, []);

  // 로또 번호 생성 수
  const generateLottoNumbers = useCallback(async () => {
    console.log('=== generateLottoNumbers 함수 시작 ===');
    
    try {
      // /api/recommend-lotto API 호출하여 추천 번호 가져오기
      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      
      console.log('추천 번호 데이터:', data);
      const { recommendedPair, excludedNumbers, nextDrawNo } = data;
      
      // 사용자가 입력한 제외/포함 번호 처리
      const userExcluded = excludeNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
      const userIncluded = includeNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
      
      // 모든 제외 번호 합치기 (API 제공 + 사용자 입력)
      const allExcluded = [...(data.excludedNumbers || []), ...userExcluded]; // API 응답의 excludedNumbers 사용 নিশ্চিত
      
      // 최종 번호 생성
      let numbers = [...userIncluded];
      
      // 포함 번호가 적으면 추천 번호 쌍 추가
      if (numbers.length < 2) {
        for (const num of recommendedPair) {
          if (!numbers.includes(num) && !allExcluded.includes(num) && numbers.length < 2) {
            numbers.push(num);
          }
        }
      }
      
      // 나머지 번호 랜덤 생성
      while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num) && !allExcluded.includes(num)) {
          numbers.push(num);
        }
      }
      
      numbers.sort((a, b) => a - b);
      console.log('생성된 번호:', numbers);

      setLottoNumbers(numbers);
      setAnimationKey(prev => ((typeof prev === 'string' && prev.startsWith('stats-')) ? parseInt(prev.substring(6), 10) : (typeof prev === 'number' ? prev : 0)) + 1);
      setLastButtonPressed('generate');
      setShowGenerator(false);

      // 생성된 번호를 DB에 저장
      console.log('=== 번호 저장 시작 ===');
      console.log('저장할 회차:', nextDrawNo);
      console.log('저장할 번호:', numbers);

      // API 호출하여 저장
      const saveResponse = await fetch('/api/save-lotto-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numbers: numbers,
          draw_round: nextDrawNo
        }),
      });

      if (!saveResponse.ok) {
        console.error('번호 저장 실패:', saveResponse.status);
      } else {
        const result = await saveResponse.json();
        console.log('저장 성공:', result);
      }
    } catch (error) {
      console.error('번호 생성/저장 중 오류:', error);
    }
  }, [excludeNumbers, includeNumbers]);

  const saveLottoNumbers = async () => {
    console.log('saveLottoNumbers 함수 호출됨');
    const numbersToSave = lottoNumbers.length > 0 ? lottoNumbers : finalNumbers;
    console.log('저장할 번호:', numbersToSave);
    
    if (numbersToSave.length === 0) {
      alert('저장할 번호가 없습니다.');
      return;
    }

    if (savedNumbers.length < 5) {
      setSavedNumbers(prev => {
        const newSavedNumbers = [...prev, numbersToSave];
        console.log('새로 저장된 번호:', newSavedNumbers);
        return newSavedNumbers;
      });
      // 저장 후 생성/추천 번호 영역 초기화
      setLottoNumbers([]);
      setFinalNumbers([]);
    } else {
      alert('최대 5개까지 저장할 수 있습니다.');
    }
  };

  // AI 추천 번호 가져오기
  const fetchRecommendedNumbers = async () => {
    setFinalNumbers([]); // 기존 추천 번호 삭제
    setLottoNumbers([]); // 기존 생성된 번호 삭제

    try {
      console.log('=== AI 추천 번호 생성 시작 ===');
      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      console.log("추천 번호 데이터:", data);
      
      // API 응답에서 나온 추천 번호 데이터 추출
      const { recommendedPair, excludedNumbers, nextDrawNo } = data;
      
      // API로부터 받은 추천 번호 쌍과 제외 번호를 화면에 표시
      setRecommendedPair(recommendedPair);
      setExcludedNumbers(excludedNumbers);
      
      // /api/lotto 호출하여 최신 회차 정보 확인
      const lottoResponse = await fetch('/api/lotto');
      const lottoData = await lottoResponse.json();
      console.log("최신 로또 데이터:", lottoData);
      
      // 최신 번호 기반으로 추천 번호 생성
      // 추천 번호 쌍은 포함하고, 제외 번호는 제외
      const finalNumbers = [...recommendedPair];
      while (finalNumbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!finalNumbers.includes(num) && !excludedNumbers.includes(num)) {
          finalNumbers.push(num);
        }
      }
      finalNumbers.sort((a, b) => a - b);
      
      console.log("저장할 회차:", nextDrawNo);
      console.log("저장할 번호:", finalNumbers);
      
      setFinalNumbers(finalNumbers);
      setAnimationKey(prev => ((typeof prev === 'string' && prev.startsWith('stats-')) ? parseInt(prev.substring(6), 10) : (typeof prev === 'number' ? prev : 0)) + 1);

      // lotto_numbers 테이블에 저장
      const saveResponse = await fetch('/api/save-lotto-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numbers: finalNumbers,
          draw_round: nextDrawNo
        }),
      });

      if (!saveResponse.ok) {
        console.error('추천 번호 저장 실패:', await saveResponse.text());
      } else {
        const result = await saveResponse.json();
        console.log('저장 결과:', result);
      }
    } catch (error) {
      console.error('추천 번호 가져오기 실패:', error);
    }
    setLastButtonPressed('recommend');
    setShowGenerator(false);
  };

  const deleteSavedNumbers = (index) => {
    setSavedNumbers(prev => prev.filter((_, i) => i !== index));
  };

  // 배경 색상 결정 함수
  const getBackgroundColor = (number) => {
    const num = parseInt(number);
    if (num >= 1 && num <= 10) return '#fbc400';
    if (num >= 11 && num <= 20) return '#69c8f2';
    if (num >= 21 && num <= 30) return '#ff7272';
    if (num >= 31 && num <= 40) return '#aaa';
    if (num >= 41 && num <= 45) return '#b0d840';
    return '#ffffff';
  };

  // 클립보드에 복사하는 함수
  const copyToClipboard = (numbers) => {
    const textToCopy = numbers.map((set, index) => `세트 ${index + 1}: ${set.join(', ')}`).join('\n'); // 세트별로 구분하여 복사
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess('복사 완료!');
      setTimeout(() => setCopySuccess(''), 2000); // 2초 후 메시지 제거
    }, (err) => {
      console.error('복사 실패: ', err);
      setCopySuccess('복사 실패');
    });
  };

  // 카카오톡 공유 함수
  const shareToKakao = (numbers) => {
    console.log('shareToKakao 함수에 전달된 numbers:', numbers);
    if (typeof window !== 'undefined' && window.Kakao) {
        if (!window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
        }
        
        if (window.Kakao.Link) {
            let textToShare = '';
            if (Array.isArray(numbers)) {
                if (Array.isArray(numbers[0])) {
                    // numbers가 배열의 배열인 경우 (저장된 여러 세트)
                    textToShare = numbers.map((set, index) => `세트 ${index + 1}: ${set.join(', ')}`).join('\n');
                } else {
                    // 단일 배열인 우 (단일 세트)
                    textToShare = `세트 1: ${numbers.join(', ')}`;
                }
            } else {
                console.error('numbers는 배열이 아닙니다.');
                return;
            }
            
            console.log('공유할 텍스트:', textToShare); // 공유할 텍스트 로그 추가
            
            window.Kakao.Link.sendDefault({
                objectType: 'text',
                text: textToShare,
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                },
            });
        } else {
            console.error('Kakao.Link is not available');
        }
    } else {
        console.error('Kakao SDK is not loaded');
    }
  };

  useEffect(() => {
    console.log('현재 저장된 번호:', savedNumbers);
  }, [savedNumbers]);

  // 다시 생성하기 버튼 클릭 핸들러
  const handleRegenerate = () => {
    if (lastButtonPressed === 'generate') {
      generateLottoNumbers(); // 생성하기 기능 호출
    } else if (lastButtonPressed === 'recommend') {
      fetchRecommendedNumbers(); // AI 추천 기능 호출
    }
  };

  // 생성된 번호 저장
  const saveGeneratedNumbers = async () => {
    const numbersToSave = lottoNumbers.length > 0 ? lottoNumbers : finalNumbers;
    if (numbersToSave.length === 0) {
      alert('저장할 번호가 없습니다.');
      return;
    }

    try {
      const response = await fetch('/api/number-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numbers: numbersToSave,
          drawRound: currentDrawNo + 1, // 다음 회차를 위한 번호
        }),
      });

      if (!response.ok) throw new Error('저장 실패');
      
      const data = await response.json();
      alert('번호가 저장되었습니다.');
      
      // 저장된 번호 목록 새로고침
      if (showGeneratedHistory) {
        fetchGeneratedHistory();
      }
    } catch (error) {
      console.error('번호 저장 실패:', error);
      alert('번호 저장에 실패했습니다.');
    }
  };

  // 저장된 번호 히스토리 조회 함수 수정
  const fetchGeneratedHistory = async () => {
    setLoadingGeneratedHistory(true);
    setWinningNumbersMap({}); // 당첨 번호 맵 초기화
    try {
      const historyResponse = await fetch('/api/number-history');
      if (!historyResponse.ok) throw new Error('히스토리 조회 실패');

      const historyData = await historyResponse.json();
      setGeneratedHistory(historyData);

      // 히스토리가 있으면 해당 회차들의 당첨 번호 조회
      if (historyData.length > 0) {
        // Set을 사용하여 중복 회차 번호 제거 후 join
        const uniqueRounds = [...new Set(historyData.map(item => item.draw_round).filter(round => round != null))];
        const roundsQuery = uniqueRounds.join(',');

        // 중복 제거된 회차 번호로 API 호출
        if (roundsQuery) { // 회차 정보가 있을 때만 호출
          const winningNumbersResponse = await fetch(`/api/winning-numbers-by-round?rounds=${roundsQuery}`);
          if (winningNumbersResponse.ok) {
            const winningData = await winningNumbersResponse.json();
            setWinningNumbersMap(winningData);
          }
        }
      }
    } catch (error) {
      console.error('히스토리 조회 또는 당첨 번호 조회 실패:', error);
      alert('히스토리 조회에 실패했습니다.');
    } finally {
      setLoadingGeneratedHistory(false);
    }
  };

  // 3개 이상 일치하는 번호만 필터링하는 로직 (useMemo 사용)
  const filteredGeneratedHistory = useMemo(() => {
    if (!generatedHistory || generatedHistory.length === 0) {
      return []; // 데이터가 없으면 빈 배열 반환
    }

    // item.matched_count 값을 직접 사용하여 필터링
    return generatedHistory.filter(item => item.matched_count >= 3);

  }, [generatedHistory]); // 의존성 배열에서 winningNumbersMap 제거

  // 당첨 확인
  const checkWinningNumbers = async (drawRound) => {
    try {
      const response = await fetch('/api/check-winning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drawRound }),
      });

      if (!response.ok) throw new Error('당첨 확인 실패');
      
      const data = await response.json();
      alert(`${data.checked}개의 번호에 대한 당첨 확인이 완료되었습니다.`);
      
      // 히스토리 새로고침
      fetchGeneratedHistory();
    } catch (error) {
      console.error('당첨 확인 실패:', error);
      alert('당첨 확인에 실패했습니다.');
    }
  };

  const testSaveNumbers = async () => {
    console.log('테스트 저장 함수 호출됨');
    const testNumbers = [1, 2, 3, 4, 5, 6];  // 테스트용 번호
    
    try {
      console.log('API 호출 시도:', {
        numbers: testNumbers,
        draw_round: 1
      });
      
      const response = await fetch('/api/save-lotto-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numbers: testNumbers,
          draw_round: 1
        }),
      });

      console.log('API 응답:', response.status);
      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (!response.ok) {
        console.error('번호 저장 실패');
        return;
      }

      alert('테스트 번호가 저장되었습니다!');
    } catch (error) {
      console.error('번호 저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 통계 계산 로직 (useMemo 활용)
  const individualNumberStats = useMemo(() => {
    if (!pastWinningNumbers || pastWinningNumbers.length === 0) {
      return [];
    }
    const counts = {};
    pastWinningNumbers.forEach(draw => {
      const drawnInThisDraw = new Set(); // 한 회차에 중복 등장시 1회로 카운트 위함 (사실상 로또번호는 중복없으나 안전장치)
      for (let i = 1; i <= 6; i++) {
        const num = draw[`drwtNo${i}`];
        drawnInThisDraw.add(num);
      }
      drawnInThisDraw.forEach(num => {
        counts[num] = (counts[num] || 0) + 1;
      });
    });

    const stats = [];
    const numberOfDraws = pastWinningNumbers.length;
    for (let i = 1; i <= 45; i++) {
      const count = counts[i] || 0;
      const percentage = numberOfDraws > 0 ? (count / numberOfDraws) * 100 : 0;
      stats.push({
        number: i,
        count,
        percentage: percentage.toFixed(1) + '%',
      });
    }
    return stats;
  }, [pastWinningNumbers]);

  const colorGroupStats = useMemo(() => {
    if (!pastWinningNumbers || pastWinningNumbers.length === 0) {
      return [];
    }
    const groups = [
      { name: '1-10번대 (노랑)', color: '#fbc400', range: [1, 10], count: 0, numbers: [] },
      { name: '11-20번대 (파랑)', color: '#69c8f2', range: [11, 20], count: 0, numbers: [] },
      { name: '21-30번대 (빨강)', color: '#ff7272', range: [21, 30], count: 0, numbers: [] },
      { name: '31-40번대 (회색)', color: '#aaa', range: [31, 40], count: 0, numbers: [] },
      { name: '41-45번대 (초록)', color: '#b0d840', range: [41, 45], count: 0, numbers: [] },
    ];

    let totalNumbersDrawn = 0;
    pastWinningNumbers.forEach(draw => {
      for (let i = 1; i <= 6; i++) {
        const num = draw[`drwtNo${i}`];
        totalNumbersDrawn++;
        for (const group of groups) {
          if (num >= group.range[0] && num <= group.range[1]) {
            group.count++;
            group.numbers.push(num); // 어떤 번호가 속했는지 추적 (선택사항)
            break;
          }
        }
      }
    });

    return groups.map(group => ({
      ...group,
      percentage: totalNumbersDrawn > 0 ? ((group.count / totalNumbersDrawn) * 100).toFixed(1) + '%' : '0.0%',
    }));
  }, [pastWinningNumbers]);

  // 통계 기반 번호 추천 함수
  const generateStatsBasedRecommendation = useCallback(() => {
    if (!individualNumberStats || individualNumberStats.length === 0 || !pastWinningNumbers || pastWinningNumbers.length === 0) {
      alert('통계 데이터가 없습니다. 먼저 지난 회차를 조회하고 분석할 데이터가 있는지 확인해주세요.');
      return;
    }

    const weightedLotteryPool = [];
    individualNumberStats.forEach(stat => {
      // 등장 횟수 + 1을 가중치로 사용하여 모든 번호에 기본 선택 확률 부여
      const weight = stat.count + 1; 
      for (let i = 0; i < weight; i++) {
        weightedLotteryPool.push(stat.number);
      }
    });

    if (weightedLotteryPool.length === 0) {
      // 만약의 경우, 풀이 비어있다면 순수 랜덤 번호 생성 (이론상 발생하기 어려움)
      const pureRandomNumbers = [];
      while (pureRandomNumbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!pureRandomNumbers.includes(num)) {
          pureRandomNumbers.push(num);
        }
      }
      setStatsRecommendedNumbers(pureRandomNumbers.sort((a, b) => a - b));
      setAnimationKey(prev => `stats-${prev + 1}`); // 애니메이션 키 구분
      return;
    }

    const recommendedSet = new Set();
    let attempts = 0; // 무한 루프 방지
    while (recommendedSet.size < 6 && attempts < 1000) {
      const randomIndex = Math.floor(Math.random() * weightedLotteryPool.length);
      const pickedNumber = weightedLotteryPool[randomIndex];
      recommendedSet.add(pickedNumber);
      attempts++;
    }
    
    if (recommendedSet.size < 6) {
        // weightedLotteryPool에 유니크한 숫자가 6개 미만일 극단적인 경우 (예: N이 매우 작고 나온숫자만 반복된경우 + 가중치로 인해)
        // 이 경우 나머지 숫자는 순수 랜덤으로 채움
        const existingNumbers = Array.from(recommendedSet);
        while(recommendedSet.size < 6  && attempts < 2000) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!recommendedSet.has(num)) {
                recommendedSet.add(num);
            }
            attempts++;
        }
    }

    const finalRecommendedNumbers = Array.from(recommendedSet).sort((a, b) => a - b);
    setStatsRecommendedNumbers(finalRecommendedNumbers);
    setAnimationKey(prev => `stats-${typeof prev === 'string' ? parseInt(prev.split('-')[1] || '0') + 1 : prev + 1}`); 

  }, [individualNumberStats, pastWinningNumbers]);

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}> {/* 다크 모드 클래스 추가 */}
      <Head>
        <title>로또 번호 생성기</title>
        <meta name="description" content="AI 기반 로또 번호 생성기" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="title-container">
          <h1 className="title">Use Wook`s 로또</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="dark-mode-button">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* 번호 생성기 숨기기 버튼 */}
        <button onClick={() => setShowGenerator(!showGenerator)} className="action-button">
          {showGenerator ? '번호 생성기 숨기기' : '번호 생성기 보기'}
        </button>

        {/* 히스토리 표시 버튼 추가 - 은밀하게 변경 */}
        <button 
          onClick={toggleHistory} 
          className="subtle-history-button"
          title={showHistory ? '추천 히스토리 숨기기' : '추천 히스토리 보기'}
        >
          <span className="history-icon">&#8634;</span>
        </button>

        {/* 암호 입력 창 추가 */}
        {showPasswordInput && !isPasswordCorrect && (
          <div className="password-container">
            <input
              type="text"
              value={historyPassword}
              onChange={(e) => setHistoryPassword(e.target.value)}
              placeholder="히스토리 접근 암호를 입력하세요"
              className="password-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // 한글 입력 완료 후 Enter 키 처리
                  e.preventDefault();
                  setTimeout(() => checkPassword(), 10);
                }
              }}
              autoComplete="off"
            />
            <button onClick={checkPassword} className="password-button">확인</button>
          </div>
        )}

        {/* 고정 추천수와 고정 제외수 정보 섹션 */}
        {recommendedPair.length > 0 && excludedNumbers.length > 0 && (
          <div className="recommendation-info">
            <div className="recommendation-title">
              <h3>{currentWeekInfo} 로또 추천 정보</h3>
            </div>
            <div className="recommendation-numbers">
              <div className="recommendation-section">
                <h4>추천 고정수</h4>
                <div className="info-numbers">
                  {recommendedPair.map((number, index) => (
                    <span
                      key={index}
                      className="number"
                      style={{ backgroundColor: getBackgroundColor(number) }}
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
              <div className="recommendation-section">
                <h4>추천 제외수</h4>
                <div className="info-numbers">
                  {excludedNumbers.map((number, index) => (
                    <span
                      key={index}
                      className="number"
                      style={{ backgroundColor: getBackgroundColor(number) }}
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 히스토리 섹션은 암호가 맞았을 때만 표시 */}
        {showHistory && isPasswordCorrect && (
          <div className="recommend-history-container">
            <h3 className="recommend-history-title">추천/제외 번호 적중 히스토리</h3>
            {loadingHistory ? (
              <p>로딩 중...</p>
            ) : recommendHistory.length === 0 ? (
              <p>히스토리 정보가 없습니다.</p>
            ) : (
              <div className="recommend-history-list">
                {recommendHistory.map((item, index) => {
                  return (
                    <div key={index} className="recommend-history-item">
                      <h4>{item.week}회차 ({new Date(item.date).toLocaleDateString()})</h4>
                      {/* 추천/제외 통계 그룹 */}
                      <div className="history-stats-row">
                        <p>추천 적중: {item.recommendHits}/{item.recommendedPair?.length ?? 0}</p>
                        <p>제외 실패: {item.excludeFailures}/{item.excludedNumbers?.length ?? 0}</p>
                      </div>
                      {/* 추천/제외 번호 그룹 */}
                      <div className="history-rec-ex-row">
                        {/* 추천 번호 섹션 */}
                        <div className="history-number-section">
                          <h5>추천 번호</h5>
                          <div className="recommend-history-numbers">
                            {(item.recommendedPair || []).map((num, i) => (
                              <span key={`rec-${i}`} className="number" style={{ backgroundColor: getBackgroundColor(num) }}>{num}</span>
                            ))}
                          </div>
                        </div>
                        {/* 제외 번호 섹션 */}
                        <div className="history-number-section">
                          <h5>제외 번호</h5>
                          <div className="recommend-history-numbers">
                            {(item.excludedNumbers || []).map((num, i) => (
                              <span key={`exc-${i}`} className="number" style={{ backgroundColor: getBackgroundColor(num) }}>{num}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* 당첨 번호 섹션 (별도 유지) */}
                      <div className="history-number-section winning-section">
                        <h5>당첨 번호</h5>
                        <div className="recommend-history-numbers">
                          {(item.winningNumbers || []).map((num, i) => (
                            <span key={`win-${i}`} className="number" style={{ backgroundColor: getBackgroundColor(num) }}>{num}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 번호 생성기 영역 추가 */}
        {showGenerator && (
          <div className="generator">
            <div>
              <label htmlFor="excludeNumbers">제외할 번호:</label>
              <input
                type="text"
                id="excludeNumbers"
                value={excludeNumbers}
                onChange={(e) => setExcludeNumbers(e.target.value)}
                placeholder="예: 1, 2, 3"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="includeNumbers">포함할 번호:</label>
              <input
                type="text"
                id="includeNumbers"
                value={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.value)}
                placeholder="예: 4, 5, 6"
                className="input-field"
              />
            </div>
            <div className="action-buttons">
              <button onClick={() => generateLottoNumbers()} className="generate-button">
                생성하기
              </button>
              <button onClick={fetchRecommendedNumbers} className="generate-button">
                AI 추천
              </button>
            </div>
          </div>
        )}

        {/* 생성된 번호와 추천 번호를 하나의 영역에서 보여줌 */}
        {(lottoNumbers.length > 0 || finalNumbers.length > 0) && (
          <div className="result animated" key={animationKey}>
            <h3>{lottoNumbers.length > 0 ? '생성된 번호' : '추천 번호'}</h3>
            <div className="numbers" ref={numbersRef}>
              {lottoNumbers.length > 0 ? (
                lottoNumbers.map((number, index) => (
                  <span
                    key={index}
                    className="number"
                    style={{ backgroundColor: getBackgroundColor(number) }}
                  >
                    {number}
                  </span>
                ))
              ) : (
                finalNumbers.map((number, index) => (
                  <span
                    key={index}
                    className="number"
                    style={{ backgroundColor: getBackgroundColor(number) }}
                  >
                    {number}
                  </span>
                ))
              )}
            </div>
            
            <div className="action-buttons">
              <button onClick={saveLottoNumbers} className="action-button">저장하기</button>
              <button onClick={handleRegenerate} className="action-button">다시 생성하기</button>
            </div>
          </div>
        )}

        {/* 저장된 번호 표시 버튼 추가 */}
        <button onClick={() => setShowSavedNumbers(!showSavedNumbers)} className="action-button">
          {showSavedNumbers ? '저장된 번호 숨기기' : '저장된 번호 보기'}
        </button>

        {/* 저장된 번호 영역 추가 */}
        {showSavedNumbers && (
          <div className="saved-numbers">
            <h3>저장된 번호</h3>
            {savedNumbers.length > 0 ? (
              savedNumbers.map((numbers, index) => (
                <div key={index} className="set-container"> {/* 세트별 컨테이너 추가 */}
                  <h4 className="set-title">Set {index + 1}</h4> {/* 세트 제목 */}
                  <div className="number-row"> {/* 번호와 삭제 버튼을 포함하는 행 */}
                    <div className="number-container"> {/* 숫자들을 수평으로 정렬 */}
                      {numbers.map((number, idx) => (
                        <span
                          key={idx}
                          className="number"
                          style={{ backgroundColor: getBackgroundColor(number) }}
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => deleteSavedNumbers(index)} className="delete-button">❌</button>
                  </div>
                </div>
              ))
            ) : (
              <p>저장된 번호가 없습니다.</p>
            )}
            <div className="action-buttons">
              <button onClick={() => copyToClipboard(savedNumbers)} className="action-button">모든 번호 복사하기</button>
              <button onClick={() => shareToKakao(savedNumbers)} className="kakao-share-button">
                <img src="/kakao-talk-icon.svg" alt="카카오톡 공유" className="kakao-icon" />
              </button>
            </div>
          </div>
        )}

        <div className="content">
          <div className="left-column">
            <div className="recent-numbers">
              {loadingRecent ? (
                <p className="loading-message">로딩 중...</p>
              ) : recentWinningNumbers ? (
                <div>
                  <h3>최근 당첨번호 (제 {recentWinningNumbers.drwNo}회)</h3>
                  <p>{recentWinningNumbers.drwNoDate}</p>
                  <div className="numbers">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <span
                        key={num}
                        className="number"
                        style={{ backgroundColor: getBackgroundColor(recentWinningNumbers[`drwtNo${num}`]) }}
                      >
                        {recentWinningNumbers[`drwtNo${num}`]}
                      </span>
                    ))}
                    <span
                      className="number bonus"
                      style={{ backgroundColor: getBackgroundColor(recentWinningNumbers.bnusNo), border: '2px solid #ffcc00', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: '0.6rem', color: 'black' }}>bonus</span>
                      {recentWinningNumbers.bnusNo}
                    </span>
                  </div>
                </div>
              ) : (
                <p>당첨 번호를 가져오는 데 실패했습니다.</p>
              )}
            </div>
            
            {recentWinningNumbers && ( // 최근 당첨번호가 있을 때만 버튼 노출
              <div className="past-numbers-controls">
                <input
                  type="number"
                  value={selectedWeeks}
                  onChange={(e) => {
                    let value = parseInt(e.target.value, 10);
                    if (isNaN(value) || value < 1) {
                      value = 1;
                    } else if (value > 20) {
                      value = 20;
                    }
                    setSelectedWeeks(value);
                  }}
                  min="1"
                  max="20"
                  className="weeks-input" // CSS 클래스 변경 또는 신규 적용
                />
                <span className="weeks-input-label">주</span>
                <button onClick={togglePastNumbers} className="past-numbers-button">
                  {showPastNumbers ? '지난 당첨번호 숨기기' : `지난 ${selectedWeeks}주간 당첨번호 조회`}
                </button>
              </div>
            )}
            
            {loadingPast ? (
              <p className="loading-message">로딩 중...</p>
            ) : showPastNumbers && pastWinningNumbers.length > 0 ? (
              pastWinningNumbers.map((number, index) => (
                <div key={index}>
                  <h3>제 {number.drwNo}회 ({number.drwNoDate})</h3>
                  <div className="numbers">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <span
                        key={num}
                        className="number"
                        style={{ backgroundColor: getBackgroundColor(number[`drwtNo${num}`]) }}
                      >
                        {number[`drwtNo${num}`]}
                      </span>
                    ))}
                    <span
                      className="number bonus"
                      style={{ backgroundColor: getBackgroundColor(number.bnusNo), border: '2px solid #ffcc00', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: '0.6rem', color: 'black' }}>bonus</span>
                      {number.bnusNo}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              pastWinningNumbers.length === 0 ? null : (
                null)
            )}

            {/* 지난 N주간 당첨번호 통계 섹션 */}
            {showPastNumbers && pastWinningNumbers.length > 0 && (
              <div className="past-numbers-statistics">
                <h3 className="statistics-title">
                  지난 {selectedWeeks}주간 당첨번호 통계 (총 {pastWinningNumbers.length}회 분석)
                </h3>

                <div className="number-appearance-stats">
                  <h4>번호별 등장 비율</h4>
                  <div className="stats-grid">
                    {individualNumberStats.map(stat => (
                      <div key={stat.number} className="stat-item individual-stat-item">
                        <span
                          className="number"
                          style={{ backgroundColor: getBackgroundColor(stat.number) }}
                        >
                          {stat.number}
                        </span>
                        <span className="percentage">{stat.percentage}</span>
                        <span className="count">({stat.count}회)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="color-group-stats">
                  <h4>색상(번호대)별 등장 비율 (총 {pastWinningNumbers.length * 6}개 번호 기준)</h4>
                  <ul>
                    {colorGroupStats.map(stat => (
                      <li key={stat.name} className="stat-item color-group-stat-item">
                        <span className="color-swatch" style={{ backgroundColor: stat.color }}></span>
                        <span className="group-name">{stat.name}:</span>
                        <span className="percentage">{stat.percentage}</span>
                        <span className="count">({stat.count}개)</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 통계 기반 번호 추천 버튼 */}
                <div className="stats-recommend-button-container">
                  <button onClick={generateStatsBasedRecommendation} className="generate-button stats-recommend-button">
                    통계 기반 번호 추천
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 새로운 기능 UI 추가 */}
        <div className="history-controls">
          <button
            onClick={saveGeneratedNumbers}
            className={`save-button ${
              (lottoNumbers.length > 0 || finalNumbers.length > 0)
                ? 'active'
                : 'disabled'
            }`}
            disabled={lottoNumbers.length === 0 && finalNumbers.length === 0}
          >
            번호 저장하기
          </button>
          <button
            onClick={() => {
              setShowGeneratedHistory(!showGeneratedHistory);
              if (!showGeneratedHistory) {
                fetchGeneratedHistory();
              }
            }}
            className="history-toggle-button"
          >
            {showGeneratedHistory ? '히스토리 숨기기' : '히스토리 보기'}
          </button>
        </div>
        
        {showGeneratedHistory && (
          <div className="generated-history-container">
            <h3 className="history-title">적중 히스토리 (3개 이상)</h3>
            {loadingGeneratedHistory ? (
              <p>로딩 중...</p>
            ) : filteredGeneratedHistory.length === 0 ? (
              <p>3개 이상 적중한 번호 기록이 없습니다.</p>
            ) : (
              <div className="generated-history">
                {filteredGeneratedHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-item-header">
                      <h5>{`회차: ${item.draw_round}`}</h5>
                      <p>{new Date(item.created_at).toLocaleDateString()}</p>
                      {item.win_grade && <span className="win-grade">{item.win_grade}등</span>}
                    </div>
                    <div className="history-item-numbers">
                      {item.numbers && item.numbers.map((number, idx) => {
                        const isMatched = winningNumbersMap[item.draw_round]?.includes(Number(number));
                        return (
                          <span
                            key={idx}
                            className={`number ${isMatched ? 'matched-number' : ''}`}
                            style={{ backgroundColor: getBackgroundColor(number) }}
                          >
                            {number}
                          </span>
                        );
                      })}
                    </div>
                    {winningNumbersMap[item.draw_round] && (
                      <div className="winning-numbers-display">
                        <span className="winning-label">당첨:</span>
                        {winningNumbersMap[item.draw_round].map((wn, wnIdx) => (
                          <span key={`wn-${wnIdx}`} className="number small" style={{ backgroundColor: getBackgroundColor(wn) }}>
                            {wn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 통계 기반 추천 번호 표시 영역 */}
        {statsRecommendedNumbers.length > 0 && (
          <div className="result animated stats-recommended-numbers-result" key={animationKey}> 
            <h3>통계 기반 추천 번호</h3>
            <div className="numbers">
              {statsRecommendedNumbers.map((number, index) => (
                <span
                  key={index}
                  className="number"
                  style={{ backgroundColor: getBackgroundColor(number) }}
                >
                  {number}
                </span>
              ))}
            </div>
            {/* 여기에 저장하기 등의 추가 버튼을 원하면 추가 가능 */}
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        main {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
          width: 100%;
        }

        .recommendation-info {
          width: 100%;
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 2rem;
        }

        .recommendation-section {
          flex: 1;
        }

        .info-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-numbers {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .numbers {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin: 0.5rem 0;
          width: 100%;
        }

        .number {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
        }

        .generator {
          width: 100%;
          margin-bottom: 2rem;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .result {
          width: 100%;
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .saved-numbers {
          width: 100%;
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .number-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 0.5rem 0;
        }

        .number-container {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .dark-mode {
          background-color: #121212; /* 다크 모드 배경색 */
          color: #e0e0e0; /* 다크 모드 기본 텍스트 색상 */
        }

        .dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode h4 {
          color: #ffffff; /* 다크 모드에서 제목 색상을 더 밝게 */
        }

        .dark-mode .result h3, .dark-mode .saved-numbers h3 {
          color: #6FCF75; /* 다크 모드에서 결과 및 저장된 번호 제목 색상 */
          font-weight: bold;
        }

        .dark-mode .set-title {
          color: #6FCF75; /* 다크 모드에서 세트 제목 색상 */
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0 0 1rem;
          line-height: 1.15;
          font-size: 2.5rem;
          text-align: center;
        }

        .result {
          background-color: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem; /* 아래쪽 여백 추가 */
          width: 100%; /* 너비를 100%로 설정 */
        }

        .numbers {
          display: flex !important;
          flex-direction: row !important;
          gap: 0.5rem;
          justify-content: flex-start !important;
          flex-wrap: nowrap !important;
          margin: 0.5rem 0;
          width: 100%;
        }

        .number {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
        }

        .action-buttons {
          display: flex;
          justify-content: center; /* 중앙 정렬 */
          gap: 1rem; /* 튼 간격 조정 */
          margin-top: 1rem; /* 위쪽 여백 추가 */
        }

        .action-button {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .action-button:hover {
          background-color: #45a049;
        }

        .saved-numbers {
          margin-top: 2rem;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .delete-button {
          margin-left: 10px;
          background-color: red;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          padding: 0 5px;
        }

        .past-numbers-button {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          background-color: #4CAF50; /* 다른 버튼들과 동일한 색상 */
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-top: 1rem; /* 위쪽 여백 추가 */
        }

        .past-numbers-button:hover {
          background-color: #45a049; /* 호버 시 색상 변경 */
        }

        .past-numbers-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .weeks-dropdown {
          padding: 0.5rem;
          font-size: 1rem;
          border-radius: 5px;
          border: 1px solid #ccc;
        }

        .weeks-input {
          padding: 0.5rem;
          font-size: 1rem;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 60px; /* 입력 필드 너비 조절 */
          text-align: center;
          background-color: #4A4A4A; /* 진한 회색 배경 */
          color: #FFFFFF; /* 선명한 하얀색 글씨 */
          border: 1px solid #555555; /* 테두리 색상 조정 */
          font-weight: bold; /* 글씨 볼드 처리 */
        }

        .weeks-input-label {
          font-size: 1rem;
          margin-left: 0.25rem; /* 입력 필드와 "주" 사이 간격 */
          font-weight: bold; /* 글씨 볼드 처리 */
        }

        @media (max-width: 768px) {
          .content {
            flex-direction: column;
          }
        }

        .loading-message {
          animation: fadeIn 1s infinite;
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }

        .kakao-share-button {
          padding: 0.5rem;
          background-color: #FEE500;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kakao-share-button:hover {
          background-color: #FDD835;
        }

        .kakao-icon {
          width: 24px;
          height: 24px;
        }

        .copy-message {
          margin-top: 0.5rem;
          color: #4CAF50;
          font-weight: bold;
        }

        .generator {
          margin-bottom: 2rem;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* 통계 섹션 스타일 */
        .past-numbers-statistics {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          background-color: #f9f9f9; /* 밝은 배경색 */
        }
        .dark-mode .past-numbers-statistics {
          background-color: #2c2c2c; /* 다크모드 배경색 */
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .statistics-title {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        .number-appearance-stats, .color-group-stats {
          margin-bottom: 1.5rem;
        }
        .number-appearance-stats h4, .color-group-stats h4 {
          margin-bottom: 1rem;
          font-size: 1.2rem;
          border-bottom: 2px solid #eee;
          padding-bottom: 0.5rem;
        }
        .dark-mode .number-appearance-stats h4, .dark-mode .color-group-stats h4 {
          border-bottom-color: #444;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.8rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          border-radius: 6px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .dark-mode .stat-item {
          background-color: #3a3a3a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .individual-stat-item .number { /* 번호 공 크기 유지 */
          width: 30px;
          height: 30px;
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }
        .stat-item .percentage {
          font-weight: bold;
          font-size: 0.95rem;
          color: #333;
        }
        .dark-mode .stat-item .percentage {
          color: #eee;
        }
        .stat-item .count {
          font-size: 0.8rem;
          color: #666;
        }
        .dark-mode .stat-item .count {
          color: #bbb;
        }
        .color-group-stats ul {
          list-style: none;
          padding: 0;
        }
        .color-group-stat-item {
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
          padding: 0.8rem 0.5rem; /* 패딩 조정 */
          margin-bottom: 0.5rem;
          gap: 0.5rem; /* 요소 간 간격 */
        }
        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          flex-shrink: 0; /* 크기 고정 */
        }
        .color-group-stat-item .group-name {
          flex-grow: 1;
          font-size: 0.9rem;
        }
        .dark-mode .weeks-input-label {
            color: #e0e0e0; /* 다크모드에서 "주" 라벨 색상 */
        }
        .stats-recommend-button-container {
          text-align: center;
          margin-top: 1.5rem;
        }
        .stats-recommend-button {
          padding: 0.8rem 1.5rem;
          font-size: 1.1rem;
          background-color: #28a745; /* 초록색 계열 버튼 */
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .stats-recommend-button:hover {
          background-color: #218838;
        }
        .stats-recommended-numbers-result {
          /* 기존 .result 스타일과 유사하게 하거나, 필요시 추가 스타일링 */
          margin-top: 1rem; 
        }
      `}</style>
    </div>
  );
}
