// ... existing code ...
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
// ... existing code ...