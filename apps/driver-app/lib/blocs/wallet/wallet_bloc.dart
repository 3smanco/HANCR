import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/wallet_gql.dart';
import '../../core/models/wallet_model.dart';
import 'wallet_event.dart';
import 'wallet_state.dart';

class WalletBloc extends Bloc<WalletEvent, WalletState> {
  WalletBloc() : super(const WalletInitial()) {
    on<WalletLoadRequested>(_onLoad);
    on<WalletBalanceRefreshRequested>(_onRefreshBalance);
    on<WalletWithdrawalRequested>(_onWithdraw);
    on<WalletToastCleared>(_onToastCleared);
  }

  void _onToastCleared(
    WalletToastCleared event,
    Emitter<WalletState> emit,
  ) {
    final current = state;
    if (current is WalletLoaded && current.toast != null) {
      emit(current.copyWith(clearToast: true));
    }
  }

  // ── جلب الرصيد + المعاملات ───────────────────────────────────────────────
  Future<void> _onLoad(
    WalletLoadRequested event,
    Emitter<WalletState> emit,
  ) async {
    emit(const WalletLoading());
    try {
      final client = await GraphQLClientManager.get();

      final walletResult = await client.query(
        QueryOptions(
          document: gql(myDriverWalletQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (walletResult.hasException) throw walletResult.exception!;
      final wallet = WalletModel.fromJson(
        walletResult.data!['myDriverWallet'] as Map<String, dynamic>,
      );

      final txResult = await client.query(
        QueryOptions(
          document: gql(myDriverWalletTransactionsQuery),
          variables: const {'limit': 50, 'offset': 0},
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (txResult.hasException) throw txResult.exception!;
      final txs = (txResult.data!['myDriverWalletTransactions'] as List)
          .cast<Map<String, dynamic>>()
          .map(WalletTransactionModel.fromJson)
          .toList();

      emit(WalletLoaded(wallet: wallet, transactions: txs));
    } catch (e) {
      emit(WalletError('فشل تحميل المحفظة: $e'));
    }
  }

  // ── تحديث الرصيد فقط ─────────────────────────────────────────────────────
  Future<void> _onRefreshBalance(
    WalletBalanceRefreshRequested event,
    Emitter<WalletState> emit,
  ) async {
    final current = state;
    if (current is! WalletLoaded) return;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(
          document: gql(myDriverWalletQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (result.hasException) return;
      final wallet = WalletModel.fromJson(
        result.data!['myDriverWallet'] as Map<String, dynamic>,
      );
      emit(current.copyWith(wallet: wallet));
    } catch (_) {
      // keep previous state
    }
  }

  // ── طلب سحب ──────────────────────────────────────────────────────────────
  Future<void> _onWithdraw(
    WalletWithdrawalRequested event,
    Emitter<WalletState> emit,
  ) async {
    final current = state;
    if (current is! WalletLoaded) return;

    emit(WalletWithdrawalInProgress(current));

    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(requestWithdrawalMutation),
          variables: {'amount': event.amount},
        ),
      );
      if (result.hasException) throw result.exception!;

      final data = result.data!['requestWithdrawal'] as Map<String, dynamic>;
      final newBalance = (data['balanceAfter'] as num).toDouble();
      final currency = data['currency'] as String;

      // أعد تحميل المعاملات لإظهار معاملة السحب الجديدة
      final txResult = await client.query(
        QueryOptions(
          document: gql(myDriverWalletTransactionsQuery),
          variables: const {'limit': 50, 'offset': 0},
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      final txs = txResult.hasException
          ? current.transactions
          : (txResult.data!['myDriverWalletTransactions'] as List)
              .cast<Map<String, dynamic>>()
              .map(WalletTransactionModel.fromJson)
              .toList();

      emit(WalletLoaded(
        wallet: WalletModel(balance: newBalance, currency: currency),
        transactions: txs,
        toast:
            'تم تقديم طلب سحب ${event.amount.toStringAsFixed(0)} $currency — في انتظار موافقة الإدارة',
      ));
    } catch (e) {
      // أعد الحالة السابقة مع رسالة خطأ
      emit(current.copyWith(toast: 'فشل طلب السحب: ${_extractError(e)}'));
    }
  }

  String _extractError(Object e) {
    final s = e.toString();
    // GraphQL exceptions غالباً تحوي رسالة BadRequestException واضحة
    final match = RegExp(r'"message"\s*:\s*"([^"]+)"').firstMatch(s);
    return match?.group(1) ?? s;
  }
}
