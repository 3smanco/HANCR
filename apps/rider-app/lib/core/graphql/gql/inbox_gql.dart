// ─── Inbox — الإعلانات النشطة + استخدام كود عرض/هدية ───

const String activeAnnouncementsQuery = r'''
  query ActiveAnnouncements {
    activeAnnouncements {
      id
      title
      body
      url
      startsAt
      endsAt
    }
  }
''';

const String claimGiftCodeMutation = r'''
  mutation ClaimGiftCode($code: String!) {
    claimGiftCode(code: $code) {
      success
      amount
      currency
      newBalance
    }
  }
''';
