import 'dart:async';
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// شاشة دردشة السائق مع الراكب أثناء الرحلة.
class DriverChatScreen extends StatefulWidget {
  final int orderId;
  final String? riderName;
  const DriverChatScreen({super.key, required this.orderId, this.riderName});

  @override
  State<DriverChatScreen> createState() => _DriverChatScreenState();
}

class _DriverChatScreenState extends State<DriverChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  StreamSubscription<QueryResult<Object?>>? _sub;
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
    _subscribe();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(orderMessagesQuery),
        variables: {'orderId': widget.orderId},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = (res.data?['orderMessages'] as List<dynamic>?) ?? [];
      if (!mounted) return;
      setState(() {
        _messages
          ..clear()
          ..addAll(list.map((e) => e as Map<String, dynamic>));
        _loading = false;
      });
      _scrollToEnd();
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _subscribe() async {
    try {
      final client = await GraphQLClientManager.get();
      final stream = client.subscribe(SubscriptionOptions(
        document: gql(orderMessageAddedSubscription),
        variables: {'orderId': widget.orderId},
      ));
      _sub = stream.listen((result) {
        final m = result.data?['orderMessageAdded'] as Map<String, dynamic>?;
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
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    _ctrl.clear();
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(sendOrderMessageMutation),
        variables: {'orderId': widget.orderId, 'message': text},
      ));
      final m = res.data?['sendOrderMessage'] as Map<String, dynamic>?;
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
        title: Text(widget.riderName ?? tr('chatWithRider'),
            style: AuroraText.titleSmall),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(
                    child:
                        CircularProgressIndicator(color: AuroraColors.ember))
                : _messages.isEmpty
                    ? Center(
                        child: Text(tr('noMessagesYet'),
                            style: AuroraText.bodySmall.copyWith(
                                color: AuroraColors.textSecondary)))
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
    final mine = m['senderType'] == 'driver';
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
        child: Text(
          m['message'] as String? ?? '',
          style: AuroraText.bodyMedium.copyWith(
            color: mine ? AuroraColors.obsidian : AuroraColors.pearl,
          ),
        ),
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
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.pearl),
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
                decoration: const BoxDecoration(
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
