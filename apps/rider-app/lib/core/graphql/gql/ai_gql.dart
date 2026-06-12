// مساعد HANCR الذكي — mutation المحادثة (يطابق rider-api).

const String aiAssistantMutation = r'''
  mutation AiAssistant($message: String!, $history: [AiMessageInput!]) {
    aiAssistant(message: $message, history: $history) {
      reply
    }
  }
''';
