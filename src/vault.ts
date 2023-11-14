import { SuiContext, SuiObjectContext } from "@sentio/sdk/sui";
import { parseSuiTypeToToken } from "./utils.js";

export interface IVaultInfo {
  vaultToken: string;
  liquidity: number;
  reservedAmount: number;
  unrealisedReservingFeeAmount: number;
  accReservingRate: number;
  enabled: boolean;
  weight: number;
  lastUpdate: number;
  rawTokenType: string;
}

export const decimalToObject = (decimal:  { value: string }) => {
  return Number(BigInt(decimal.value)) / 1e18;
};

export const rateToObject = (rate: { value: string }) => {
  return Number(BigInt(rate.value)) / 1e18;
};

export const srateToObject = (srate: any) => {
  const sign = srate.fields.is_positive ? 1 : -1;
  return Number(BigInt(srate.fields.value.fields.value)) / 1e18 * sign;
}

export const sdecimalToObject = (sdecimal: any) => {
  const sign = sdecimal.fields.is_positive ? 1 : -1;
  return Number(BigInt(sdecimal.fields.value.fields.value)) / 1e18 * sign;
}

export const parseValue = (field: any): number => {
  if (field.type && field.type.endsWith("::decimal::Decimal")) {
    return decimalToObject({ value: field.fields.value });
  } else if (field.type && field.type.endsWith("::rate::Rate")) {
    return rateToObject({ value: field.fields.value });
  } else if (field.type && field.type.endsWith("::srate::SRate")) {
    return srateToObject(field);
  } else if (field.type && field.type.endsWith("::sdecimal::SDecimal")) {
    return sdecimalToObject(field);
  } else {
    return parseInt(field, 10);
  }
};

export async function parseVaultInfo(raw: any, ctx: SuiObjectContext): Promise<IVaultInfo> {
  const vaultName = raw.fields.name.type;
  const rawTokenType = vaultName.split("<")[1].split(">")[0]
  const vaultToken = await parseSuiTypeToToken(rawTokenType, ctx)
  const vaultFields = raw.fields.value.fields;

  return {
    vaultToken: vaultToken.name,
    liquidity: parseValue(vaultFields.liquidity) / (10 ** vaultToken.decimal),
    reservedAmount: parseValue(vaultFields.reserved_amount) / (10 ** vaultToken.decimal),
    unrealisedReservingFeeAmount: parseValue(
      vaultFields.unrealised_reserving_fee_amount
    ) / (10 ** vaultToken.decimal),
    accReservingRate: parseValue(vaultFields.acc_reserving_rate),
    enabled: vaultFields.enabled,
    weight: parseValue(vaultFields.weight),
    lastUpdate: parseValue(vaultFields.last_update),
    rawTokenType,
  };
}