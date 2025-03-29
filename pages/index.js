import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [generatedNumbers, setGeneratedNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGeneratedHistory, setShowGeneratedHistory] = useState(false);
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [loadingGeneratedHistory, setLoadingGeneratedHistory] = useState(false);

  const getBackgroundColor = (number) => {
    if (number <= 10) return '#FFA07A';
    if (number <= 20) return '#98FB98';
    if (number <= 30) return '#87CEEB';
    if (number <= 40) return '#DDA0DD';
    return '#F0E68C';
  };

  const generateNumbers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/recommend-lotto');
      const data = await response.json();
      setGeneratedNumbers(data.numbers);
    } catch (error) {
      console.error('Error generating numbers:', error);
    }
    setIsLoading(false);
  };

  const saveNumbers = async () => {
    if (generatedNumbers.length === 0) return;
    try {
      await fetch('/api/save-lotto-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numbers: generatedNumbers }),
      });
      fetchGeneratedHistory();
    } catch (error) {
      console.error('Error saving numbers:', error);
    }
  };

  const fetchGeneratedHistory = async () => {
    setLoadingGeneratedHistory(true);
    try {
      const response = await fetch('/api/number-history');
      const data = await response.json();
      setGeneratedHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    setLoadingGeneratedHistory(false);
  };

  const renderGeneratedHistory = () => {
    if (!showGeneratedHistory) return null;

    return (
      <div className="generated-history">
        <h3>생성된 번호 히스토리</h3>
        {loadingGeneratedHistory ? (
          <p>로딩 중...</p>
        ) : generatedHistory.length > 0 ? (
          <div className="history-list">
            {generatedHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-header">
                  <span>회차: {item.draw_round}</span>
                  <span>생성일: {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <div className="numbers">
                  {item.numbers.map((number, idx) => (
                    <span
                      key={idx}
                      className="number"
                      style={{ backgroundColor: getBackgroundColor(number) }}
                    >
                      {number}
                    </span>
                  ))}
                </div>
                <div className="winning-info">
                  {item.is_winner !== null ? (
                    <span className={item.is_winner ? "winner" : "non-winner"}>
                      {item.is_winner ? `당첨! (${item.matching_count}개 일치)` : '미당첨'}
                    </span>
                  ) : (
                    <span className="pending">추첨 전</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>저장된 번호가 없습니다.</p>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (showGeneratedHistory) {
      fetchGeneratedHistory();
    }
  }, [showGeneratedHistory]);

  return (
    <div className="container">
      <Head>
        <title>로또 번호 생성기</title>
        <meta name="description" content="AI 기반 로또 번호 생성기" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">로또 번호 생성기</h1>
        
        <div className="number-generator">
          <button onClick={generateNumbers} disabled={isLoading}>
            {isLoading ? '생성 중...' : '번호 생성하기'}
          </button>
          
          {generatedNumbers.length > 0 && (
            <div className="generated-numbers">
              {generatedNumbers.map((number, index) => (
                <span
                  key={index}
                  className="number"
                  style={{ backgroundColor: getBackgroundColor(number) }}
                >
                  {number}
                </span>
              ))}
              <button onClick={saveNumbers} className="save-button">
                저장하기
              </button>
            </div>
          )}
        </div>

        <div className="history-toggle">
          <button onClick={() => setShowGeneratedHistory(!showGeneratedHistory)}>
            {showGeneratedHistory ? '히스토리 숨기기' : '히스토리 보기'}
          </button>
        </div>

        {renderGeneratedHistory()}
      </main>
    </div>
  );
}