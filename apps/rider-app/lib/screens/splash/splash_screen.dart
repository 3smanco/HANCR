import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/services/storage_service.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/car_art.dart';
import '../../core/motion/motion.dart';

/// SplashScreen — Aurora design (dark obsidian + ember glow).
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _scaleAnim;

  // شبكة أمان نهائية: لو لم يصل AuthBloc لحالة نهائية خلال 12ث (لأي سبب)،
  // ننتقل يدوياً حسب وجود التوكن — كي لا يعلّق التطبيق على شاشة البداية أبداً.
  Timer? _fallbackTimer;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _scaleAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack),
    );
    _ctrl.forward();

    _fallbackTimer = Timer(const Duration(seconds: 12), _fallbackNavigate);
  }

  Future<void> _fallbackNavigate() async {
    if (_navigated || !mounted) return;
    final hasToken = await StorageService.hasToken();
    if (_navigated || !mounted) return;
    _navigated = true;
    context.go(hasToken ? '/home' : '/auth/phone');
  }

  void _go(String route) {
    if (_navigated || !mounted) return;
    _navigated = true;
    _fallbackTimer?.cancel();
    context.go(route);
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (ctx, state) {
        if (state is AuthAuthenticated) {
          _go('/home');
        } else if (state is AuthUnauthenticated || state is AuthError) {
          _go('/auth/phone');
        }
      },
      child: Scaffold(
        backgroundColor: AuroraColors.obsidian,
        body: AuroraBackground(
          child: Center(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: ScaleTransition(
                scale: _scaleAnim,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // N7 — توهّج "يتنفّس" حول الشعار
                    GlowPulse(
                      color: AuroraColors.ember,
                      minBlur: 14,
                      maxBlur: 40,
                      child: Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          gradient: AuroraColors.emberGradient,
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Center(
                          child: Text(
                            'H',
                            style: TextStyle(
                              fontSize: 52,
                              fontWeight: FontWeight.w800,
                              color: AuroraColors.pearl,
                              letterSpacing: -2,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'HANCR',
                      style: AuroraText.displayMedium.copyWith(
                        color: AuroraColors.pearl,
                        letterSpacing: 6,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Smart Mobility for MENA',
                      style: AuroraText.bodySmall.copyWith(
                        color: AuroraColors.textSecondary,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 28),
                    // سيارة بطلة تنساب للداخل
                    const CarArt(type: CarType.luxury, size: Size(132, 60))
                        .animate()
                        .fadeIn(duration: Motion.slow, delay: Motion.base)
                        .slideX(begin: -0.5, end: 0, curve: Motion.decelerate),
                    const SizedBox(height: 28),
                    const AuroraLoader(size: 30),
                    const SizedBox(height: 16),
                    // ختم النسخة — لتأكيد أن الجهاز يشغّل أحدث بناء.
                    Text(
                      'build 2026-06-28-e',
                      style: AuroraText.bodySmall.copyWith(
                        color: AuroraColors.textHint,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
