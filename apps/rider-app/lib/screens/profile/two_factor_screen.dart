import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_event.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// التحقق بخطوتين (TOTP) — تفعيل/تعطيل مرتبط بالخادم.
class TwoFactorScreen extends StatefulWidget {
  final bool enabled;
  const TwoFactorScreen({super.key, required this.enabled});

  @override
  State<TwoFactorScreen> createState() => _TwoFactorScreenState();
}

class _TwoFactorScreenState extends State<TwoFactorScreen> {
  late bool _enabled = widget.enabled;
  bool _busy = false;
  String? _secret;
  final _codeCtl = TextEditingController();
  List<String>? _recoveryCodes;

  @override
  void dispose() {
    _codeCtl.dispose();
    super.dispose();
  }

  void _toast(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? AuroraColors.danger : AuroraColors.success,
    ));
  }

  Future<void> _startSetup() async {
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(startTwoFactorSetupMutation),
      ));
      if (res.hasException) throw res.exception!;
      setState(() =>
          _secret = res.data?['startTwoFactorSetup']?['secret'] as String?);
    } catch (_) {
      _toast(tr('loadError'), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _enable() async {
    if (_codeCtl.text.trim().length < 6) return;
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(enableTwoFactorMutation),
        variables: {'code': _codeCtl.text.trim()},
      ));
      if (res.hasException) throw res.exception!;
      final codes = (res.data?['enableTwoFactor']?['recoveryCodes'] as List?)
          ?.cast<String>();
      setState(() {
        _enabled = true;
        _secret = null;
        _recoveryCodes = codes;
        _codeCtl.clear();
      });
      context.read<RiderBloc>().add(const RiderLoadRequested());
      _toast(tr('twoFaEnabled'));
    } catch (_) {
      _toast(tr('invalidCode'), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _disable() async {
    if (_codeCtl.text.trim().length < 6) return;
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(disableTwoFactorMutation),
        variables: {'code': _codeCtl.text.trim()},
      ));
      if (res.hasException) throw res.exception!;
      setState(() {
        _enabled = false;
        _codeCtl.clear();
      });
      context.read<RiderBloc>().add(const RiderLoadRequested());
      _toast(tr('twoFaDisabled'));
    } catch (_) {
      _toast(tr('invalidCode'), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('twoFactor'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              Row(
                children: [
                  Icon(_enabled ? Icons.verified_user : Icons.shield_outlined,
                      color: _enabled
                          ? AuroraColors.success
                          : AuroraColors.ember,
                      size: 28),
                  const SizedBox(width: AuroraSpacing.md),
                  Expanded(
                    child: Text(
                        _enabled ? tr('twoFaOn') : tr('twoFaOff'),
                        style: AuroraText.titleSmall),
                  ),
                ],
              ),
              const SizedBox(height: AuroraSpacing.md),
              Text(tr('twoFactorInfo'),
                  style: AuroraText.bodySmall.copyWith(height: 1.5)),
              const SizedBox(height: AuroraSpacing.lg),
              if (_recoveryCodes != null)
                _recoveryView()
              else if (_enabled)
                _disableView()
              else
                _enableView(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _enableView() {
    if (_secret == null) {
      return AuroraButton.primary(
        label: tr('enableTwoFa'),
        icon: Icons.lock_outline,
        onPressed: _busy ? null : _startSetup,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tr('twoFaSecretLabel'), style: AuroraText.caption),
        const SizedBox(height: 4),
        _copyBox(_secret!),
        const SizedBox(height: AuroraSpacing.lg),
        Text(tr('enterAuthCode'), style: AuroraText.bodySmall),
        const SizedBox(height: AuroraSpacing.sm),
        _codeField(),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.primary(
          label: tr('confirm'),
          onPressed: _busy ? null : _enable,
        ),
      ],
    );
  }

  Widget _disableView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tr('enterAuthCode'), style: AuroraText.bodySmall),
        const SizedBox(height: AuroraSpacing.sm),
        _codeField(),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.secondary(
          label: tr('disableTwoFa'),
          icon: Icons.lock_open_outlined,
          onPressed: _busy ? null : _disable,
        ),
      ],
    );
  }

  Widget _recoveryView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tr('recoveryCodesTitle'), style: AuroraText.titleSmall),
        const SizedBox(height: 4),
        Text(tr('recoveryCodesNote'),
            style: AuroraText.bodySmall.copyWith(height: 1.5)),
        const SizedBox(height: AuroraSpacing.md),
        _copyBox(_recoveryCodes!.join('\n')),
        const SizedBox(height: AuroraSpacing.lg),
        AuroraButton.primary(
          label: tr('done'),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ],
    );
  }

  Widget _codeField() {
    return TextField(
      controller: _codeCtl,
      keyboardType: TextInputType.number,
      maxLength: 6,
      style: AuroraText.titleMedium.copyWith(
          color: AuroraColors.pearl, letterSpacing: 6),
      decoration: const InputDecoration(counterText: '', hintText: '000000'),
    );
  }

  Widget _copyBox(String text) {
    return GestureDetector(
      onTap: () {
        Clipboard.setData(ClipboardData(text: text));
        _toast(tr('copied'));
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AuroraSpacing.md),
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(color: AuroraColors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(text,
                  style: AuroraText.bodyMedium.copyWith(
                      color: AuroraColors.pearl, fontFamily: 'monospace')),
            ),
            Icon(Icons.copy, color: AuroraColors.ember, size: 18),
          ],
        ),
      ),
    );
  }
}
