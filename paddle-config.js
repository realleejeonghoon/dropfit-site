// Dropfit 결제 설정. 이 파일 하나만 고칩니다.
// token은 Paddle 대시보드 Developer tools > Authentication의 client-side token입니다(시험은 test_, 실계정은 live_로 시작).
// client-side token은 공개해도 되는 값입니다. API 키(서버용)는 절대 이 저장소에 넣지 않습니다.
window.DROPFIT_PADDLE = {
  stage: 'pre',                // 'pre' = 판매 전(결제 버튼 닫힘), 'open' = 판매 중
  environment: 'sandbox',      // 'sandbox' 또는 'production'
  token: '',                   // 정훈 님이 직접 붙여 넣음
  priceId: 'pri_01m77yz1522ayh3ajarm9jnvz3',   // Dropfit Pro 일회성 ₩14,900 (시험 계정)
  discountId: 'dsc_01m7hx8hh6x8eychsv6hzz54t3', // 출시 기념가 9,900원 (시험 계정)
  discountEnds: '2026-11-30T14:59:59Z'          // 2026-11-30 23:59:59 KST, Paddle 할인 만료와 같음
};

// 실계정(production) 값. 승인과 정훈 님 확인 뒤 위 값을 이것으로 바꾸고 environment: 'production', token: live_…, stage: 'open'.
//   priceId:    'pri_01m7meqdc6y15147vppscdsdfg'  (Dropfit Pro pro_01m7mekqq3k61p7a4yg188re5t, 일회성 ₩14,900)
//   discountId: 'dsc_01m7metejtxcjfte4pvm96h146'  (출시 기념가 33.56%, 만료 2026-11-30 14:59 UTC)
