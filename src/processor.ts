import { market } from './types/sui/0xe625f9b22467751d9adccdb53f12faa64dbebb5343d2f9f52849b012d55809f5.js'
import { SuiNetwork, SuiWrappedObjectProcessor } from '@sentio/sdk/sui'
import { ABExParser } from './market.js';
import { parseVaultInfo } from './vault.js';
import { getPriceByType } from '@sentio/sdk/utils';
import { ABEX_PACKAGE_ADDRESS, ABEX_VAULTS_PARENT } from './constants.js';


const abexParser = new ABExParser();

market.bind({
  address: ABEX_PACKAGE_ADDRESS,
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 9724618n,
})
  .onEventPositionClaimed(abexParser.parse.bind(abexParser))
  .onEventOrderCreated(abexParser.parse.bind(abexParser))
  .onEventOrderExecuted(abexParser.parse.bind(abexParser))
  .onEventOrderCleared(abexParser.parse.bind(abexParser))
  .onEventDeposited(abexParser.parse.bind(abexParser))
  .onEventWithdrawn(abexParser.parse.bind(abexParser))
  .onEventSwapped(abexParser.parse.bind(abexParser))

SuiWrappedObjectProcessor.bind({
  objectId: ABEX_VAULTS_PARENT,
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 9724618n,
}).onTimeInterval(async (dynamicFieldObjects, ctx) => {
  for (const dynamicFieldObject of dynamicFieldObjects) {
    const vaultInfo = await parseVaultInfo(dynamicFieldObject, ctx);
    const totalAmount = vaultInfo.liquidity + vaultInfo.reservedAmount + vaultInfo.unrealisedReservingFeeAmount;
    const price = await getPriceByType(SuiNetwork.MAIN_NET, vaultInfo.rawTokenType, ctx.timestamp) || 0
    ctx.meter.Gauge('TVL_by_Token').record(totalAmount, { name: vaultInfo.vaultToken });
    ctx.meter.Gauge('TVL_by_Token_USD').record(totalAmount * price, { name: vaultInfo.vaultToken });
  }

}, 60, 240, undefined, {owned: true})