import { SuiContext } from "@sentio/sdk/sui";
import { ALP_TOKEN_DECIMALS, AbexEventType, PositionEventType } from "./constants.js";
import { IToken, parseSuiTypeToToken } from "./utils.js";

export class ABExParser {
  private async parseTokenType(coinType: string, ctx: SuiContext): Promise<IToken> {
    return parseSuiTypeToToken(coinType, ctx);
  }

  private parseEventType(typeRaw: string) {
    for (const abexEventType in AbexEventType) {
      if (typeRaw.includes(abexEventType)) {
        return abexEventType;
      }
    }
    return 'Unknown'
  }

  private parsePositionType(typeRaw: string) {
    for (const positionEventType in PositionEventType) {
      if (typeRaw.includes(positionEventType)) {
        return positionEventType;
      }
    }
    return 'Unknown';
  }

  private async parseOrder(typeRaw: string, content: any, abexEventType: AbexEventType, ctx: SuiContext) {
    let result = {
      parsedDetail: {
        collateralToken: '',
        indexToken: '',
        direction: '',
        feeToken: '',
        limitedIndexPrice: 0,
        collateralPriceThreshold: 0,
        orderId: content?.order_name?.fields?.id || '',
        positionId: content?.order_name?.position_id || '',
      },
      volume: 0,
      eventName: '',
      fee: 0,
    };

    let relevantPart = typeRaw.split('<')[2].split('>')[0];
    let components = relevantPart.split(', ');

    // Replacing the usage of consts with async calls to parseSuiTypeToToken
    for (let i = 0; i < components.length; i++) {
      let componentParts = components[i].split('::');
      let value = componentParts[componentParts.length - 1];
      let tokenInfo = await this.parseTokenType(components[i], ctx);

      switch (i) {
        case 0:
          result.parsedDetail.collateralToken = tokenInfo.name;
          break;
        case 1:
          result.parsedDetail.indexToken = tokenInfo.name;
          break;
        case 2:
          result.parsedDetail.direction = value;
          break;
        case 3:
          result.parsedDetail.feeToken = tokenInfo.name;
          break;
      }
    }

    result.eventName = abexEventType;
    if (abexEventType === AbexEventType.OrderCreated) {
      result.parsedDetail.limitedIndexPrice = content.event.limited_index_price.value / 1e18;
      result.parsedDetail.collateralPriceThreshold = content.event.collateral_price_threshold.value / 1e18;
    }

    return result;
  }

  private async parsePool(typeRaw: string, content: any, abexEventType: AbexEventType, ctx: SuiContext) {
    let result = {
      parsedDetail: {
        fromToken: '',
        toToken: '',
      },
      volume: 0,
      eventName: '',
      fee: 0,
    };
  
    let relevantPart = typeRaw.split('<')[1].split('>')[0];
    let components = relevantPart.split(', ');
  
    switch (abexEventType) {
      case AbexEventType.Deposited:
        result.eventName = 'Deposited';
        result.parsedDetail.fromToken = (await this.parseTokenType(components[0], ctx)).name;
        result.volume = content.mint_amount / (10 ** ALP_TOKEN_DECIMALS) * content.price.value / 1e18;
        result.fee = content.fee_value.value / 1e18;
        break;
      case AbexEventType.Withdrawn:
        result.eventName = 'Withdrawn';
        result.parsedDetail.toToken = (await this.parseTokenType(components[0], ctx)).name;
        result.volume = content.burn_amount / (10 ** ALP_TOKEN_DECIMALS) * content.price.value / 1e18;
        result.fee = content.fee_value.value / 1e18;
        break;
      case AbexEventType.Swapped:
        result.eventName = 'Swapped';
        const toToken = await this.parseTokenType(components[1], ctx)
        result.parsedDetail.fromToken = (await this.parseTokenType(components[0], ctx)).name;
        result.parsedDetail.toToken = toToken.name;
        result.volume = content.dest_amount / (10 ** toToken.decimal) * content.dest_price.value / 1e18;
        result.fee = content.fee_value.value / 1e18;
        break;
    }

    return result;
  }

  private async parsePosition(typeRaw: string, content: any, ctx: SuiContext) {
    let result = {
      parsedDetail: {
        collateralToken: '',
        indexToken: '',
        direction: '',
        collateralPrice: 0,
        indexPrice: 0,
        pnl: 0,
        positionId: content?.position_name?.fields?.id || content?.claim?.position_name?.fields?.id || '',
      },
      volume: 0,
      eventName: '',
      fee: 0,
    };
  
    let relevantPart = typeRaw.split('<')[2].split('>')[0];
    let components = relevantPart.split(', ');
    let cdec = 0;
    let idec = 0;
  
    for (let i = 0; i < components.length; i++) {
      let componentParts = components[i].split('::');
      let value = componentParts[componentParts.length - 1];
      let tokenInfo = await this.parseTokenType(components[i], ctx);
  
      switch (i) {
        case 0:
          result.parsedDetail.collateralToken = tokenInfo.name;
          cdec = tokenInfo.decimal;
          break;
        case 1:
          result.parsedDetail.indexToken = tokenInfo.name;
          idec = tokenInfo.decimal;
          break;
        case 2:
          result.parsedDetail.direction = value;
          break;
      }
    }

    result.eventName = this.parsePositionType(typeRaw);
    let event: any;
    switch (result.eventName) {
      case PositionEventType.OpenPositionSuccessEvent:
        if (content.event) {
          event = content.event;
        } else if (content.claim.event) {
          event = content.claim.event;
        } else {
          event = {}
        }
        result.volume = event.open_amount / (10 ** idec) * event.index_price.value / 1e18;
        result.fee = event.open_fee_amount / (10 ** cdec) * event.collateral_price.value / 1e18;
        result.parsedDetail.collateralPrice = event.collateral_price.value / 1e18;
        result.parsedDetail.indexPrice = event.index_price.value / 1e18;
        break;
      case PositionEventType.DecreasePositionSuccessEvent:
        if (content.event) {
          event = content.event;
        } else if (content.claim.event) {
          event = content.claim.event;
        } else {
          event = {}
        }
        result.volume = event.decrease_amount / (10 ** idec) * event.index_price.value / 1e18;
        result.fee = event.decrease_fee_value.value / 1e18 + event.reserving_fee_value.value / 1e18 + (event.funding_fee_value.is_positive ? (event.funding_fee_value.value.value / 1e18) : (-event.funding_fee_value.value.value / 1e18));
        result.parsedDetail.collateralPrice = event.collateral_price.value / 1e18;
        result.parsedDetail.indexPrice = event.index_price.value / 1e18;
        result.parsedDetail.pnl = event.delta_realised_pnl.is_positive ? (event.delta_realised_pnl.value.value / 1e18) : (-event.delta_realised_pnl.value.value / 1e18);
        break;
      case PositionEventType.DecreaseReservedFromPositionEvent:
        result.volume = 0;
        break;
      case PositionEventType.PledgeInPositionEvent:
        result.volume = 0;
        break;
      case PositionEventType.RedeemFromPositionEvent:
        result.volume = 0;
        break;
      case PositionEventType.LiquidatePositionEvent:
        event = content.event
        if (event.position_size) {
          result.volume = event.position_size.value / 1e18 + event.delta_realised_pnl.is_positive ? (event.delta_realised_pnl.value.value / 1e18) : (-event.delta_realised_pnl.value.value / 1e18);
          ctx.meter.Counter('Liquidation_USD').add(event.position_size.value / 1e18, {
            collateral_token: result.parsedDetail.collateralToken,
            index_token: result.parsedDetail.indexToken,
            direction: result.parsedDetail.direction,
          })
        } else {
          // Old version of event, cannot track the volume
          result.volume = 0;
        }
        result.parsedDetail.collateralPrice = event.collateral_price.value / 1e18;
        result.parsedDetail.indexPrice = event.index_price.value / 1e18;
        result.parsedDetail.pnl = event.delta_realised_pnl.is_positive ? (event.delta_realised_pnl.value.value / 1e18) : (-event.delta_realised_pnl.value.value / 1e18);
        result.fee = content.event.reserving_fee_value.value / 1e18 + (content.event.funding_fee_value.is_positive ? (content.event.funding_fee_value.value.value) / 1e18 : (-content.event.funding_fee_value.value.value / 1e18));
        break;
    }
    return result;
  }

  public async parse(event: any, ctx: SuiContext) {
    const abexEventType = this.parseEventType(event.type);
    let result: any = {}
    switch (abexEventType) {
      case AbexEventType.PositionClaimed:
        result = await this.parsePosition(event.type, event.parsedJson, ctx);
        ctx.meter.Gauge('Trading_Volume_USD').record(result.volume, {
          event_name: result.eventName,
          collateral_token: result.parsedDetail.collateralToken,
          index_token: result.parsedDetail.indexToken,
          direction: result.parsedDetail.direction,
          type: 'Position',
        })
        ctx.meter.Counter('Cumulative_Trading_Volume_USD').add(result.volume, {
          event_name: result.eventName,
          collateral_token: result.parsedDetail.collateralToken,
          index_token: result.parsedDetail.indexToken,
          direction: result.parsedDetail.direction,
          type: 'Position',
        })
        ctx.meter.Gauge('Fee').record(result.fee, {
          event_name: result.eventName,
          collateral_token: result.parsedDetail.collateralToken,
          index_token: result.parsedDetail.indexToken,
          direction: result.parsedDetail.direction,
          type: 'Position',
        })
        ctx.meter.Counter('Cumulative_Fee').add(result.fee, {
          event_name: result.eventName,
          collateral_token: result.parsedDetail.collateralToken,
          index_token: result.parsedDetail.indexToken,
          direction: result.parsedDetail.direction,
          type: 'Position',
        })
        break;
      case AbexEventType.OrderCreated:
        result = await this.parseOrder(event.type, event.parsedJson, abexEventType, ctx);
        break;
      case AbexEventType.OrderExecuted:
          result = await this.parseOrder(event.type, event.parsedJson, abexEventType, ctx);
          break;
        case AbexEventType.OrderCleared:
          result = await this.parseOrder(event.type, event.parsedJson, abexEventType, ctx);
          break;
        case AbexEventType.Deposited:
          result = await this.parsePool(event.type, event.parsedJson, abexEventType, ctx);
          ctx.meter.Gauge('Trading_Volume_USD').record(result.volume, {
            event_name: result.eventName,
            from_token: result.parsedDetail.fromToken,
            type: 'Pool',
          })
          ctx.meter.Counter('Cumulative_Trading_Volume_USD').add(result.volume, {
            event_name: result.eventName,
            from_token: result.parsedDetail.fromToken,
            type: 'Pool',
          })
          ctx.meter.Gauge('Fee').record(result.fee, {
            event_name: result.eventName,
            from_token: result.parsedDetail.fromToken,
            type: 'Pool',
          })
        ctx.meter.Counter('Cumulative_Fee').add(result.fee, {
          event_name: result.eventName,
          from_token: result.parsedDetail.fromToken,
          type: 'Pool',
        })
        break;
      case AbexEventType.Withdrawn:
        result = await this.parsePool(event.type, event.parsedJson, abexEventType, ctx);
        ctx.meter.Gauge('Trading_Volume_USD').record(result.volume, {
          event_name: result.eventName,
          to_token: result.parsedDetail.toToken,
          type: 'Pool',
        })
        ctx.meter.Counter('Cumulative_Trading_Volume_USD').add(result.volume, {
          event_name: result.eventName,
          to_token: result.parsedDetail.toToken,
          type: 'Pool',
        })
        ctx.meter.Gauge('Fee').record(result.fee, {
          event_name: result.eventName,
          to_token: result.parsedDetail.toToken,
          type: 'Pool',
        })
        ctx.meter.Counter('Cumulative_Fee').add(result.fee, {
          event_name: result.eventName,
          to_token: result.parsedDetail.toToken,
          type: 'Pool',
        })
        break;
      case AbexEventType.Swapped:
        result = await this.parsePool(event.type, event.parsedJson, abexEventType, ctx);
        ctx.meter.Gauge('Trading_Volume_USD').record(result.volume, {
          event_name: result.eventName,
          from_token: result.parsedDetail.fromToken,
          to_token: result.parsedDetail.toToken,
          type: 'Swap',
        })
        ctx.meter.Counter('Cumulative_Trading_Volume_USD').add(result.volume, {
          event_name: result.eventName,
          from_token: result.parsedDetail.fromToken,
          to_token: result.parsedDetail.toToken,
          type: 'Swap',
        })
        ctx.meter.Gauge('Fee').record(result.fee, {
          event_name: result.eventName,
          from_token: result.parsedDetail.fromToken,
          to_token: result.parsedDetail.toToken,
          type: 'Swap',
        })
        ctx.meter.Counter('Cumulative_Fee').add(result.fee, {
          event_name: result.eventName,
          from_token: result.parsedDetail.fromToken,
          to_token: result.parsedDetail.toToken,
          type: 'Swap',
        })
        break;
    }
    const owner = event?.parsedJson?.position_name?.fields?.owner || event?.parsedJson?.order_name?.owner || event.sender;
    ctx.eventLogger.emit('User_Interaction', {
      distinctId: owner,
      ...result.parsedDetail,
      volume: result.volume,
      fee: result.fee,
      eventName: result.eventName,
    })
  }
}
