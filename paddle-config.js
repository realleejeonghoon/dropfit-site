// Dropfit 결제 설정. 이 파일 하나만 고칩니다.
// token은 Paddle 대시보드 Developer tools > Authentication의 client-side token입니다(시험은 test_, 실계정은 live_로 시작).
// client-side token은 공개해도 되는 값입니다. API 키(서버용)는 절대 이 저장소에 넣지 않습니다.
window.DROPFIT_PADDLE = {
  stage: 'open',               // 'pre' = 판매 전(결제 버튼 닫힘), 'open' = 판매 중
  environment: 'production',   // 'sandbox' 또는 'production'
  token: 'live_ff1187f85950dcb6526b98d909d', // 실계정 client-side token 'dropfit.kr'(공개 값)
  priceId: 'pri_01m7meqdc6y15147vppscdsdfg',   // Dropfit Pro 일회성 ₩14,900 (실계정)
  discountId: 'dsc_01m7metejtxcjfte4pvm96h146', // 출시 기념가 9,900원 (실계정)
  discountEnds: '2026-12-31T14:59:00Z',         // 2026-12-31 23:59 KST(정훈 11/18 17:32 연장), Paddle 할인 만료(14:59 UTC)와 같음. 늦으면 만료된 할인을 넘겨 결제창이 실패할 수 있음
  // 팀·기관 가격 ID(실계정). 사이트에는 버튼이 없고, 답장에 붙이는 결제 링크(/?buy=team5|team10|site)로만 엽니다(11/21). 비어 있으면 그 링크는 열리지 않음
  plans: { team5: 'pri_01m7sr2y1fm9vtshqd6xcfzmr3', team10: 'pri_01m7sr3rj5b3t6rcx81319pw7w', site: '' }
};

// 실계정(production) 값. 승인과 정훈 님 확인 뒤 위 값을 이것으로 바꾸고 environment: 'production', token: live_…, stage: 'open'.
//   priceId:    'pri_01m7meqdc6y15147vppscdsdfg'  (Dropfit Pro pro_01m7mekqq3k61p7a4yg188re5t, 일회성 ₩14,900)
//   discountId: 'dsc_01m7metejtxcjfte4pvm96h146'  (출시 기념가 33.56%, 만료 2026-12-31 14:59 UTC)
