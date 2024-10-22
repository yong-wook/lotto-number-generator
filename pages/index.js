import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [recentWinningNumbers, setRecentWinningNumbers] = useState(null);
  const [currentDrawNo, setCurrentDrawNo] = useState(1141);
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
  const [showGenerator, setShowGenerator] = useState(true); // 생성기 영역 상태 추가
  const numbersRef = useRef(null);
  
  // 마지막으로 눌린 버튼을 추��하는 상태 추가
  const [lastButtonPressed, setLastButtonPressed] = useState(null);

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
  }, [showPastNumbers]);

  useEffect(() => {
    fetchCurrentLottoNumber();
  }, [fetchCurrentLottoNumber]);

  // 로또 번호 생성 ���수
  const generateLottoNumbers = useCallback(() => {
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
    setLastButtonPressed('generate'); // 생성하기 버튼 눌림
    setShowGenerator(false); // 생성기 숨기기
  }, [excludeNumbers, includeNumbers]);

  // AI 추천 번호 가져오기
  const fetchRecommendedNumbers = async () => {
    setFinalNumbers([]); // 기존 추천 번호 삭제
    setLottoNumbers([]); // 기존 생성된 번호 삭제

    try {
      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      console.log("추천 번호 데이터:", data);
      setFinalNumbers(data.finalNumbers); // 추천 번호를 배열로 설정
    } catch (error) {
      console.error('추천 번호 가져오기 실패:', error);
    }
    setLastButtonPressed('recommend'); // AI 추천 버튼 눌림
    setShowGenerator(false); // 생성기 숨기기
  };

  const saveLottoNumbers = () => {
    const numbersToSave = lottoNumbers.length > 0 ? lottoNumbers : finalNumbers;
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

  return (
    <div className="container">
      <Head>
        <title>로또 번호 생성기</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Use Wook`s 로또</h1>
        
        {/* 번호 생성기 숨기기 버튼 추가 */}
        <button onClick={() => setShowGenerator(!showGenerator)} className="action-button">
          {showGenerator ? '번호 생성기 숨기기' : '번호 생성기 보기'}
        </button>

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
              <button onClick={generateLottoNumbers} className="generate-button">
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
                    <button onClick={() => deleteSavedNumbers(index)} className="delete-button">X</button>
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
            
            <button onClick={togglePastNumbers} className="past-numbers-button">
              {showPastNumbers ? '지난 당첨번호 숨기기' : '지난 당첨번호 조회'}
            </button>
            
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
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          background-color: #f9f9f9; /* 배경색 추가 */
        }

        main {
          padding: 1rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          max-width: 1200px;
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
          margin-top: 0.5rem; /* 위쪽 여백 추가 */
          border: 2px solid #4CAF50; /* 테���리 색상 설정 */
          border-radius: 5px; /* 모서리 둥글게 */
          font-size: 1rem; /* 글자 크기 설정 */
          transition: border-color 0.3s; /* 테두리 색상 변화 애니메이션 */
        }

        .input-field:focus {
          border-color: #45a049; /* 포커스 시 테두리 색상 변경 */
          outline: none; /* 기본 아웃라인 제거 */
        }

        .set-container {
          margin-bottom: 0.5rem; /* 세트 간의 간격 */
        }

        .set-title {
          font-size: 0.8rem; /* 폰트 크기 조정 */
          font-weight: bold; /* 볼드 처리 */
          margin-bottom: 0.2rem; /* 제목과 번호 간의 간격 */
        }

        .number-row {
          display: flex; /* Flexbox 사용 */
          align-items: center; /* 수직 정렬 */
        }

        .number-container {
          display: flex; /* Flexbox 사용 */
          gap: 0.5rem; /* 번호 간격 조정 */
          margin-right: 0.5rem; /* 삭제 버튼과의 간격 */
        }

        .delete-button {
          background-color: red; /* 삭제 버튼 색상 */
          color: white; /* 삭제 버튼 글자 색상 */
          border: none; /* 테두리 제거 */
          border-radius: 5px; /* 모서리 둥글게 */
          cursor: pointer; /* 커서 포인터로 변경 */
          padding: 0.2rem 0.5rem; /* 패딩 추가 */
        }
      `}</style>
    </div>
  );
}
