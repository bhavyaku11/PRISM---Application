import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';

void main() {
  group('PolicyModel', () {
    test('parses json correctly with valid fields and fallbacks', () {
      final json = {
        'id': 'pol_123',
        'user_id': 'usr_456',
        'policy_name': 'Optima Secure Plan',
        'policy_number': 'HDFC-987654',
        'insurer_name': 'HDFC ERGO',
        'policy_type': 'Family Floater',
        'insured_member': 'Bhavya Kumar & Family',
        'policy_start_date': '2024-03-01T00:00:00Z',
        'policy_end_date': '2025-02-28T00:00:00Z',
        'sum_insured': 1000000,
        'premium': 18500,
        'premium_currency': 'INR',
        'status': 'processed',
        'understanding_score': 88,
        'created_at': '2024-03-01T10:00:00Z',
        'updated_at': '2024-03-01T10:05:00Z',
      };

      final model = PolicyModel.fromJson(json);

      expect(model.id, 'pol_123');
      expect(model.userId, 'usr_456');
      expect(model.policyName, 'Optima Secure Plan');
      expect(model.policyNumber, 'HDFC-987654');
      expect(model.insurerName, 'HDFC ERGO');
      expect(model.insuredMember, 'Bhavya Kumar & Family');
      expect(model.sumInsured, 1000000);
      expect(model.premium, 18500);
      expect(model.premiumCurrency, 'INR');
      expect(model.status, 'processed');
      expect(model.understandingScore, 88);
      expect(model.isProcessed, isTrue);
      expect(model.isProcessing, isFalse);
      expect(model.isFailed, isFalse);
      expect(model.statusBadgeLabel, 'Ready to explore');
    });

    test('formats currency and dates correctly in INR', () {
      final model = PolicyModel(
        id: 'pol_1',
        userId: 'usr_1',
        policyName: 'Star Health',
        sumInsured: 500000,
        premium: 12450,
        startDate: '2024-01-15',
        endDate: '2025-01-14',
        status: 'active',
      );

      expect(model.formattedSumInsured, '₹5,00,000');
      expect(model.formattedPremium, '₹12,450');
      expect(model.isProcessed, isTrue);
      expect(model.statusBadgeLabel, 'Ready to explore');
    });

    test('handles processing and failed status badges correctly', () {
      final processingModel = PolicyModel(
        id: 'pol_proc',
        userId: 'usr_1',
        policyName: 'Pending Policy',
        status: 'processing',
      );
      expect(processingModel.isProcessing, isTrue);
      expect(processingModel.statusBadgeLabel, 'Analyzing policy');

      final failedModel = PolicyModel(
        id: 'pol_fail',
        userId: 'usr_1',
        policyName: 'Failed Policy',
        status: 'failed',
      );
      expect(failedModel.isFailed, isTrue);
      expect(failedModel.statusBadgeLabel, 'Needs attention');
    });

    test('serializes to json correctly', () {
      final model = PolicyModel(
        id: 'pol_999',
        userId: 'usr_888',
        policyName: 'Care Advantage',
        sumInsured: 2500000,
        status: 'processed',
        createdAt: '2024-05-01',
      );

      final json = model.toJson();
      expect(json['id'], 'pol_999');
      expect(json['user_id'], 'usr_888');
      expect(json['policy_name'], 'Care Advantage');
      expect(json['sum_insured'], 2500000);
    });
  });
}
