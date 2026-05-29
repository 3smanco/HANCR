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
    on<WalletRechargeStarted>(_onRechargeStarted);
    on<WalletRechargeConfirmed>(_onRechargeConfirmed);
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
          document: gql(myWalletQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (walletResult.hasException) {
        throw walletResult.exception!;
      }
      final wallet = WalletModel.fromJson(
        walletResult.data!['myWallet'] as Map<String, dynamic>,
      );

      final txResult = await client.query(
        QueryOptions(
          document: gql(myWalletTransactionsQuery),
          variables: const {'limit': 50, 'offset': 0},
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (txResult.hasException) {
        throw txResult.exception!;
      }
      final txs = (txResult.data!['myWalletTransactions'] as List)
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
          document: gql(myWalletQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (result.hasException) return;
      final wallet = WalletModel.fromJson(
        result.data!['myWallet'] as Map<String, dynamic>,
      );
      emit(current.copyWith(wallet: wallet));
    } catch (_) {
      // ignore — keep previous state
    }
  }

  // ── بدء شحن المحفظة ──────────────────────────────────────────────────────
  Future<void> _onRechargeStarted(
    WalletRechargeStarted event,
    Emitter<WalletState> emit,
  ) async {
    final current = state;
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(startWalletRechargeMutation),
          variables: {
            'amount': event.amount,
            'gateway': event.gateway.gqlValue,
          },
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      final checkout = RechargeCheckoutModel.fromJson(
        result.data!['startWalletRecharge'] as Map<String, dynamic>,
      );
      if (current is WalletLoaded) {
        emit(current.copyWith(activeCheckout: checkout));
      } else {
        // إن لم تكن المحفظة محمَّلة بعد، حمِّلها أولاً ثم أَضِف الـ checkout.
        add(const WalletLoadRequested());
      }
    } catch (e) {
      emit(WalletError('فشل بدء الشحن: $e'));
    }
  }

  // ── تأكيد شحن (dev/admin) ────────────────────────────────────────────────
  Future<void> _onRechargeConfirmed(
    WalletRechargeConfirmed event,
    Emitter<WalletState> emit,
  ) async {
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(confirmWalletRechargeMutation),
          variables: {'transactionId': event.transactionId},
        ),
      );
      if (result.hasException) {
        throw result.exception!;
      }
      // بعد التأكيد، أعد تحميل كل شيء.
      add(const WalletLoadRequested());
    } catch (e) {
      emit(WalletError('فشل تأكيد الشحن: $e'));
    }
  }
}
