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
  const [showSavedNumbers, setShowSavedNumbers] = useState(false);
  const numbersRef = useRef(null);
  
  // 마지막으로 눌린 버튼을 추적하는 상태 추가
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

  // 로또 번호 생성 함수
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
                    // 단일 배열인 경우 (단일 세트)
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
                    style={{backgroundColor: getBackgroundColor(number)}}
                  >
                    {number}
                  </span>
                ))
              ) : (
                finalNumbers.map((number, index) => (
                  <span
                    key={index}
                    className="number"
                    style={{backgroundColor: getBackgroundColor(number)}}
                  >
                    {number}
                  </span>
                ))
              )}
            </div>
            <div className="action-buttons">
              <button onClick={saveLottoNumbers} className="action-button">저장하기</button>
              <button onClick={handleRegenerate} className="action-button">다시 생성하기</button> {/* 생성하기 버튼 추가 */}
            </div>
          </div>
        )}

        {/* 저장된 번호 표시 버튼 추가 */}
        <button onClick={() => setShowSavedNumbers(!showSavedNumbers)} className="action-button">
          {showSavedNumbers ? '저장된 번호 숨기기' : '저장된 번호 보기'}
        </button>

        {/* 저장된 번호 영역 추가 */}
        {showSavedNumbers && savedNumbers.length > 0 && (
          <div className="saved-numbers">
            <h3>저장된 번호</h3>
            {savedNumbers.map((numbers, index) => (
              <div key={index} className="numbers">
                <h4>세트 {index + 1}</h4> {/* 각 세트에 대한 제목 추가 */}
                {numbers.map((number, idx) => (
                  <span
                    key={idx}
                    className="number"
                    style={{backgroundColor: getBackgroundColor(number)}}
                  >
                    {number}
                  </span>
                ))}
                <button onClick={() => deleteSavedNumbers(index)} className="delete-button">X</button> {/* 삭제 버튼 추가 */}
              </div>
            ))}
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
                        style={{backgroundColor: getBackgroundColor(recentWinningNumbers[`drwtNo${num}`])}}
                      >
                        {recentWinningNumbers[`drwtNo${num}`]}
                      </span>
                    ))}
                    <span
                      className="number bonus"
                      style={{backgroundColor: getBackgroundColor(recentWinningNumbers.bnusNo), border: '2px solid #ffcc00', display: 'flex', flexDirection: 'column', alignItems: 'center'}}
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
              {showPastNumbers ? '지 당첨번호 숨기기' : '지 당첨번호 조회'}
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

          <div className="right-column">
            <div className="generator">
              <h3>번호 생성기</h3>
              <div>
                <label htmlFor="excludeNumbers">제외할 번호:</label>
                <input
                  type="text"
                  id="excludeNumbers"
                  value={excludeNumbers}
                  onChange={(e) => setExcludeNumbers(e.target.value)}
                  placeholder="예: 1, 2, 3"
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
                />
              </div>
              <button onClick={generateLottoNumbers} className="generate-button">
                생성하기
              </button>
              <button onClick={fetchRecommendedNumbers} className="generate-button">
                AI추천
              </button>
            </div>
            
            
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
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

        .content {
          display: flex;
          width: 100%;
          gap: 2rem;
        }

        .left-column, .right-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recent-numbers, .past-numbers, .generator, .result {
          background-color: rgba(255, 255, 255, 0.8);
          padding: 1rem;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .numbers {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
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

        .past-numbers-button, .generate-button {
          padding: 0.5rem 1rem;
          font-size: 1rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%; /* 버튼의 가로 크기를 동일하게 설정 */
          margin-bottom: 1rem; /* 버튼 간격을 띄우기 위해 아쪽 여백 추가 */
        }

        .past-numbers-button:hover, .generate-button:hover {
          background-color: #45a049;
        }

        .generator input {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border: 1px solid #ccc;
          border-radius: 3px;
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

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
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

        .saved-numbers {
          margin-top: 2rem;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 1rem;
          border-radius: 5px;
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
      `}</style>
    </div>
  );
}
