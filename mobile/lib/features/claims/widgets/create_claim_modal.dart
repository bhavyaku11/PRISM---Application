import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../../policies/models/policy_model.dart';
import '../models/claim_model.dart';
import '../services/claim_service.dart';

class CreateClaimModal extends StatefulWidget {
  final List<PolicyModel> policies;
  final String? defaultPolicyId;
  final ClaimService? claimService;
  final Function(ClaimModel newClaim) onClaimCreated;

  const CreateClaimModal({
    super.key,
    required this.policies,
    this.defaultPolicyId,
    this.claimService,
    required this.onClaimCreated,
  });

  static Future<void> show({
    required BuildContext context,
    required List<PolicyModel> policies,
    String? defaultPolicyId,
    ClaimService? claimService,
    required Function(ClaimModel newClaim) onClaimCreated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(modalCtx).viewInsets.bottom,
        ),
        child: CreateClaimModal(
          policies: policies,
          defaultPolicyId: defaultPolicyId,
          claimService: claimService,
          onClaimCreated: onClaimCreated,
        ),
      ),
    );
  }

  @override
  State<CreateClaimModal> createState() => _CreateClaimModalState();
}

class _CreateClaimModalState extends State<CreateClaimModal> {
  late final ClaimService _claimService;
  final _formKey = GlobalKey<FormState>();

  late String _selectedPolicyId;
  String _selectedClaimType = 'Hospitalization';

  final TextEditingController _claimNameController = TextEditingController();
  final TextEditingController _insuredMemberController = TextEditingController();
  final TextEditingController _hospitalNameController = TextEditingController();
  final TextEditingController _expenseController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  DateTime? _admissionDate;
  DateTime? _dischargeDate;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _claimService = widget.claimService ?? ClaimService();

    if (widget.defaultPolicyId != null &&
        widget.policies.any((p) => p.id == widget.defaultPolicyId)) {
      _selectedPolicyId = widget.defaultPolicyId!;
    } else if (widget.policies.isNotEmpty) {
      _selectedPolicyId = widget.policies.first.id;
    } else {
      _selectedPolicyId = '';
    }

    _prefillInsuredMember();
  }

  void _prefillInsuredMember() {
    if (_selectedPolicyId.isEmpty) return;
    try {
      final pol = widget.policies.firstWhere((p) => p.id == _selectedPolicyId);
      if (pol.insuredMember != null && pol.insuredMember!.isNotEmpty) {
        _insuredMemberController.text = pol.insuredMember!;
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _claimNameController.dispose();
    _insuredMemberController.dispose();
    _hospitalNameController.dispose();
    _expenseController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isAdmission) async {
    final initial = isAdmission
        ? (_admissionDate ?? DateTime.now())
        : (_dischargeDate ?? _admissionDate ?? DateTime.now());

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: PrismTheme.primaryBlue,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isAdmission) {
          _admissionDate = picked;
          if (_dischargeDate != null && _dischargeDate!.isBefore(picked)) {
            _dischargeDate = null;
          }
        } else {
          _dischargeDate = picked;
        }
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPolicyId.isEmpty) {
      setState(() {
        _errorMessage = 'Please select a policy for this claim.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final expenseRaw = _expenseController.text.replaceAll(RegExp(r'[^0-9.]'), '');
    final expenseVal = num.tryParse(expenseRaw);

    final admissionStr = _admissionDate != null
        ? DateFormat('yyyy-MM-dd').format(_admissionDate!)
        : null;
    final dischargeStr = _dischargeDate != null
        ? DateFormat('yyyy-MM-dd').format(_dischargeDate!)
        : null;

    try {
      final newClaim = await _claimService.createClaim(
        policyId: _selectedPolicyId,
        claimName: _claimNameController.text.trim(),
        claimType: _selectedClaimType,
        insuredMember: _insuredMemberController.text.trim(),
        hospitalName: _hospitalNameController.text.trim(),
        admissionDate: admissionStr,
        dischargeDate: dischargeStr,
        estimatedExpense: expenseVal,
        notes: _notesController.text.trim(),
      );

      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onClaimCreated(newClaim);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navyDark : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Modal drag handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Prepare a Claim',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : PrismTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Set up your workspace to organize documents & evidence',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    tooltip: 'Close',
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Scrollable Form Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Error Banner
                      if (_errorMessage != null)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isDark ? const Color(0xFF991B1B) : const Color(0xFFFCA5A5),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // 1. Associated Health Policy
                      _buildLabel('ASSOCIATED HEALTH POLICY', isDark),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1),
                          ),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedPolicyId.isNotEmpty ? _selectedPolicyId : null,
                            isExpanded: true,
                            hint: const Text('Select a policy'),
                            dropdownColor: isDark ? PrismTheme.navySurface : Colors.white,
                            items: widget.policies.map((p) {
                              final insurer = p.insurerName != null ? ' (${p.insurerName})' : '';
                              return DropdownMenuItem(
                                value: p.id,
                                child: Text(
                                  '${p.policyName}$insurer',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedPolicyId = val;
                                  _prefillInsuredMember();
                                });
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 2. Claim Name / Reason
                      _buildLabel('CLAIM NAME / REASON *', isDark),
                      TextFormField(
                        controller: _claimNameController,
                        decoration: _buildInputDecoration(
                          hintText: 'e.g. Hospitalization for Appendectomy',
                          isDark: isDark,
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Please enter a descriptive claim name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // 3. Claim Category
                      _buildLabel('CLAIM TYPE', isDark),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1),
                          ),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedClaimType,
                            isExpanded: true,
                            dropdownColor: isDark ? PrismTheme.navySurface : Colors.white,
                            items: kClaimTypes.map((type) {
                              return DropdownMenuItem(
                                value: type,
                                child: Text(
                                  type,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                                  ),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedClaimType = val;
                                });
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4. Insured Member & Hospital Name
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('INSURED PATIENT', isDark),
                                TextFormField(
                                  controller: _insuredMemberController,
                                  decoration: _buildInputDecoration(
                                    hintText: 'Patient Name',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('HOSPITAL / CLINIC', isDark),
                                TextFormField(
                                  controller: _hospitalNameController,
                                  decoration: _buildInputDecoration(
                                    hintText: 'Hospital Name',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // 5. Admission & Discharge Dates
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('ADMISSION DATE', isDark),
                                InkWell(
                                  onTap: () => _selectDate(context, true),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                                    decoration: BoxDecoration(
                                      color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.calendar_today_outlined,
                                          size: 15,
                                          color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _admissionDate != null
                                                ? DateFormat('dd MMM yyyy').format(_admissionDate!)
                                                : 'Select date',
                                            style: TextStyle(
                                              fontSize: 12.5,
                                              color: _admissionDate != null
                                                  ? (isDark ? Colors.white : PrismTheme.textPrimary)
                                                  : PrismTheme.textSecondary,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('DISCHARGE DATE', isDark),
                                InkWell(
                                  onTap: () => _selectDate(context, false),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                                    decoration: BoxDecoration(
                                      color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.calendar_today_outlined,
                                          size: 15,
                                          color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _dischargeDate != null
                                                ? DateFormat('dd MMM yyyy').format(_dischargeDate!)
                                                : 'Select date',
                                            style: TextStyle(
                                              fontSize: 12.5,
                                              color: _dischargeDate != null
                                                  ? (isDark ? Colors.white : PrismTheme.textPrimary)
                                                  : PrismTheme.textSecondary,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // 6. Estimated Expense
                      _buildLabel('ESTIMATED MEDICAL EXPENSE (₹)', isDark),
                      TextFormField(
                        controller: _expenseController,
                        keyboardType: TextInputType.number,
                        decoration: _buildInputDecoration(
                          hintText: 'e.g. 75000',
                          isDark: isDark,
                          prefixText: '₹ ',
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 7. Preparation Notes
                      _buildLabel('PREPARATION NOTES', isDark),
                      TextFormField(
                        controller: _notesController,
                        maxLines: 3,
                        decoration: _buildInputDecoration(
                          hintText: 'Add notes on doctor discussions, queries, or reminders...',
                          isDark: isDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Submit Button
            Padding(
              padding: const EdgeInsets.all(20),
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: PrismTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Create Claim Workspace',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration({
    required String hintText,
    required bool isDark,
    String? prefixText,
  }) {
    return InputDecoration(
      hintText: hintText,
      prefixText: prefixText,
      prefixStyle: TextStyle(
        fontSize: 13.5,
        fontWeight: FontWeight.bold,
        color: isDark ? Colors.white : PrismTheme.textPrimary,
      ),
      hintStyle: TextStyle(
        fontSize: 13,
        color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
      ),
      filled: true,
      fillColor: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: PrismTheme.primaryBlue,
          width: 1.5,
        ),
      ),
    );
  }
}
