import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Admin() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const clearTestData = async (table) => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/clear-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || '데이터가 성공적으로 삭제되었습니다');
      } else {
        setMessage(`오류: ${data.error || '알 수 없는 오류가 발생했습니다'}`);
      }
    } catch (error) {
      console.error('데이터 삭제 오류:', error);
      setMessage('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">로또 번호 생성기 관리자</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">테스트 데이터 관리</h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => clearTestData('lotto_numbers')}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-200 disabled:opacity-50"
            >
              {isLoading ? '삭제 중...' : '로또 번호 테스트 데이터 삭제'}
            </button>
          </div>
          
          {message && (
            <div className={`p-3 rounded ${message.includes('오류') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {message}
            </div>
          )}
        </div>
        
        <div>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition duration-200"
          >
            메인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
} 