import { type SchemaTypeDefinition } from "sanity";
import { productType } from "./product";
import { privilegeType } from "./privilege";
import { RedemptionType } from "./redemption";
import { orderType } from "./order";
import { gameHistoryType } from "./game/gameHistory";
import { nftInGameType } from "./game/nftInGame";
import { redeemHistoryType } from "./jaothuiPoint/redeemHistory";
import { redeemItemType } from "./jaothuiPoint/redeemItem";
import { gameType } from "./game/game";
import { userJaothuiPoint } from "./jaothuiPoint/userJaothuiPoint";

// export const schema = [

// ];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    productType,
    orderType,
    privilegeType,
    RedemptionType,
    gameType,
    gameHistoryType,
    nftInGameType,
    userJaothuiPoint,
    redeemHistoryType,
    redeemItemType,
  ],
};
