import axios from 'axios';

export default async function handler(req, res) {
  const { currentDrawNo } = req.query;

  if (!currentDrawNo) {
    return res.status(400).json({ error: '현재 회차 번호가 제공되지 않았습니다.' });
  }

  try {
    const pastDraws = await Promise.all(
      [1, 2, 3, 4].map(async (weeksBefore) => {
        const drawNo = currentDrawNo - weeksBefore;
        const response = await axios.get(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`);
        
        if (response.data.returnValue === 'success') {
          return response.data;
        } else {
          console.warn(`회차 ${drawNo}의 데이터를 가져오지 못했습니다.`);
          return null;
        }
      })
    );

    const validDraws = pastDraws.filter(draw => draw !== null);

    res.status(200).json(validDraws);
  } catch (error) {
    console.error('과거 로또 번호 가져오기 실패:', error);
    res.status(500).json({ error: '과거 로또 번호를 가져오는 데 실패했습니다.' });
  }
}
