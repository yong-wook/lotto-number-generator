import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [recentWinningNumbers, setRecentWinningNumbers] = useState(null);
  const [currentDrawNo, setCurrentDrawNo] = useState(1141);
  const [pastWinningNumbers, setPastWinningNumbers] = useState([]); // 과거 당첨번호 상태
  const [showPastNumbers, setShowPastNumbers] = useState(false); // 과거 당첨번호 표시 여부
  const [excludeNumbers, setExcludeNumbers] = useState('');
  const [includeNumbers, setIncludeNumbers] = useState('');
  const [lottoNumbers, setLottoNumbers] = useState([]);
  const [finalNumbers, setFinalNumbers] = useState([]); // 변수명 변경
  const [animationKey, setAnimationKey] = useState(0);
  const [loadingRecent, setLoadingRecent] = useState(false); // 최근 당첨번호 로딩 상태
  const [loadingPast, setLoadingPast] = useState(false); // 과거 당첨번호 로딩 상태

  // 복사 성공 메시지를 위한 새로운 상태
  const [copySuccess, setCopySuccess] = useState('');
  
  // 번호를 표시하는 div에 대한 참조 생성
  const numbersRef = useRef(null);

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
      // 사용자에게 오류 메시지 표시
      setRecentWinningNumbers(null);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const fetchPastWinningNumbers = async () => {
    setLoadingPast(true); // 로딩 시작
    try {
      const response = await fetch(`/api/past-lotto?currentDrawNo=${currentDrawNo}`); // 동적 회차번호 사용
      const data = await response.json(); // JSON으로 변환
      setPastWinningNumbers(data); // 과거 당첨번호 업데이트
    } catch (error) {
      console.error("Error fetching past winning numbers:", error);
    } finally {
      setLoadingPast(false); // 로딩 상태 해제
    }
  };

  const togglePastNumbers = useCallback(() => {
    if (!showPastNumbers) {
      fetchPastWinningNumbers(); // API 호출
    }
    setShowPastNumbers(!showPastNumbers); // 상태 토글
  }, [showPastNumbers]);

  useEffect(() => {
    fetchCurrentLottoNumber();
  }, [fetchCurrentLottoNumber]);

  const generateLottoNumbers = useCallback(() => {
    // 기존 번호 초기화
    setLottoNumbers([]); // 기존 생성된 번호 삭제
    setFinalNumbers([]); // 추천 번호도 초기화

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
    setLottoNumbers(numbers); // 새로운 번호 설정
    setAnimationKey(prev => prev + 1); // 애니메이션 키 증가
  }, [excludeNumbers, includeNumbers]);

  const fetchRecommendedNumbers = async () => {
    setFinalNumbers([]); // 기존 추천 번호 삭제
    setLottoNumbers([]); // 기존 생성된 번호 삭제

    try {
      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      console.log("추천 번호 데이터:", data); // 데이터 확인
      setFinalNumbers(data.finalNumbers); // 추천 번호를 배열로 설정
    } catch (error) {
      console.error('추천 번호 가져오기 패:', error);
    }
  };

  useEffect(() => {
    if (lottoNumbers.length > 0) {
      setAnimationKey(prev => prev + 1); // 애니메이션 키 증가
    }
  }, [lottoNumbers]);

  const getBackgroundColor = (number) => {
    const num = parseInt(number);
    if (num >= 1 && num <= 10) return '#fbc400';
    if (num >= 11 && num <= 20) return '#69c8f2';
    if (num >= 21 && num <= 30) return '#ff7272';
    if (num >= 31 && num <= 40) return '#aaa';
    if (num >= 41 && num <= 45) return '#b0d840';
    return '#ffffff';
  };

  // 복사 함수 추가
  const copyToClipboard = (numbers) => {
    const textToCopy = numbers.join(', ');
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
    if (typeof window !== 'undefined' && window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
      }
      
      if (window.Kakao.Link) {
        window.Kakao.Link.sendDefault({
          objectType: 'text',
          text: `로또 번호: ${numbers.join(', ')}`,
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

  return (
    <div className="container">
      <Head>
        <title>로또 번호 생성기</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Use Wook`s 로또</h1>
        
        <div className="content">
          <div className="left-column">
            <div className="recent-numbers">
              {loadingRecent ? ( // 최근 당첨번호 로딩 상태에 따라 표시
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
                <p>당첨 번호를 가져오는 데 실패했습니다.</p> // 데이터가 없을 때 메시지
              )}
            </div>
            
            <button onClick={togglePastNumbers} className="past-numbers-button">
              {showPastNumbers ? '지난 당첨번호 숨기기' : '지난 당첨번호 조회'}
            </button>
            
            {loadingPast ? ( // 과거 당첨번호 로딩 상태에 따라 표시
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
              pastWinningNumbers.length === 0 ? null : ( // 데이터가 없을 때 아무것도 표시하지 않음
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
            
            {lottoNumbers.length > 0 && (
              <div className="result animated" key={animationKey}>
                <h3>생성된 번호</h3>
                <div className="numbers" ref={numbersRef}>
                  {lottoNumbers.map((number, index) => (
                    <span
                      key={index}
                      className="number"
                      style={{backgroundColor: getBackgroundColor(number)}}
                    >
                      {number}
                    </span>
                  ))}
                </div>
                <div className="action-buttons">
                  <button onClick={() => copyToClipboard(lottoNumbers)} className="action-button">
                    복사하기
                  </button>
                  <button onClick={() => shareToKakao(lottoNumbers)} className="kakao-share-button">
                    <img src="/kakao-talk-icon.svg" alt="카카오톡 공유" className="kakao-icon" />
                  </button>
                </div>
                {copySuccess && <p className="copy-message">{copySuccess}</p>}
              </div>
            )}

            {finalNumbers && finalNumbers.length > 0 && (
              <div className="result animated" key={animationKey}>
                <h3>추천 번호</h3>
                <div className="numbers">
                  {finalNumbers.map((number, index) => (
                    <span
                      key={index}
                      className="number"
                      style={{backgroundColor: getBackgroundColor(number)}}
                    >
                      {number}
                    </span>
                  ))}
                </div>
                <div className="action-buttons">
                  <button onClick={() => copyToClipboard(finalNumbers)} className="action-button">
                    복사하기
                  </button>
                  <button onClick={() => shareToKakao(finalNumbers)} className="kakao-share-button">
                    <img src="/kakao-talk-icon.svg" alt="카카오톡 공유" className="kakao-icon" />
                  </button>
                </div>
                {copySuccess && <p className="copy-message">{copySuccess}</p>}
              </div>
            )}
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
          margin-bottom: 1rem; /* 버튼 간격을 띄우기 위해 아래쪽 여백 추가 */
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
          animation: fadeIn 1s infinite; // 애니메이션 추가
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
      `}</style>
    </div>
  );
}
