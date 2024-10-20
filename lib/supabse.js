import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 주의: 이 키는 절대 클라이언트 측에 노출되면 안 됩니다!
)

// 나머지 코드는 그대로 유지...

// Supabase에 데이터 추가하는 부분을 다음과 같이 수정
const { error: insertError } = await supabase
  .from('lottoResults')
  .insert({
    drwNo: data.drwNo,
    drwNoDate: data.drwNoDate,
    numbers: `${data.drwtNo1},${data.drwtNo2},${data.drwtNo3},${data.drwtNo4},${data.drwtNo5},${data.drwtNo6}`,
    bonus: data.bnusNo
  });

// 나머지 코드는 그대로 유지...
