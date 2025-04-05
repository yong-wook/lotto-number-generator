import { useState, useEffect, useCallback, useRef } from 'react';
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
  const numbersRef = useRef(null);
  
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

  const fetchPastWinningNumbers = async () => {
    setLoadingPast(true);
    try {
      const response = await fetch(`/api/past-lotto?currentDrawNo=${currentDrawNo}`);
      const data = await response.json();
      setPastWinningNumbers(data);
    } catch (error) {
      console.error("Error fetching past winning numbers:", error);
    } finally {
      setLoadingPast(false);
    }
  };

  const togglePastNumbers = useCallback(() => {
    if (!showPastNumbers) {
      fetchPastWinningNumbers();
    }
    setShowPastNumbers(!showPastNumbers);
  }, [showPastNumbers,currentDrawNo]);

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
      const allExcluded = [...excludedNumbers, ...userExcluded];
      
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
      setAnimationKey(prev => prev + 1);
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
    
    if (savedNumbers.length < 5 && numbersToSave.length > 0) {
      setSavedNumbers(prev => {
        const newSavedNumbers = [...prev, numbersToSave];
        console.log('새로 저장된 번호:', newSavedNumbers);
        return newSavedNumbers;
      });
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

  // 저장된 번호 히스토리 조회
  const fetchGeneratedHistory = async () => {
    setLoadingGeneratedHistory(true);
    try {
      const response = await fetch('/api/number-history');
      if (!response.ok) throw new Error('조회 실패');
      
      const data = await response.json();
      setGeneratedHistory(data);
    } catch (error) {
      console.error('히스토리 조회 실패:', error);
      alert('히스토리 조회에 실패했습니다.');
    } finally {
      setLoadingGeneratedHistory(false);
    }
  };

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
              <button onClick={togglePastNumbers} className="past-numbers-button">
                {showPastNumbers ? '지난 당첨번호 숨기기' : '지난 4주간 당첨번호 조회'}
              </button>
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
          <div className="generated-history-container"> {/* 새로운 컨테이너 추가 */}
            <h3 className="history-title">생성된 번호 히스토리</h3>
            {loadingGeneratedHistory ? (
              <p>로딩 중...</p>
            ) : generatedHistory.length === 0 ? (
              <p>저장된 번호가 없습니다.</p>
            ) : (
              <div className="generated-history"> {/* 히스토리 아이템들을 감싸는 컨테이너 */}
                {generatedHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-item-header">
                      <h5>{`회차: ${item.draw_round}`}</h5>
                      <p>{new Date(item.created_at).toLocaleDateString()}</p>
                      {item.win_grade && <span className="win-grade">{item.win_grade}등</span>}
                      <button onClick={() => checkWinningNumbers(item.draw_round)}>당첨 확인</button>
                    </div>
                    <div className="history-item-numbers">
                      {item.numbers && item.numbers.map((number, idx) => (
                        <span key={idx} className="number" style={{ backgroundColor: getBackgroundColor(number) }}>
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      `}</style>
    </div>
  );
}
