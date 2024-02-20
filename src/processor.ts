import { market } from './types/sui/0xe625f9b22467751d9adccdb53f12faa64dbebb5343d2f9f52849b012d55809f5.js'
import { SuiNetwork, SuiObjectProcessor, SuiWrappedObjectProcessor } from '@sentio/sdk/sui'
import { ABExParser } from './market.js';
import { parseVaultInfo } from './vault.js';
import { getPriceByType } from '@sentio/sdk/utils';
import { ABEX_MARKET, ABEX_PACKAGE_ADDRESSES, ABEX_VAULTS_PARENT, ALP_TOKEN_DECIMALS } from './constants.js';


const abexParser = new ABExParser();

for (const address of ABEX_PACKAGE_ADDRESSES) {
  market.bind({
    address,
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
}

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

SuiObjectProcessor.bind({
  objectId: ABEX_MARKET,
  network: SuiNetwork.MAIN_NET,
  startCheckpoint: 9724618n,
}).onTimeInterval(async (self, data, ctx) => {
  // @ts-ignore
  ctx.meter.Gauge('ALP_Amount').record(self.fields.lp_supply.fields.value / (10 ** ALP_TOKEN_DECIMALS));
}, 60, 240, undefined)