import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

export default function Home() {
  const [recentWinningNumbers, setRecentWinningNumbers] = useState(null);
  const [currentDrawNo, setCurrentDrawNo] = useState(null);
  const [pastWinningNumbers, setPastWinningNumbers] = useState([]);
  const [showPastNumbers, setShowPastNumbers] = useState(false);
  const [excludeNumbers, setExcludeNumbers] = useState('');
  const [includeNumbers, setIncludeNumbers] = useState('');
  const [lottoNumbers, setLottoNumbers] = useState([]);
  const [animationKey, setAnimationKey] = useState(0);

  const fetchCurrentLottoNumber = useCallback(async () => {
    try {
      const response = await fetch('/api/lotto');
      const data = await response.json();
      setRecentWinningNumbers(data);
      setCurrentDrawNo(data.drwNo);
    } catch (error) {
      console.error('현재 로또 번호 가져오기 실패:', error);
    }
  }, []);

  const fetchPastWinningNumbersFromAPI = useCallback(async () => {
    try {
      const response = await fetch('/api/past-lotto'); // past-lotto.js API 경로
      const data = await response.json();
      setPastWinningNumbers(data);
      setShowPastNumbers(true);
    } catch (error) {
      console.error('과거 당첨 번호 가져오기 실패:', error);
    }
  }, []);

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
    setAnimationKey(prev => prev + 1); // 애니메이션 키 증가
  }, [excludeNumbers, includeNumbers]);

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
              {recentWinningNumbers && (
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
                    {/* 추가: 당첨 번호 표시 */}
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
                번호 생성하기
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