import { market } from './types/sui/0xe625f9b22467751d9adccdb53f12faa64dbebb5343d2f9f52849b012d55809f5.js'
import { SuiNetwork, SuiWrappedObjectProcessor } from '@sentio/sdk/sui'
import { getConsts } from './consts/index.js';
import { ABExParser } from './market.js';
import { parseVaultInfo } from './vault.js';
import { getPriceByType } from '@sentio/sdk/utils';

const consts = getConsts('mainnet');

const abexParser = new ABExParser();

market.bind({
  address: consts.abexCore.package,
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
  objectId: consts.abexCore.vaultsParent,
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 9724618n,
}).onTimeInterval(async (dynamicFieldObjects, ctx) => {
  for (const dynamicFieldObject of dynamicFieldObjects) {
    const vaultInfo = parseVaultInfo(dynamicFieldObject, consts);
    const totalAmount = vaultInfo.liquidity + vaultInfo.reservedAmount + vaultInfo.unrealisedReservingFeeAmount;
    const price = await getPriceByType(SuiNetwork.MAIN_NET, vaultInfo.rawTokenType, ctx.timestamp) || 0
    ctx.meter.Gauge('total_amount').record(totalAmount, { name: vaultInfo.vaultToken });
    ctx.meter.Gauge('tvl').record(totalAmount * price, { name: vaultInfo.vaultToken });
  }

}, 60, 240, undefined, {owned: true})