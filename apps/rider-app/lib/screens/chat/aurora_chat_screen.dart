import 'dart:async';
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/services/rider_upload_service.dart';
import '../../core/widgets/aurora/aurora.dart';
 import '../../core/motion/motion.dart';

/// شاشة دردشة الراكب مع السائق أثناء الرحلة.
class AuroraChatScreen extends StatefulWidget {
  final int orderId;
  final String? driverName;
  const AuroraChatScreen({super.key, required this.orderId, this.driverName});

  @override
  State<AuroraChatScreen> createState() => _AuroraChatScreenState();
}

class _AuroraChatScreenState extends State<AuroraChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  StreamSubscription<QueryResult<Object?>>? _sub;
  StreamSubscription<QueryResult<Object?>>? _typingSub;
  StreamSubscription<QueryResult<Object?>>? _readSub;
  bool _loading = true;
  bool _sending = false;
  bool _otherTyping = false;
  Timer? _typingClear;
  DateTime _lastTypingSent = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    _load();
    _subscribe();
    _markRead();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _typingSub?.cancel();
    _readSub?.cancel();
    _typingClear?.cancel();
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

  Future<void> _markRead() async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(markOrderMessagesReadMutation),
        variables: {'orderId': widget.orderId},
      ));
    } catch (_) {}
  }

  Future<void> _subscribe() async {
    try {
      final client = await GraphQLClientManager.get();
      _sub = client
          .subscribe(SubscriptionOptions(
            document: gql(orderMessageAddedSubscription),
            variables: {'orderId': widget.orderId},
          ))
          .listen((result) {
        final m = result.data?['orderMessageAdded'] as Map<String, dynamic>?;
        if (m == null || !mounted) return;
        if (_messages.any((x) => x['id'] == m['id'])) return;
        setState(() => _messages.add(m));
        _scrollToEnd();
        if (m['senderType'] != 'rider') _markRead(); // وصلت رسالة → علّمها مقروءة
      });

      // "يكتب الآن"
      _typingSub = client
          .subscribe(SubscriptionOptions(
            document: gql(orderTypingSubscription),
            variables: {'orderId': widget.orderId},
          ))
          .listen((_) {
        if (!mounted) return;
        setState(() => _otherTyping = true);
        _typingClear?.cancel();
        _typingClear = Timer(const Duration(seconds: 3),
            () => mounted ? setState(() => _otherTyping = false) : null);
      });

      // قراءة الطرف الآخر لرسائلي → ✓✓
      _readSub = client
          .subscribe(SubscriptionOptions(
            document: gql(orderMessagesReadSubscription),
            variables: {'orderId': widget.orderId},
          ))
          .listen((_) {
        if (!mounted) return;
        setState(() {
          for (final m in _messages) {
            if (m['senderType'] == 'rider') m['isRead'] = true;
          }
        });
      });
    } catch (_) {}
  }

  void _onChanged(String _) {
    final now = DateTime.now();
    if (now.difference(_lastTypingSent).inMilliseconds < 2000) return;
    _lastTypingSent = now;
    GraphQLClientManager.get().then((client) {
      client.mutate(MutationOptions(
        document: gql(setOrderTypingMutation),
        variables: {'orderId': widget.orderId},
      ));
    });
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send({String? imageUrl}) async {
    final text = _ctrl.text.trim();
    if ((text.isEmpty && imageUrl == null) || _sending) return;
    setState(() => _sending = true);
    if (imageUrl == null) _ctrl.clear();
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(sendOrderMessageMutation),
        variables: {
          'orderId': widget.orderId,
          'message': imageUrl != null ? '' : text,
          if (imageUrl != null) 'imageUrl': imageUrl,
        },
      ));
      final m = res.data?['sendOrderMessage'] as Map<String, dynamic>?;
      if (m != null && mounted && !_messages.any((x) => x['id'] == m['id'])) {
        setState(() => _messages.add(m));
        _scrollToEnd();
      }
    } catch (_) {
      if (mounted && imageUrl == null) _ctrl.text = text;
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _attachImage() async {
    try {
      final file =
          await RiderUploadService.capture(source: ImageSource.gallery);
      if (file == null) return;
      if (mounted) setState(() => _sending = true);
      final url = await RiderUploadService.upload(file);
      await _send(imageUrl: url);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('loadError')),
          backgroundColor: AuroraColors.danger,
        ));
      }
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.driverName ?? tr('chatWithDriver'),
                style: AuroraText.titleSmall),
            if (_otherTyping)
              Text(tr('typingNow'),
                  style: AuroraText.caption.copyWith(color: AuroraColors.ember)),
          ],
        ),
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
    final mine = m['senderType'] == 'rider';
    final imageUrl = m['imageUrl'] as String?;
    final isRead = m['isRead'] == true;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: imageUrl != null
            ? const EdgeInsets.all(4)
            : const EdgeInsets.symmetric(
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (imageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(AuroraRadius.sm),
                child: Image.network(imageUrl,
                    width: 200, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox(
                        width: 200,
                        height: 120,
                        child: Icon(Icons.broken_image, color: Colors.white54))),
              ),
            if ((m['message'] as String? ?? '').isNotEmpty)
              Padding(
                padding: imageUrl != null
                    ? const EdgeInsets.fromLTRB(6, 6, 6, 2)
                    : EdgeInsets.zero,
                child: Text(m['message'] as String,
                    style: AuroraText.bodyMedium.copyWith(
                        color:
                            mine ? AuroraColors.obsidian : AuroraColors.pearl)),
              ),
            if (mine)
              Padding(
                padding: const EdgeInsets.only(top: 2, right: 2),
                child: Icon(isRead ? Icons.done_all : Icons.done,
                    size: 14,
                    color: isRead
                        ? AuroraColors.obsidian
                        : AuroraColors.obsidian.withValues(alpha: 0.5)),
              ),
          ],
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
            IconButton(
              onPressed: _sending ? null : _attachImage,
              icon: Icon(Icons.attach_file, color: AuroraColors.ember),
            ),
            Expanded(
              child: TextField(
                controller: _ctrl,
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.pearl),
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onChanged: _onChanged,
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
