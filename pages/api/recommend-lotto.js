export default function handler(req, res) {
  if (req.method === 'GET') {
    const numbers = Array.from({ length: 45 }, (_, i) => i + 1); // 1부터 45까지의 숫자 배열
    const recommendedNumbers = [];

    // 랜덤으로 6개의 숫자 선택
    while (recommendedNumbers.length < 6) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      const number = numbers[randomIndex];
      if (!recommendedNumbers.includes(number)) {
        recommendedNumbers.push(number);
      }
    }

    recommendedNumbers.sort((a, b) => a - b); // 오름차순 정렬
    res.status(200).json({ recommendedNumbers });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
