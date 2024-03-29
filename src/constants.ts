export enum AbexEventType {
  // Position
  PositionClaimed = 'PositionClaimed',
  // Pool
  Deposited = 'Deposited',
  Withdrawn = 'Withdrawn',
  Swapped = 'Swapped',
  // Order
  OrderCreated = 'OrderCreated',
  OrderExecuted = 'OrderExecuted',
  OrderCleared = 'OrderCleared',
  ReferralAdded = 'ReferralAdded',
}

export enum PositionEventType {
  OpenPositionSuccessEvent = 'OpenPositionSuccessEvent',
  OpenPositionFailedEvent = 'OpenPositionFailedEvent',
  DecreasePositionSuccessEvent = 'DecreasePositionSuccessEvent',
  DecreasePositionFailedEvent = 'DecreasePositionFailedEvent',
  DecreaseReservedFromPositionEvent = 'DecreaseReservedFromPositionEvent',
  PledgeInPositionEvent = 'PledgeInPositionEvent',
  RedeemFromPositionEvent = 'RedeemFromPositionEvent',
  LiquidatePositionEvent = 'LiquidatePositionEvent',
}

export const ALP_TOKEN_DECIMALS = 6;
export const ABEX_PACKAGE_ADDRESS = '0xceab84acf6bf70f503c3b0627acaff6b3f84cee0f2d7ed53d00fa6c2a168d14f'
export const ABEX_PACKAGE_ADDRESSES = [
  '0xceab84acf6bf70f503c3b0627acaff6b3f84cee0f2d7ed53d00fa6c2a168d14f',
  // '0xe625f9b22467751d9adccdb53f12faa64dbebb5343d2f9f52849b012d55809f5',
  // '0xc64701f8adc8852586aef50cc834dfc01740fee871944946c659fb3747f8f5e7',
]
export const ABEX_VAULTS_PARENT = '0x3c6595e543c4766dd63b5b2fa918516bac2920bc1944da068be031dced46a18d'
export const ABEX_REFERRAL_PARENT = '0xbf981cf3f532dc8e4f236554ba4dd6e0e3c4844b5cf877f9012a932c3d0bf639'
export const ABEX_MARKET = '0x7705d4670e7ef4623d6392888f73f6773b5f0218b6cb1486a4be238692a58bca'