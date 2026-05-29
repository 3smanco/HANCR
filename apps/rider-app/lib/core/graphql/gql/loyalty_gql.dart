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
