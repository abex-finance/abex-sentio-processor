import { SuiContext, SuiObjectContext } from "@sentio/sdk/sui"

export interface IToken {
  name: string
  decimal: number
}

export const parseSuiTypeToToken = async (coinType: string, ctx: SuiContext|SuiObjectContext): Promise<IToken> => {
  const metaInfo = await ctx.client.getCoinMetadata({ coinType })
  const name = metaInfo?.name.startsWith('Wrapped') && metaInfo?.symbol.startsWith('W') && metaInfo?.symbol.length >= 4 ? metaInfo?.symbol.slice(1) : metaInfo?.symbol
  const decimal = metaInfo?.decimals
  return {
    name: name?.toLowerCase() || 'unknown',
    decimal: decimal === undefined ? 9 : decimal
  }
}