import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/ai_gql.dart';
import '../../core/theme/aurora_theme.dart';

class _Msg {
  final String role; // 'user' | 'assistant'
  final String text;
  _Msg(this.role, this.text);
}

/// AiAssistantScreen — مساعد HANCR الذكي (محادثة نصية + صوتية).
class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});
  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<_Msg> _msgs = [];
  bool _busy = false;

  final _stt = SpeechToText();
  bool _sttReady = false;
  bool _listening = false;

  final _tts = FlutterTts();
  bool _speak = true; // قراءة الردود صوتياً

  @override
  void initState() {
    super.initState();
    _initVoice();
    _msgs.add(_Msg(
      'assistant',
      'أهلاً بك في HANCR 👋 أنا مساعدك الذكي. اسألني عن الخدمات، أو دعني أساعدك في حجز رحلة. كيف أخدمك؟',
    ));
  }

  Future<void> _initVoice() async {
    try {
      _sttReady = await _stt.initialize(onStatus: (s) {
        if (s == 'done' || s == 'notListening') {
          if (mounted) setState(() => _listening = false);
        }
      });
    } catch (_) {
      _sttReady = false;
    }
    await _tts.setLanguage('ar-SA');
    await _tts.setSpeechRate(0.5);
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    _stt.stop();
    _tts.stop();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send([String? override]) async {
    final text = (override ?? _ctrl.text).trim();
    if (text.isEmpty || _busy) return;
    _ctrl.clear();
    setState(() {
      _msgs.add(_Msg('user', text));
      _busy = true;
    });
    _scrollToEnd();

    // آخر 12 دوراً قبل الرسالة الجديدة كسياق
    final history = _msgs
        .sublist(0, _msgs.length - 1)
        .map((m) => {'role': m.role, 'content': m.text})
        .toList();

    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(aiAssistantMutation),
        variables: {'message': text, 'history': history},
      ));
      String reply;
      if (res.hasException) {
        reply = res.exception?.graphqlErrors.firstOrNull?.message ??
            'تعذّر الاتصال بالمساعد. حاول مجدداً.';
      } else {
        reply = (res.data?['aiAssistant']?['reply'] as String?) ??
            'عذراً، لم أفهم.';
      }
      if (!mounted) return;
      setState(() {
        _msgs.add(_Msg('assistant', reply));
        _busy = false;
      });
      _scrollToEnd();
      if (_speak) {
        await _tts.stop();
        await _tts.speak(reply);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _msgs.add(_Msg('assistant', 'حدث خطأ. حاول مرة أخرى.'));
        _busy = false;
      });
    }
  }

  Future<void> _toggleMic() async {
    if (!_sttReady) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('الميكروفون غير متاح — تحقّق من الإذن في الإعدادات'),
      ));
      return;
    }
    if (_listening) {
      await _stt.stop();
      setState(() => _listening = false);
      return;
    }
    await _tts.stop();
    setState(() => _listening = true);
    await _stt.listen(
      listenOptions: SpeechListenOptions(localeId: 'ar_SA'),
      onResult: (r) {
        setState(() => _ctrl.text = r.recognizedWords);
        if (r.finalResult && r.recognizedWords.trim().isNotEmpty) {
          _listening = false;
          _send(r.recognizedWords);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AuroraColors.pearl),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: Row(children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                  colors: [AuroraColors.ember, AuroraColors.emberMute]),
              shape: BoxShape.circle,
            ),
            child:
                const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Text('مساعد HANCR',
              style: TextStyle(
                  color: AuroraColors.pearl, fontWeight: FontWeight.w700)),
        ]),
        actions: [
          IconButton(
            tooltip: 'قراءة صوتية',
            icon: Icon(_speak ? Icons.volume_up : Icons.volume_off,
                color:
                    _speak ? AuroraColors.ember : AuroraColors.textSecondary),
            onPressed: () {
              setState(() => _speak = !_speak);
              if (!_speak) _tts.stop();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              itemCount: _msgs.length + (_busy ? 1 : 0),
              itemBuilder: (_, i) {
                if (_busy && i == _msgs.length) {
                  return _bubble(_Msg('assistant', '...'), typing: true);
                }
                return _bubble(_msgs[i]);
              },
            ),
          ),
          _inputBar(),
        ],
      ),
    );
  }

  Widget _bubble(_Msg m, {bool typing = false}) {
    final isUser = m.role == 'user';
    return Align(
      alignment: isUser ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isUser ? AuroraColors.ember : AuroraColors.ash,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AuroraColors.border),
        ),
        child: typing
            ? Text('يكتب…', style: TextStyle(color: AuroraColors.textSecondary))
            : Text(
                m.text,
                textDirection: TextDirection.rtl,
                style: TextStyle(
                    color: isUser ? Colors.white : AuroraColors.pearl,
                    height: 1.4),
              ),
      ),
    );
  }

  Widget _inputBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 8, 12, 8 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: AuroraColors.obsidian,
        border: Border(top: BorderSide(color: AuroraColors.border)),
      ),
      child: Row(children: [
        GestureDetector(
          onTap: _toggleMic,
          child: Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: _listening ? AuroraColors.ember : AuroraColors.ash,
              shape: BoxShape.circle,
              border: Border.all(color: AuroraColors.border),
            ),
            child: Icon(_listening ? Icons.mic : Icons.mic_none,
                color: _listening ? Colors.white : AuroraColors.pearl),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: _ctrl,
            textDirection: TextDirection.rtl,
            minLines: 1,
            maxLines: 4,
            style: TextStyle(color: AuroraColors.pearl),
            onSubmitted: (_) => _send(),
            decoration: InputDecoration(
              hintText: 'اكتب أو تحدّث…',
              hintStyle: TextStyle(color: AuroraColors.textSecondary),
              filled: true,
              fillColor: AuroraColors.ash,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: BorderSide(color: AuroraColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: BorderSide(color: AuroraColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: BorderSide(color: AuroraColors.ember, width: 1.5),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: _busy ? null : () => _send(),
          child: Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: _busy ? AuroraColors.emberMute : AuroraColors.ember,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.send, color: Colors.white, size: 20),
          ),
        ),
      ]),
    );
  }
}
