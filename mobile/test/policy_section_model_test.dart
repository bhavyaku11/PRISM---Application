import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/policies/models/policy_section_model.dart';

void main() {
  group('PolicySectionModel', () {
    test('parses json correctly and handles page range text', () {
      final json = {
        'id': 'sec_1',
        'user_id': 'usr_1',
        'policy_id': 'pol_1',
        'document_id': 'doc_1',
        'section_type': 'waiting_period',
        'title': 'Pre-Existing Disease Waiting Period',
        'content':
            'A waiting period of 36 months of continuous coverage shall apply to pre-existing conditions.',
        'page_start': 4,
        'page_end': 6,
        'confidence': 0.92,
        'metadata': {'category': 'waiting_periods'},
        'created_at': '2024-03-01T10:00:00Z',
      };

      final section = PolicySectionModel.fromJson(json);

      expect(section.id, 'sec_1');
      expect(section.userId, 'usr_1');
      expect(section.policyId, 'pol_1');
      expect(section.documentId, 'doc_1');
      expect(section.sectionType, 'waiting_period');
      expect(section.title, 'Pre-Existing Disease Waiting Period');
      expect(section.content, contains('36 months'));
      expect(section.pageStart, 4);
      expect(section.pageEnd, 6);
      expect(section.pageRangeText, 'Pages 4–6');
      expect(section.confidence, 0.92);
      expect(section.isLowConfidence, isFalse);
      expect(section.humanSectionType, 'Waiting Period');
    });

    test('handles single page range text and low confidence alert flag', () {
      final section = PolicySectionModel(
        id: 'sec_2',
        userId: 'usr_1',
        policyId: 'pol_1',
        sectionType: 'exclusions',
        title: 'Cosmetic Surgery Exclusion',
        content: 'Expenses undertaken for cosmetic surgery are not covered.',
        pageStart: 12,
        pageEnd: 12,
        confidence: 0.65,
      );

      expect(section.pageRangeText, 'Page 12');
      expect(section.isLowConfidence, isTrue);
      expect(section.humanSectionType, 'Exclusion');
    });

    test('serializes to json correctly', () {
      final section = PolicySectionModel(
        id: 'sec_3',
        userId: 'usr_1',
        policyId: 'pol_1',
        sectionType: 'limits',
        title: 'Room Rent Cap',
        content: '1% of Sum Insured per day for standard private room.',
        pageStart: 8,
        pageEnd: 8,
      );

      final json = section.toJson();
      expect(json['id'], 'sec_3');
      expect(json['section_type'], 'limits');
      expect(json['title'], 'Room Rent Cap');
      expect(json['page_start'], 8);
    });
  });
}
