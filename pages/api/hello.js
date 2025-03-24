// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { cursor } = req.body;
      
      // 데이터베이스 커서 업데이트
      await prisma.cursor.update({
        where: {
          id: 1  // 또는 업데이트하려는 커서의 ID
        },
        data: {
          currentPosition: cursor
        }
      });

      res.status(200).json({ message: '커서가 성공적으로 업데이트되었습니다.' });
    } catch (error) {
      res.status(500).json({ error: '커서 업데이트 중 오류가 발생했습니다.' });
    }
  } else {
    res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }
}
