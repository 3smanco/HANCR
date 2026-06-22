import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/models/order_model.dart';
import '../../core/models/service_model.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/motion/motion.dart';

/// Grocery Run — يطلب الراكب من سائق شراء قائمة بقالة ضمن ميزانية محددة
/// وتوصيلها إلى عنوانه. يُستخدم نوع خدمة PackageDelivery الموجود + shoppingList.
class AuroraGroceryScreen extends StatefulWidget {
  const AuroraGroceryScreen({super.key});

  @override
  State<AuroraGroceryScreen> createState() => _AuroraGroceryScreenState();
}

class _GroceryItem {
  String name;
  int qty;
  String? note;
  _GroceryItem({required this.name, this.qty = 1, this.note});
}

class _AuroraGroceryScreenState extends State<AuroraGroceryScreen> {
  final _itemNameCtrl = TextEditingController();
  final _itemNoteCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController(text: '100');
  int _itemQty = 1;
  final List<_GroceryItem> _items = [];

  Map<String, dynamic>? _store;
  Map<String, dynamic>? _deliverTo;
  List<Map<String, dynamic>> _savedPlaces = [];
  ServiceModel? _parcelService;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _itemNameCtrl.dispose();
    _itemNoteCtrl.dispose();
    _budgetCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final client = await GraphQLClientManager.get();
      final results = await Future.wait([
        client.query(QueryOptions(
          document: gql(savedPlacesQuery),
          fetchPolicy: FetchPolicy.cacheAndNetwork,
        )),
        client.query(QueryOptions(
          document: gql(servicesQuery),
          variables: const {'regionId': AppConfig.defaultRegionId},
        )),
      ]);
      final places = (results[0].data?['savedPlaces'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final services = (results[1].data?['services'] as List<dynamic>? ?? [])
          .map((e) => ServiceModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final parcel = services.firstWhere(
        (s) => s.serviceType == 'PackageDelivery',
        orElse: () => services.isNotEmpty
            ? services.first
            : const ServiceModel(
                id: 0,
                name: '',
                nameEn: '',
                serviceType: '',
                baseFare: 0,
                minimumFee: 0,
                bidModeEnabled: false,
                enabled: true,
                displayOrder: 0,
                isVip: false,
              ),
      );
      if (!mounted) return;
      setState(() {
        _savedPlaces = places;
        _parcelService = parcel.id > 0 ? parcel : null;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _addItem() {
    final name = _itemNameCtrl.text.trim();
    if (name.isEmpty) return;
    setState(() {
      _items.add(_GroceryItem(
        name: name,
        qty: _itemQty,
        note: _itemNoteCtrl.text.trim().isEmpty
            ? null
            : _itemNoteCtrl.text.trim(),
      ));
      _itemNameCtrl.clear();
      _itemNoteCtrl.clear();
      _itemQty = 1;
    });
  }

  void _removeItem(int i) => setState(() => _items.removeAt(i));

  void _submit() {
    if (_store == null || _deliverTo == null) {
      _toast(tr('pickStoreAndDeliverTo'));
      return;
    }
    if (_items.isEmpty) {
      _toast(tr('addAtLeastOneItem'));
      return;
    }
    final budget = double.tryParse(_budgetCtrl.text.trim()) ?? 0;
    if (budget <= 0) {
      _toast(tr('budgetRequired'));
      return;
    }
    if (_parcelService == null) {
      _toast(tr('noServiceAvailable'));
      return;
    }

    final origin = GeoPoint(
      lat: (_store!['lat'] as num).toDouble(),
      lng: (_store!['lng'] as num).toDouble(),
    );
    final destination = GeoPoint(
      lat: (_deliverTo!['lat'] as num).toDouble(),
      lng: (_deliverTo!['lng'] as num).toDouble(),
    );

    // نُمرر shoppingList + budget عبر mutation مباشر (الحقول الجديدة
    // ليست في OrderBloc event بعد)
    _submitDirect(origin, destination, budget);
  }

  Future<void> _submitDirect(
      GeoPoint origin, GeoPoint destination, double budget) async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(_createGroceryOrderMutation),
        variables: {
          'input': {
            'points': [
              {'lat': origin.lat, 'lng': origin.lng},
              {'lat': destination.lat, 'lng': destination.lng},
            ],
            'addresses': [
              _store!['address'] as String? ?? '',
              _deliverTo!['address'] as String? ?? '',
            ],
            'serviceId': _parcelService!.id,
            'regionId': AppConfig.defaultRegionId,
            'receiverName': tr('myselfRecipient'),
            'shoppingList': _items
                .map((i) => {
                      'name': i.name,
                      'qty': i.qty,
                      if (i.note != null) 'note': i.note,
                    })
                .toList(),
            'budget': budget,
          },
        },
      ));
      if (res.hasException) throw res.exception!;
      if (mounted) {
        _toast(tr('groceryOrderPlaced'));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        _toast(e.toString().replaceFirst('Exception: ', ''));
      }
    }
  }

  void _toast(String s) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('groceryRun'), style: AuroraText.titleSmall),
      ),
      body: _loading
          ? const Center(child: AuroraLoader(size: 36))
          : ListView(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              children: [
                _placeDropdown(_store, (v) => setState(() => _store = v),
                    tr('pickStore'), Icons.storefront),
                const SizedBox(height: AuroraSpacing.sm),
                _placeDropdown(
                    _deliverTo,
                    (v) => setState(() => _deliverTo = v),
                    tr('deliverTo'),
                    Icons.home_outlined),
                const SizedBox(height: AuroraSpacing.lg),
                Text(tr('shoppingList'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                if (_items.isEmpty)
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(vertical: AuroraSpacing.sm),
                    child: Text(tr('noItemsYet'),
                        style: AuroraText.bodySmall
                            .copyWith(color: AuroraColors.textSecondary)),
                  )
                else
                  ..._items
                      .asMap()
                      .entries
                      .map((e) => _itemTile(e.key, e.value)),
                const SizedBox(height: AuroraSpacing.sm),
                _addItemForm(),
                const SizedBox(height: AuroraSpacing.lg),
                TextField(
                  controller: _budgetCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: tr('budget'),
                    filled: true,
                    fillColor: AuroraColors.coal,
                    prefixIcon: Icon(Icons.payments, color: AuroraColors.ember),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AuroraRadius.md),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  style:
                      AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
                ),
                const SizedBox(height: AuroraSpacing.lg),
                AuroraButton.primary(
                  label: tr('orderGrocery'),
                  icon: Icons.shopping_basket,
                  onPressed: _submit,
                ),
                const SizedBox(height: AuroraSpacing.xs),
                Text(tr('groceryHint'),
                    textAlign: TextAlign.center,
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.textSecondary)),
              ],
            ),
    );
  }

  Widget _placeDropdown(
      Map<String, dynamic>? value,
      ValueChanged<Map<String, dynamic>?> onChanged,
      String hint,
      IconData icon) {
    return DropdownButtonFormField<Map<String, dynamic>>(
      initialValue: value,
      dropdownColor: AuroraColors.coal,
      style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
      decoration: InputDecoration(
        filled: true,
        fillColor: AuroraColors.coal,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          borderSide: BorderSide.none,
        ),
        prefixIcon: Icon(icon, color: AuroraColors.ember),
      ),
      hint: Text(hint,
          style: AuroraText.bodyMedium
              .copyWith(color: AuroraColors.textSecondary)),
      items: _savedPlaces
          .map((p) => DropdownMenuItem(
                value: p,
                child: Text(p['label'] as String? ?? '',
                    overflow: TextOverflow.ellipsis),
              ))
          .toList(),
      onChanged: onChanged,
    );
  }

  Widget _itemTile(int i, _GroceryItem it) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AuroraColors.ember,
              borderRadius: BorderRadius.circular(AuroraRadius.sm),
            ),
            child: Text('${it.qty}×',
                style: AuroraText.bodySmall.copyWith(
                  color: AuroraColors.obsidian,
                  fontWeight: FontWeight.w700,
                )),
          ),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(it.name,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
                if (it.note != null)
                  Text(it.note!,
                      style: AuroraText.bodySmall
                          .copyWith(color: AuroraColors.textSecondary)),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.close, color: AuroraColors.danger),
            onPressed: () => _removeItem(i),
          ),
        ],
      ),
    );
  }

  Widget _addItemForm() {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _itemNameCtrl,
                  decoration: InputDecoration(
                    hintText: tr('itemName'),
                    border: InputBorder.none,
                  ),
                  style:
                      AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
                ),
              ),
              IconButton(
                icon: Icon(Icons.remove_circle_outline,
                    color: AuroraColors.textSecondary),
                onPressed:
                    _itemQty > 1 ? () => setState(() => _itemQty--) : null,
              ),
              Text('$_itemQty',
                  style: AuroraText.titleSmall
                      .copyWith(color: AuroraColors.pearl)),
              IconButton(
                icon: Icon(Icons.add_circle_outline, color: AuroraColors.ember),
                onPressed:
                    _itemQty < 20 ? () => setState(() => _itemQty++) : null,
              ),
            ],
          ),
          TextField(
            controller: _itemNoteCtrl,
            decoration: InputDecoration(
              hintText: tr('itemNoteOptional'),
              border: InputBorder.none,
              isDense: true,
            ),
            style: AuroraText.bodySmall
                .copyWith(color: AuroraColors.textSecondary),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton.icon(
              icon: Icon(Icons.add, color: AuroraColors.ember),
              label: Text(tr('addItem'),
                  style: TextStyle(color: AuroraColors.ember)),
              onPressed: _addItem,
            ),
          ),
        ],
      ),
    );
  }
}

// Mutation مباشر يدعم shoppingList + budget (extension للـ createOrder الموجود).
const String _createGroceryOrderMutation = r'''
  mutation CreateGroceryOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      type
      status
      shoppingList { name qty note }
      budget
    }
  }
''';
