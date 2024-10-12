import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

export default function Home() {
  const [recentWinningNumbers, setRecentWinningNumbers] = useState(null);
  const [currentDrawNo, setCurrentDrawNo] = useState(null);
  const [pastWinningNumbers, setPastWinningNumbers] = useState([]); // 초기 상태를 빈 배열로 설정
  const [showPastNumbers, setShowPastNumbers] = useState(false);
  const [excludeNumbers, setExcludeNumbers] = useState('');
  const [includeNumbers, setIncludeNumbers] = useState('');
  const [lottoNumbers, setLottoNumbers] = useState([]);
  const [recommendedNumbers, setRecommendedNumbers] = useState([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  const fetchCurrentLottoNumber = useCallback(async () => {
    setLoading(true); // 데이터 가져오기 시작 시 로딩 상태 설정
    try {
      const response = await fetch('/api/lotto');
      const data = await response.json();
      setRecentWinningNumbers(data);
      setCurrentDrawNo(data.drwNo);
    } catch (error) {
      console.error('현재 로또 번호 가져오기 실패:', error);
    } finally {
      setLoading(false); // 데이터 가져오기 완료 후 로딩 상태 해제
    }
  }, []);

  const fetchPastWinningNumbersFromAPI = useCallback(async () => {
    if (!currentDrawNo) {
      console.error('현재 회차 번호가 설정되지 않았습니다.');
      return; // 현재 회차 번호가 없으면 함수 종료
    }

    try {
      const response = await fetch(`/api/past-lotto?currentDrawNo=${currentDrawNo}`); // 현재 회차 번호를 쿼리로 전달
      const data = await response.json();
      console.log("가져온 데이터:", data); // 데이터 확인
      setPastWinningNumbers(data);
      setShowPastNumbers(true);
    } catch (error) {
      console.error('과거 당첨 번호 가져오기 실패:', error);
    }
  }, [currentDrawNo]); // currentDrawNo를 의존성 배열에 추가

  const togglePastNumbers = useCallback(() => {
    if (!showPastNumbers && pastWinningNumbers.length === 0) {
      fetchPastWinningNumbersFromAPI(); // API 호출
    } else {
      setShowPastNumbers(!showPastNumbers);
    }
  }, [showPastNumbers, pastWinningNumbers, fetchPastWinningNumbersFromAPI]);

  useEffect(() => {
    fetchCurrentLottoNumber();
  }, [fetchCurrentLottoNumber]);

  const generateLottoNumbers = useCallback(() => {
    // 기존 번호 초기화
    setLottoNumbers([]); // 기존 생성된 번호 삭제
    setRecommendedNumbers([]); // 추천 번호도 초기화

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
    // 기존 추천 번호 초기화
    setRecommendedNumbers([]); // 기존 추천 번호 삭제
    setLottoNumbers([]); // 기존 생성된 번호 삭제

    try {
      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      setRecommendedNumbers(data.recommendedNumbers); // 추천 번호를 배열로 설정
    } catch (error) {
      console.error('추천 번호 가져오기 실패:', error);
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

  return (
    <div className="container">
      <Head>
        <title>로또 번호 생성기</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">로또 번호 생성기</h1>
        
        <div className="content">
          <div className="left-column">
            <div className="recent-numbers">
              <h3>최근 당첨번호 (제 {recentWinningNumbers?.drwNo || ''}회)</h3>
              <p>{recentWinningNumbers?.drwNoDate || ''}</p>
              {loading ? ( // 로딩 상태에 따라 표시
                <p>로딩 중...</p>
              ) : recentWinningNumbers ? (
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
              ) : (
                <p>당첨 번호를 가져오는 데 실패했습니다.</p> // 데이터가 없을 때 메시지
              )}
            </div>
            
            <button onClick={togglePastNumbers} className="past-numbers-button">
              {showPastNumbers ? '지난 당첨번호 숨기기' : '지난 4주간 당첨번호 조회'}
            </button>
            
            {showPastNumbers && (
              <div className="past-numbers">
                <h3>지난 4주간 당첨번호</h3>
                {pastWinningNumbers.map((draw) => (
                  <div key={draw.drwNo} className="past-draw">
                    <p>제 {draw.drwNo}회 ({draw.drwNoDate})</p>
                    <div className="numbers">
                      {[
                        draw.drwtNo1, 
                        draw.drwtNo2, 
                        draw.drwtNo3, 
                        draw.drwtNo4, 
                        draw.drwtNo5, 
                        draw.drwtNo6
                      ].map((number, index) => (
                        <span
                          key={index}
                          className="number"
                          style={{ backgroundColor: getBackgroundColor(number) }}
                        >
                          {number}
                        </span>
                      ))}
                      <span
                        className="number bonus"
                        style={{ backgroundColor: getBackgroundColor(draw.bnusNo), border: '2px solid #ffcc00', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: '0.6rem', color: 'black' }}>bonus</span>
                        {draw.bnusNo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="numbers">
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
              </div>
            )}

            {recommendedNumbers.length > 0 && (
              <div className="result animated" key={animationKey}>
                <h3>추천 번호</h3>
                <div className="numbers">
                  {recommendedNumbers.map((number, index) => (
                    <span
                      key={index}
                      className="number"
                      style={{backgroundColor: getBackgroundColor(number)}}
                    >
                      {number}
                    </span>
                  ))}
                </div>
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
      `}</style>
    </div>
  );
}