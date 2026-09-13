import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../policies/models/policy_model.dart';
import '../../policies/services/policy_service.dart';
import '../models/ask_models.dart';
import '../services/ask_service.dart';
import '../widgets/evidence_card.dart';
import '../widgets/markdown_text_view.dart';

const List<String> kSuggestedQuestions = [
  'Does my policy cover ICU charges?',
  'What are the room rent limits?',
  'Is there a co-payment?',
  'What is the waiting period for pre-existing diseases?',
  'What exclusions apply to my policy?',
  'How do I file a cashless claim?',
];

class AskScreen extends StatefulWidget {
  final String? policyId;
  final String? initialQuestion;
  final List<PolicyModel>? initialPolicies;
  final List<ChatMessageModel>? initialMessages;
  final AskService? askService;
  final PolicyService? policyService;

  const AskScreen({
    super.key,
    this.policyId,
    this.initialQuestion,
    this.initialPolicies,
    this.initialMessages,
    this.askService,
    this.policyService,
  });

  @override
  State<AskScreen> createState() => _AskScreenState();
}

class _AskScreenState extends State<AskScreen> {
  late final AskService _askService;
  late final PolicyService _policyService;

  final TextEditingController _questionController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  List<PolicyModel> _policies = [];
  bool _isLoadingPolicies = true;
  String _selectedPolicyId = 'all';

  final List<ChatMessageModel> _messages = [];
  bool _isLoadingAnswer = false;
  String? _conversationId;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _askService = widget.askService ?? AskService();
    _policyService = widget.policyService ?? PolicyService();

    if (widget.policyId != null && widget.policyId!.isNotEmpty) {
      _selectedPolicyId = widget.policyId!;
    }

    if (widget.initialQuestion != null && widget.initialQuestion!.isNotEmpty) {
      _questionController.text = widget.initialQuestion!;
    }

    if (widget.initialMessages != null) {
      _messages.addAll(widget.initialMessages!);
    }

    if (widget.initialPolicies != null) {
      _policies = widget.initialPolicies!;
      _isLoadingPolicies = false;
      _applyPolicySelectionRules(_policies);
    } else {
      _loadPolicies();
    }
  }

  void _applyPolicySelectionRules(List<PolicyModel> policies) {
    if (widget.policyId != null &&
        policies.any((p) => p.id == widget.policyId)) {
      _selectedPolicyId = widget.policyId!;
    } else {
      final processedPolicies =
          policies.where((p) => p.status == 'processed' || p.status == 'active').toList();
      if (processedPolicies.length == 1) {
        _selectedPolicyId = processedPolicies.first.id;
      } else if (widget.policyId == null && policies.isNotEmpty) {
        _selectedPolicyId = 'all';
      }
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadPolicies() async {
    setState(() {
      _isLoadingPolicies = true;
    });

    try {
      final policies = await _policyService.getPolicies();
      if (!mounted) return;

      setState(() {
        _policies = policies;
        _isLoadingPolicies = false;
        _applyPolicySelectionRules(policies);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingPolicies = false;
      });
    }
  }

  PolicyModel? get _currentPolicy {
    if (_selectedPolicyId == 'all') return null;
    try {
      return _policies.firstWhere((p) => p.id == _selectedPolicyId);
    } catch (_) {
      return null;
    }
  }

  bool get _isPolicyReady {
    if (_selectedPolicyId == 'all') {
      // At least one policy must be processed or active
      return _policies.any((p) => p.status == 'processed' || p.status == 'active');
    }
    final policy = _currentPolicy;
    if (policy == null) return false;
    return policy.status == 'processed' || policy.status == 'active';
  }

  String? get _unprocessedWarningMessage {
    if (_policies.isEmpty) return null;
    if (_selectedPolicyId == 'all') {
      final hasReady = _policies.any((p) => p.status == 'processed' || p.status == 'active');
      if (!hasReady) {
        return 'Your policies are currently being processed. You will be able to ask PRISM questions once processing completes.';
      }
      return null;
    }

    final policy = _currentPolicy;
    if (policy == null) return null;

    if (policy.status == 'pending' ||
        policy.status == 'processing' ||
        policy.status == 'uploading') {
      return 'Your policy is still being processed. You’ll be able to ask PRISM questions once your policy is ready.';
    }

    if (policy.status == 'failed') {
      return 'Document extraction for this policy failed. Please re-upload or contact support to enable policy questions.';
    }

    return null;
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSend([String? presetText]) async {
    final textToSend = (presetText ?? _questionController.text).trim();
    if (textToSend.isEmpty || _isLoadingAnswer) return;

    if (!_isPolicyReady) {
      setState(() {
        _errorMessage = _unprocessedWarningMessage ??
            'This policy is not ready for questions yet.';
      });
      return;
    }

    _questionController.clear();
    setState(() {
      _errorMessage = null;
      _messages.add(ChatMessageModel(
        id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
        role: 'user',
        content: textToSend,
        createdAt: DateTime.now(),
      ));
      _isLoadingAnswer = true;
    });
    _scrollToBottom();

    try {
      final res = await _askService.askQuestion(
        question: textToSend,
        policyId: _selectedPolicyId != 'all' ? _selectedPolicyId : null,
        conversationId: _conversationId,
      );

      if (!mounted) return;

      setState(() {
        if (res.conversationId.isNotEmpty) {
          _conversationId = res.conversationId;
        }

        _messages.add(ChatMessageModel(
          id: res.messageId.isNotEmpty
              ? res.messageId
              : 'asst_${DateTime.now().millisecondsSinceEpoch}',
          role: 'assistant',
          content: res.answer,
          grounded: res.grounded,
          confidence: res.confidence,
          citations: res.citations,
          sources: res.sources,
          createdAt: DateTime.now(),
        ));
        _isLoadingAnswer = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingAnswer = false;
      });
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: isDark ? PrismTheme.primaryBlue : PrismTheme.navy,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '✦',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Text('Ask PRISM'),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? PrismTheme.borderDark : const Color(0xFFBFDBFE),
                  ),
                ),
                child: const Text(
                  'GROUNDED',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: PrismTheme.primaryBlue,
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          if (_messages.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.refresh, size: 20),
              tooltip: 'New Conversation',
              onPressed: () {
                setState(() {
                  _messages.clear();
                  _conversationId = null;
                  _errorMessage = null;
                });
              },
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Policy Scope Header
            _buildPolicySelector(isDark),

            // 2. Unprocessed Policy Warning Banner (if applicable)
            if (_unprocessedWarningMessage != null)
              _buildWarningBanner(isDark, _unprocessedWarningMessage!),

            // 3. Error Banner (if any)
            if (_errorMessage != null) _buildErrorBanner(isDark),

            // 4. Main Chat Area
            Expanded(
              child: _isLoadingPolicies
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor:
                            AlwaysStoppedAnimation<Color>(PrismTheme.primaryBlue),
                      ),
                    )
                  : _policies.isEmpty
                      ? _buildNoPoliciesState(isDark)
                      : _messages.isEmpty
                          ? _buildEmptyConversationView(isDark)
                          : _buildConversationList(isDark),
            ),

            // 5. Bottom Question Input Area
            if (_policies.isNotEmpty) _buildBottomInputArea(isDark),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // 1. POLICY SELECTOR
  // ===========================================================================
  Widget _buildPolicySelector(bool isDark) {
    if (_policies.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        border: Border(
          bottom: BorderSide(
            color: isDark ? PrismTheme.borderDark : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.shield_outlined,
            size: 16,
            color: isDark ? PrismTheme.softCyan : PrismTheme.primaryBlue,
          ),
          const SizedBox(width: 8),
          Text(
            'Policy Scope:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
              decoration: BoxDecoration(
                color: isDark ? PrismTheme.cardDark : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? PrismTheme.borderDark : const Color(0xFFCBD5E1),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedPolicyId,
                  isDense: true,
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down, size: 18),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                  dropdownColor: isDark ? PrismTheme.cardDark : Colors.white,
                  onChanged: (val) {
                    if (val == null) return;
                    setState(() {
                      _selectedPolicyId = val;
                      _errorMessage = null;
                    });
                  },
                  items: [
                    DropdownMenuItem(
                      value: 'all',
                      child: Text(
                        'All Active Policies (${_policies.length})',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    ..._policies.map((p) {
                      final insurerStr = p.insurerName?.isNotEmpty == true
                          ? ' (${p.insurerName})'
                          : '';
                      return DropdownMenuItem(
                        value: p.id,
                        child: Text(
                          '${p.policyName}$insurerStr',
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 2. WARNING / ERROR BANNERS
  // ===========================================================================
  Widget _buildWarningBanner(bool isDark, String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: isDark ? const Color(0xFF422006) : const Color(0xFFFEF3C7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 16, color: Color(0xFFD97706)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2),
      child: Row(
        children: [
          const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage!,
              style: TextStyle(
                fontSize: 11.5,
                color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 16),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
            onPressed: () {
              setState(() {
                _errorMessage = null;
              });
            },
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 3. NO POLICIES EMPTY STATE
  // ===========================================================================
  Widget _buildNoPoliciesState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? PrismTheme.cardDark : const Color(0xFFEFF6FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.description_outlined,
                size: 44,
                color: PrismTheme.primaryBlue,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Add a policy to start asking PRISM',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : PrismTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'PRISM provides grounded Q&A backed by your actual health insurance documents.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: isDark
                    ? PrismTheme.textSecondaryDark
                    : PrismTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => context.push('/policies/add'),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Policy'),
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // 4. WELCOME & SUGGESTED QUESTIONS VIEW
  // ===========================================================================
  Widget _buildEmptyConversationView(bool isDark) {
    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 16),
        Center(
          child: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? PrismTheme.borderDark : const Color(0xFFDBEAFE),
              ),
            ),
            child: const Center(
              child: Icon(
                Icons.shield_outlined,
                color: PrismTheme.primaryBlue,
                size: 28,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'What would you like to know about your policy?',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : PrismTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Ask anything regarding room rent sub-limits, ICU charges, waiting periods, co-payment, exclusions, or claim procedures. Answers are directly grounded in your policy document.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12.5,
            height: 1.45,
            color:
                isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 28),
        Text(
          'SUGGESTED QUESTIONS',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
            color:
                isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 10),
        ...kSuggestedQuestions.map((q) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: InkWell(
              onTap: _isPolicyReady ? () => _handleSend(q) : null,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? PrismTheme.cardDark : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark
                        ? PrismTheme.borderDark
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        q,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white70 : PrismTheme.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.arrow_forward,
                      size: 14,
                      color: PrismTheme.primaryBlue,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  // ===========================================================================
  // 5. CONVERSATION MESSAGE LIST
  // ===========================================================================
  Widget _buildConversationList(bool isDark) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length + (_isLoadingAnswer ? 1 : 0),
      itemBuilder: (context, idx) {
        if (idx == _messages.length && _isLoadingAnswer) {
          return _buildLoadingBubble(isDark);
        }

        final msg = _messages[idx];
        if (msg.isUser) {
          return _buildUserMessage(msg, isDark);
        } else {
          return _buildAssistantMessage(msg, isDark);
        }
      },
    );
  }

  Widget _buildUserMessage(ChatMessageModel msg, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Align(
        alignment: Alignment.centerRight,
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.8,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.primaryBlue : PrismTheme.navy,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              topRight: Radius.circular(4),
              bottomLeft: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            msg.content,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13.5,
              height: 1.4,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAssistantMessage(ChatMessageModel msg, bool isDark) {
    final isGrounded = msg.grounded ?? false;

    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.cardDark : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? PrismTheme.borderDark : const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Assistant Header with Grounded Badge
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 6,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        '✦',
                        style: TextStyle(
                          color: PrismTheme.primaryBlue,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'PRISM Response',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : PrismTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isGrounded
                          ? (isDark
                              ? const Color(0xFF064E3B)
                              : const Color(0xFFECFDF5))
                          : (isDark
                              ? const Color(0xFF78350F)
                              : const Color(0xFFFEF3C7)),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isGrounded
                            ? (isDark
                                ? const Color(0xFF047857)
                                : const Color(0xFFA7F3D0))
                            : (isDark
                                ? const Color(0xFFB45309)
                                : const Color(0xFFFDE68A)),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isGrounded
                                ? const Color(0xFF10B981)
                                : const Color(0xFFF59E0B),
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          isGrounded ? 'Grounded in Policy' : 'Insufficient Evidence',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isGrounded
                                ? (isDark
                                    ? const Color(0xFF6EE7B7)
                                    : const Color(0xFF065F46))
                                : (isDark
                                    ? const Color(0xFFFCD34D)
                                    : const Color(0xFF92400E)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Answer Content
              MarkdownTextView(text: msg.content),

              // Citations & Evidence Section
              if (msg.citations.isNotEmpty || msg.sources.isNotEmpty)
                EvidenceCard(
                  citations: msg.citations,
                  sources: msg.sources,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingBubble(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text(
              '✦',
              style: TextStyle(
                color: PrismTheme.primaryBlue,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? PrismTheme.cardDark : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? PrismTheme.borderDark : const Color(0xFFE2E8F0),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(PrismTheme.primaryBlue),
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  'PRISM is checking your policy...',
                  style: TextStyle(
                    fontSize: 12,
                    color: PrismTheme.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 6. BOTTOM QUESTION INPUT
  // ===========================================================================
  Widget _buildBottomInputArea(bool isDark) {
    final isEnabled = _isPolicyReady && !_isLoadingAnswer;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.cardDark : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? PrismTheme.borderDark : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? PrismTheme.borderDark
                          : const Color(0xFFCBD5E1),
                    ),
                  ),
                  child: TextField(
                    controller: _questionController,
                    focusNode: _focusNode,
                    enabled: isEnabled,
                    maxLength: 1000,
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: isEnabled ? (_) => _handleSend() : null,
                    style: TextStyle(
                      fontSize: 13.5,
                      color: isDark ? Colors.white : PrismTheme.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: isEnabled
                          ? 'Ask about your coverage...'
                          : 'Policy is not ready for questions...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? PrismTheme.textSecondaryDark
                            : PrismTheme.textSecondary,
                      ),
                      border: InputBorder.none,
                      counterText: '', // Hide default counter to keep it clean
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 46,
                width: 46,
                child: IconButton(
                  onPressed: isEnabled ? () => _handleSend() : null,
                  tooltip: 'Send question',
                  style: IconButton.styleFrom(
                    backgroundColor: isEnabled
                        ? (isDark ? PrismTheme.primaryBlue : PrismTheme.navy)
                        : (isDark ? Colors.white10 : Colors.black12),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: _isLoadingAnswer
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 20),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Safety Disclaimer
          Text(
            'PRISM provides policy guidance based strictly on your uploaded documents. It does not provide medical or legal advice.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              height: 1.3,
              color: isDark
                  ? PrismTheme.textSecondaryDark.withValues(alpha: 0.8)
                  : PrismTheme.textSecondary.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }
}
