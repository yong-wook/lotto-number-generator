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
    const excluded = excludeNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    const included = includeNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    
    let numbers = [...included];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num) && !excluded.includes(num)) {
        numbers.push(num);
      }
    }
    numbers.sort((a, b) => a - b);
    setLottoNumbers(numbers);
    setAnimationKey(prev => prev + 1);
    setLastButtonPressed('generate');
    setShowGenerator(false);
  }, [excludeNumbers, includeNumbers]);

  const saveLottoNumbers = async () => {
    console.log('saveLottoNumbers 함수 호출됨');
    const numbersToSave = lottoNumbers.length > 0 ? lottoNumbers : finalNumbers;
    console.log('저장할 번호:', numbersToSave);
    
    if (savedNumbers.length < 5 && numbersToSave.length > 0) {
      // 현재 회차 정보 가져오기
      let drawRound = currentDrawNo;
      console.log('현재 회차:', drawRound);
      
      if (!drawRound) {
        try {
          const response = await fetch('/api/lotto');
          const data = await response.json();
          drawRound = data.drwNo;
          console.log('API에서 가져온 회차:', drawRound);
        } catch (error) {
          console.error('현재 회차 정보 가져오기 실패:', error);
          return;
        }
      }

      // lotto_numbers 테이블에 저장
      try {
        console.log('API 호출 시도:', {
          numbers: numbersToSave,
          draw_round: drawRound + 1
        });
        
        const response = await fetch('/api/save-lotto-numbers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            numbers: numbersToSave,
            draw_round: drawRound + 1  // 다음 회차로 저장
          }),
        });

        console.log('API 응답:', response.status);

        if (!response.ok) {
          console.error('번호 저장 실패');
          return;
        }

        setSavedNumbers(prev => {
          const newSavedNumbers = [...prev, numbersToSave];
          console.log('새로 저장된 번호:', newSavedNumbers);
          return newSavedNumbers;
        });
      } catch (error) {
        console.error('번호 저장 중 오류:', error);
      }
    } else {
      alert('최대 5개까지 저장할 수 있습니다.');
    }
  };

  // AI 추천 번호 가져오기
  const fetchRecommendedNumbers = async () => {
    setFinalNumbers([]); // 기존 추천 번호 삭제
    setLottoNumbers([]); // 기존 생성된 번호 삭제

    try {
      // 현재 회차 정보 가져오기
      let drawRound = currentDrawNo;
      if (!drawRound) {
        const drawResponse = await fetch('/api/lotto');
        const drawData = await drawResponse.json();
        drawRound = drawData.drwNo;
      }

      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      console.log("추천 번호 데이터:", data);
      setFinalNumbers(data.finalNumbers); // 추천 번호를 배열로 설정
      setRecommendedPair(data.recommendedPair); // 추천수 저장
      setExcludedNumbers(data.excludedNumbers); // 제외수 저장

      // lotto_numbers 테이블에 저장 (다음 회차로 저장)
      const saveResponse = await fetch('/api/save-lotto-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numbers: data.finalNumbers,
          draw_round: drawRound + 1  // 다음 회차로 저장
        }),
      });

      if (!saveResponse.ok) {
        console.error('추천 번호 저장 실패');
      }
    } catch (error) {
      console.error('추천 번호 가져오기 실패:', error);
    }
    setLastButtonPressed('recommend'); // AI 추천 버튼 눌림
    setShowGenerator(false); // 생성기 숨기기
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
        
        {/* 테스트용 기록하기 버튼을 상단으로 이동 */}
        <button 
          onClick={testSaveNumbers}
          style={{
            margin: '20px 0',
            padding: '15px 30px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          🔴 테스트용 기록하기
        </button>

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
            <h3>{currentWeekInfo} 로또 추천 정보</h3>
            <div className="info-container">
              <div className="info-section">
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
              <div className="info-section">
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
          <div className="history-section">
            <h3>추천/제외 번호 적중 히스토리</h3>
            {loadingHistory ? (
              <p className="loading-message">히스토리 로딩 중...</p>
            ) : recommendHistory.length > 0 ? (
              <div className="history-container">
                {recommendHistory.map((history, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <h4>{history.week}회차 ({history.date})</h4>
                      <div className="history-stats">
                        <span className="stat-item success">추천 적중: {history.recommendHits}/2</span>
                        <span className="stat-item failure">제외 실패: {history.excludeFailures}/6</span>
                      </div>
                    </div>

                    <div className="history-numbers-grid">
                      <div className="history-numbers-section">
                        <h5>추천 번호</h5>
                        <div className="history-numbers">
                          {(history.recommendedPair || []).map((number, idx) => (
                            <span
                              key={idx}
                              className={`number ${(history.winningNumbers || []).includes(number) ? 'hit' : ''}`}
                              style={{ backgroundColor: getBackgroundColor(number) }}
                            >
                              {number}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="history-numbers-section">
                        <h5>제외 번호</h5>
                        <div className="history-numbers">
                          {(history.excludedNumbers || []).map((number, idx) => (
                            <span
                              key={idx}
                              className={`number ${(history.winningNumbers || []).includes(number) ? 'missed' : ''}`}
                              style={{ backgroundColor: getBackgroundColor(number) }}
                            >
                              {number}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="history-numbers-section">
                        <h5>당첨 번호</h5>
                        <div className="history-numbers">
                          {(history.winningNumbers || []).map((number, idx) => (
                            <span
                              key={idx}
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
                ))}
              </div>
            ) : (
              <p>히스토리 데이터가 없습니다.</p>
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
        <div className="flex justify-between items-center mt-4 space-x-4">
          <button
            onClick={saveGeneratedNumbers}
            className={`px-4 py-2 rounded-lg ${
              (lottoNumbers.length > 0 || finalNumbers.length > 0)
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={(lottoNumbers.length === 0 && finalNumbers.length === 0)}
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
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            {showGeneratedHistory ? '히스토리 숨기기' : '히스토리 보기'}
          </button>
        </div>
        
        {renderGeneratedHistory()}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
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
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center; /* 중앙 정렬 */
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
          animation: fadeIn 1s infinite; // 애니메이션 가
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
          margin-bottom: 2rem; /* 아래쪽 여백 추가 */
          padding: 1rem;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-buttons {
          display: flex;
          justify-content: center; /* 중앙 정렬 */
          gap: 1rem; /* 버튼 간격 조정 */
          margin-top: 1rem; /* 위쪽 여백 추가 */
        }

        .generate-button {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .generate-button:hover {
          background-color: #45a049;
        }

        .input-field {
          width: 100%; /* 너비를 100%로 설정 */
          padding: 0.5rem; /* 패딩 추가 */
          margin: 0.5rem 0; /* 위쪽 여백 추가 */
          border: 2px solid #4CAF50; /* 테두리 색상 설정 */
          border-radius: 5px; /* 모서리 둥글게 */
          font-size: 1rem; /* 글자 크기 설정 */
          transition: border-color 0.3s; /* 테두리 색상 변화 애니메이션 */
        }

        .input-field:focus {
          border-color: #45a049; /* 포커스 시 테두리 색상 변경 */
          outline: none; /* 기본 아웃라인 제거 */
        }

        .dark-mode .input-field {
          background-color: black; /* 다크 모드에서 배경색을 블랙으로 설정 */
          color: white; /* 글자색을 흰색으로 설정 */
        }

        .dark-mode h3 {
          color: #ffffff; /* 다크 모드에서 제목 색상을 더 밝게 */
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.2); /* 텍스트에 약간의 그림자 추가 */
        }

        .dark-mode .result h3, .dark-mode .saved-numbers h3 {
          color: #6FCF75; /* 다크 모드에서 결과 및 저장된 번호 제목 색상 */
          font-weight: bold;
        }

        .dark-mode .set-title {
          color: #6FCF75; /* 다크 모드에서 세트 제목 색상 */
        }

        .dark-mode .recommendation-info {
          background-color: #000000;
          border: 1px solid #333333;
        }
        
        .dark-mode .recommendation-info h3 {
          color: #6FCF75;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .dark-mode .info-section h4 {
          color: #6FCF75;
          font-weight: bold;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .dark-mode .saved-numbers h3 {
          color: #6FCF75;
          font-weight: bold;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .dark-mode .saved-numbers {
          background-color: #000000;
          border: 1px solid #333333;
          padding: 15px;
          border-radius: 10px;
        }

        .dark-mode .result {
          background-color: #000000;
          border: 1px solid #333333;
          padding: 15px;
          border-radius: 10px;
        }

        .dark-mode .result h3 {
          color: #6FCF75;
          font-weight: bold;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .dark-mode .generator {
          background-color: #000000;
          border: 1px solid #333333;
        }

        .set-title {
          font-size: 0.8rem;
          font-weight: bold;
          margin-bottom: 0.2rem;
        }

        .info-container {
          display: flex;
          flex-direction: row; /* 가로 정렬로 변경 */
          gap: 1.5rem;
          justify-content: center; /* 중앙 정렬 */
        }
        
        .info-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 150px; /* 최소 너비 설정 */
        }
        
        .info-numbers {
          display: flex;
          flex-direction: row; /* 가로 정렬 */
          flex-wrap: wrap; /* 필요시 줄바꿈 */
          gap: 0.5rem; /* 숫자 간격 */
          justify-content: center; /* 중앙 정렬 */
        }
        
        @media (max-width: 480px) {
          .info-container {
            flex-direction: column; /* 모바일에서는 세로 정렬 */
          }
        }

        .title-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
          width: 100%;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 2.5rem;
          text-align: center;
        }

        .dark-mode-button {
          font-size: 1.5rem;
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 히스토리 섹션 스타일 */
        .history-section {
          width: 100%;
          margin: 1rem 0;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .history-button {
          margin-bottom: 1rem;
        }

        .history-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-item {
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.7);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .history-header h4 {
          margin: 0;
          font-size: 1.1rem;
        }

        .history-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-item {
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .success {
          background-color: rgba(76, 175, 80, 0.2);
          color: #2e7d32;
        }

        .failure {
          background-color: rgba(244, 67, 54, 0.2);
          color: #c62828;
        }

        .history-numbers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .history-numbers-section {
          display: flex;
          flex-direction: column;
        }

        .history-numbers-section h5 {
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .history-numbers {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .number.hit {
          border: 3px solid gold;
          box-shadow: 0 0 5px gold;
        }

        .number.missed {
          border: 3px solid #f44336;
          box-shadow: 0 0 5px #f44336;
        }

        /* 다크 모드에서 히스토리 섹션 스타일 */
        .dark-mode .history-section {
          background-color: #000000;
          border: 1px solid #333333;
        }

        .dark-mode .history-section h3 {
          color: #6FCF75;
          font-weight: bold;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .dark-mode .history-item {
          background-color: #1a1a1a;
          border-color: #333333;
        }

        .dark-mode .history-header h4 {
          color: #ffffff;
        }

        .dark-mode .history-numbers-section h5 {
          color: #cccccc;
        }

        .dark-mode .success {
          background-color: rgba(76, 175, 80, 0.1);
          color: #81c784;
        }

        .dark-mode .failure {
          background-color: rgba(244, 67, 54, 0.1);
          color: #e57373;
        }

        /* 암호 입력 관련 스타일 추가 */
        .password-container {
          margin: 1rem 0;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          justify-content: center;
        }

        .password-input {
          padding: 0.5rem;
          border-radius: 4px;
          border: 2px solid #4CAF50;
          font-size: 1rem;
        }

        .dark-mode .password-input {
          background-color: #333;
          color: white;
          border-color: #6FCF75;
        }

        .password-button {
          padding: 0.5rem 1rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .password-button:hover {
          background-color: #45a049;
        }

        /* 은밀한 히스토리 버튼 스타일 */
        .subtle-history-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(76, 175, 80, 0.8);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          z-index: 100;
          opacity: 0.7;
        }

        .subtle-history-button:hover {
          transform: rotate(180deg);
          background-color: rgba(76, 175, 80, 1);
          opacity: 1;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        }
        
        .history-icon {
          font-size: 20px;
          font-weight: bold;
        }
        
        .dark-mode .subtle-history-button {
          background-color: rgba(111, 207, 117, 0.8);
          color: black;
        }

        .dark-mode .subtle-history-button:hover {
          background-color: rgba(111, 207, 117, 1);
        }
      `}</style>
    </div>
  );
}
