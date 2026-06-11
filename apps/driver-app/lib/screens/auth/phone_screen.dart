import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/i18n/app_localization.dart';

class _Country {
  final String flag;
  final String dialCode;
  final String name;
  const _Country(this.flag, this.dialCode, this.name);
}

const _countries = [
  _Country('🇸🇦', '+966', 'Saudi Arabia'),
  _Country('🇦🇪', '+971', 'UAE'),
  _Country('🇰🇼', '+965', 'Kuwait'),
  _Country('🇧🇭', '+973', 'Bahrain'),
  _Country('🇶🇦', '+974', 'Qatar'),
  _Country('🇴🇲', '+968', 'Oman'),
  _Country('🇯🇴', '+962', 'Jordan'),
  _Country('🇪🇬', '+20', 'Egypt'),
  _Country('🇮🇶', '+964', 'Iraq'),
];

class PhoneScreen extends StatefulWidget {
  const PhoneScreen({super.key});
  @override
  State<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends State<PhoneScreen> {
  _Country _selected = _countries[0];
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _submit() {
    final number = _ctrl.text.trim();
    if (number.length < 7) return;
    final fullPhone = '${_selected.dialCode}$number';
    context.read<AuthBloc>().add(AuthSendOtpRequested(fullPhone));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (ctx, state) {
        if (state is AuthOtpSent) {
          ctx.push('/auth/otp', extra: {
            'phone': state.phone,
            'devOtp': state.devOtp,
          });
        }
        if (state is AuthError) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      builder: (ctx, state) {
        final loading = state is AuthLoading;
        return Scaffold(
          backgroundColor: HancrColors.background,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 32),
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: HancrColors.primary,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Center(
                      child: Text(
                        'H',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Captain Login',
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Enter your phone number to receive an OTP',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      GestureDetector(
                        onTap: _pickCountry,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 16),
                          decoration: BoxDecoration(
                            color: HancrColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              Text(_selected.flag,
                                  style: const TextStyle(fontSize: 20)),
                              const SizedBox(width: 6),
                              Text(
                                _selected.dialCode,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.keyboard_arrow_down,
                                  size: 18, color: HancrColors.textSecondary),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _ctrl,
                          keyboardType: TextInputType.phone,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly
                          ],
                          onSubmitted: (_) => _submit(),
                          decoration: const InputDecoration(
                            hintText: '5x xxx xxxx',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: loading ? null : _submit,
                    child: loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : Text(tr('sendOtp')),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _pickCountry() {
    showModalBottomSheet<_Country>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ListView.builder(
        itemCount: _countries.length,
        itemBuilder: (_, i) {
          final c = _countries[i];
          return ListTile(
            leading: Text(c.flag, style: const TextStyle(fontSize: 24)),
            title: Text(c.name),
            trailing: Text(c.dialCode,
                style: const TextStyle(color: HancrColors.textSecondary)),
            onTap: () => Navigator.pop(context, c),
          );
        },
      ),
    ).then((c) {
      if (c != null) setState(() => _selected = c);
    });
  }
}
