import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_state.dart';
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
  bool _animationStarted = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _scaleAnim = Tween<double>(
      begin: 0.85,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduceMotion =
        MediaQuery.disableAnimationsOf(context) || Motion.reduceMotion;
    if (reduceMotion) {
      _ctrl
        ..stop()
        ..value = 1;
      _animationStarted = true;
      return;
    }
    if (!_animationStarted) {
      _ctrl.forward();
      _animationStarted = true;
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion =
        MediaQuery.disableAnimationsOf(context) || Motion.reduceMotion;
    Widget carArt = const CarArt(type: CarType.suv, size: Size(132, 60));
    if (!reduceMotion) {
      carArt = carArt
          .animate()
          .fadeIn(duration: Motion.slow, delay: Motion.base)
          .slideX(begin: -0.5, end: 0, curve: Motion.decelerate);
    }

    return BlocListener<AuthBloc, AuthState>(
      listener: (ctx, state) {
        if (state is AuthAuthenticated) {
          ctx.go('/home');
        } else if (state is AuthUnauthenticated || state is AuthError) {
          ctx.go('/auth/phone');
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
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        gradient: AuroraColors.emberGradient,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: AuroraShadows.emberGlow,
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
                    carArt,
                    const SizedBox(height: 28),
                    const AuroraLoader(size: 30),
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
