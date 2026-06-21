import 'dart:async';
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
 import '../../core/motion/motion.dart';

/// شات الدعم الحي بين الراكب وموظف خدمة العملاء.
class SupportChatScreen extends StatefulWidget {
  const SupportChatScreen({super.key});

  @override
  State<SupportChatScreen> createState() => _SupportChatScreenState();
}

class _SupportChatScreenState extends State<SupportChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  StreamSubscription<QueryResult<Object?>>? _sub;
  int? _conversationId;
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    try {
      final client = await GraphQLClientManager.get();
      final conv = await client.query(QueryOptions(
        document: gql(mySupportConversationQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final c = conv.data?['mySupportConversation'] as Map<String, dynamic>?;
      _conversationId = c?['id'] as int?;
      if (_conversationId == null) {
        if (mounted) setState(() => _loading = false);
        return;
      }
      final res = await client.query(QueryOptions(
        document: gql(supportMessagesQuery),
        variables: {'conversationId': _conversationId},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = (res.data?['supportMessages'] as List<dynamic>?) ?? [];
      if (!mounted) return;
      setState(() {
        _messages
          ..clear()
          ..addAll(list.map((e) => e as Map<String, dynamic>));
        _loading = false;
      });
      _scrollToEnd();
      _subscribe();
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _subscribe() async {
    try {
      final client = await GraphQLClientManager.get();
      _sub = client
          .subscribe(SubscriptionOptions(
            document: gql(supportMessageAddedSubscription),
            variables: {'conversationId': _conversationId},
          ))
          .listen((result) {
        final m = result.data?['supportMessageAdded'] as Map<String, dynamic>?;
        if (m == null || !mounted) return;
        if (_messages.any((x) => x['id'] == m['id'])) return;
        setState(() => _messages.add(m));
        _scrollToEnd();
      });
    } catch (_) {}
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _sending || _conversationId == null) return;
    setState(() => _sending = true);
    _ctrl.clear();
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(sendSupportMessageMutation),
        variables: {'conversationId': _conversationId, 'body': text},
      ));
      final m = res.data?['sendSupportMessage'] as Map<String, dynamic>?;
      if (m != null && mounted && !_messages.any((x) => x['id'] == m['id'])) {
        setState(() => _messages.add(m));
        _scrollToEnd();
      }
    } catch (_) {
      if (mounted) _ctrl.text = text;
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('liveSupport'), style: AuroraText.titleSmall),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? Center(
                    child:
                        AuroraLoader(size: 36))
                : _messages.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(AuroraSpacing.xl),
                          child: Text(tr('supportChatEmpty'),
                              textAlign: TextAlign.center,
                              style: AuroraText.bodySmall.copyWith(
                                  color: AuroraColors.textSecondary)),
                        ),
                      )
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.all(AuroraSpacing.md),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) => _bubble(_messages[i]),
                      ),
          ),
          _inputBar(),
        ],
      ),
    );
  }

  Widget _bubble(Map<String, dynamic> m) {
    final mine = m['senderType'] == 'rider';
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(
            horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: mine ? AuroraColors.ember : AuroraColors.ash,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(AuroraRadius.md),
            topRight: const Radius.circular(AuroraRadius.md),
            bottomLeft: Radius.circular(mine ? AuroraRadius.md : 2),
            bottomRight: Radius.circular(mine ? 2 : AuroraRadius.md),
          ),
        ),
        child: Text(m['body'] as String? ?? '',
            style: AuroraText.bodyMedium.copyWith(
                color: mine ? AuroraColors.obsidian : AuroraColors.pearl)),
      ),
    );
  }

  Widget _inputBar() {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AuroraSpacing.sm),
        color: AuroraColors.coal,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _ctrl,
                style:
                    AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: InputDecoration(
                  hintText: tr('typeMessage'),
                  hintStyle: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.textSecondary),
                  filled: true,
                  fillColor: AuroraColors.ash,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.md, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AuroraRadius.pill),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: AuroraSpacing.sm),
            GestureDetector(
              onTap: _send,
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AuroraColors.ember,
                  shape: BoxShape.circle,
                ),
                child: Icon(_sending ? Icons.hourglass_empty : Icons.send,
                    color: AuroraColors.obsidian, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
