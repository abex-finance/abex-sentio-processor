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
export const ABEX_VAULTS_PARENT = '0x3c6595e543c4766dd63b5b2fa918516bac2920bc1944da068be031dced46a18d'