const String myLoyaltyQuery = r'''
  query MyLoyalty {
    myLoyalty {
      id
      tier
      totalMiles
      availableMiles
      lifetimeMiles
      freeUpgradesRemaining
      hasFreeCancellation
      surgeImmunityUntil
      updatedAt
    }
  }
''';

const String redeemRewardMutation = r'''
  mutation RedeemReward($miles: Int!) {
    redeemReward(miles: $miles) {
      success
      redeemedMiles
      creditedAmount
      currency
      remainingMiles
    }
  }
''';
