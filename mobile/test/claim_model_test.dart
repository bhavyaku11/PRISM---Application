import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/claims/models/claim_model.dart';

void main() {
  group('ClaimModel Tests', () {
    test('parses ClaimModel from JSON accurately', () {
      final json = {
        'id': 'claim_101',
        'user_id': 'usr_test_1',
        'policy_id': 'pol_hdfc_01',
        'claim_name': 'Emergency Appendectomy',
        'claim_type': 'Inpatient',
        'insured_member': 'Aarav Kumar',
        'hospital_name': 'Apollo Hospitals, Greams Road',
        'admission_date': '2024-11-10',
        'discharge_date': '2024-11-14',
        'estimated_expense': 185000.50,
        'currency': 'INR',
        'status': 'preparing',
        'notes': 'Awaiting final itemized hospital bill',
        'preparation_progress': 45,
        'created_at': '2024-11-11T10:00:00Z',
        'policies': {
          'id': 'pol_hdfc_01',
          'user_id': 'usr_test_1',
          'policy_name': 'HDFC ERGO Optima Secure',
          'insurer_name': 'HDFC ERGO',
          'status': 'processed',
        },
      };

      final claim = ClaimModel.fromJson(json);

      expect(claim.id, 'claim_101');
      expect(claim.userId, 'usr_test_1');
      expect(claim.policyId, 'pol_hdfc_01');
      expect(claim.claimName, 'Emergency Appendectomy');
      expect(claim.claimType, 'Inpatient');
      expect(claim.insuredMember, 'Aarav Kumar');
      expect(claim.hospitalName, 'Apollo Hospitals, Greams Road');
      expect(claim.admissionDate, '2024-11-10');
      expect(claim.dischargeDate, '2024-11-14');
      expect(claim.estimatedExpense, 185000.50);
      expect(claim.status, 'preparing');
      expect(claim.notes, 'Awaiting final itemized hospital bill');
      expect(claim.preparationProgress, 45);
      expect(claim.policyName, 'HDFC ERGO Optima Secure');
      expect(claim.insurerName, 'HDFC ERGO');
      expect(claim.formattedExpense, '₹1,85,001');
      expect(claim.statusLabel, 'Preparing');
    });

    test('parses ClaimModel with missing optional fields safely', () {
      final json = {
        'id': 'claim_minimal',
        'user_id': 'usr_2',
        'claim_name': 'Minimal Claim',
        'status': 'review',
      };

      final claim = ClaimModel.fromJson(json);

      expect(claim.id, 'claim_minimal');
      expect(claim.claimName, 'Minimal Claim');
      expect(claim.status, 'review');
      expect(claim.statusLabel, 'Ready for Review');
      expect(claim.policyId, '');
      expect(claim.policyName, isNull);
      expect(claim.estimatedExpense, isNull);
      expect(claim.formattedExpense, 'Pending estimation');
      expect(claim.preparationProgress, 0);
    });

    test('converts ClaimModel to JSON preserving DB schema column names', () {
      final claim = ClaimModel(
        id: 'claim_202',
        userId: 'usr_abc',
        policyId: 'pol_xyz',
        claimName: 'Cataract Surgery',
        claimType: 'Day Care',
        insuredMember: 'Meera Kumar',
        hospitalName: 'Sankara Nethralaya',
        admissionDate: '2024-12-01',
        dischargeDate: '2024-12-01',
        estimatedExpense: 45000,
        currency: 'INR',
        status: 'preparing',
        notes: 'Pre-auth approved',
        preparationProgress: 60,
      );

      final json = claim.toJson();

      expect(json['id'], 'claim_202');
      expect(json['user_id'], 'usr_abc');
      expect(json['policy_id'], 'pol_xyz');
      expect(json['claim_name'], 'Cataract Surgery');
      expect(json['claim_type'], 'Day Care');
      expect(json['insured_member'], 'Meera Kumar');
      expect(json['hospital_name'], 'Sankara Nethralaya');
      expect(json['admission_date'], '2024-12-01');
      expect(json['discharge_date'], '2024-12-01');
      expect(json['estimated_expense'], 45000);
      expect(json['status'], 'preparing');
      expect(json['notes'], 'Pre-auth approved');
      expect(json['preparation_progress'], 60);
    });

    test('validates database status values strictly', () {
      // Valid database constraint values
      expect(ClaimModel.isValidStatus('preparing'), isTrue);
      expect(ClaimModel.isValidStatus('review'), isTrue);
      expect(ClaimModel.isValidStatus('submitted'), isTrue);
      expect(ClaimModel.isValidStatus('closed'), isTrue);
      expect(ClaimModel.isValidStatus('archived'), isTrue);

      // Invalid or uppercase values that violate DB constraint
      expect(ClaimModel.isValidStatus('PREPARING'), isFalse);
      expect(ClaimModel.isValidStatus('Draft'), isFalse);
      expect(ClaimModel.isValidStatus('Approved'), isFalse);
      expect(ClaimModel.isValidStatus('unknown'), isFalse);
    });
  });

  group('ClaimDocumentModel Tests', () {
    test('parses ClaimDocumentModel correctly', () {
      final json = {
        'id': 'cdoc_01',
        'user_id': 'usr_test_1',
        'claim_id': 'claim_101',
        'document_id': 'doc_raw_01',
        'notes': '[discharge_summary] Original discharge summary signed by Dr. Ramesh',
        'created_at': '2024-11-12T10:00:00Z',
        'documents': {
          'document_name': 'discharge_summary_aarav.pdf',
          'document_type': 'discharge_summary',
          'storage_path': 'claims/claim_101/discharge_summary_aarav.pdf',
          'file_size': 1420500,
          'mime_type': 'application/pdf',
        },
      };

      final doc = ClaimDocumentModel.fromJson(json);

      expect(doc.id, 'cdoc_01');
      expect(doc.claimId, 'claim_101');
      expect(doc.documentId, 'doc_raw_01');
      expect(doc.category, 'discharge_summary');
      expect(doc.displayName, 'discharge_summary_aarav.pdf');
      expect(doc.storagePath, 'claims/claim_101/discharge_summary_aarav.pdf');
      expect(doc.fileSize, 1420500);
      expect(doc.formattedFileSize, '1.4 MB');
    });

    test('extracts category from notes bracket or falls back to documentType', () {
      const docWithBracket = ClaimDocumentModel(
        id: 'd1',
        userId: 'u1',
        claimId: 'c1',
        documentId: 'doc1',
        notes: '[hospital_bill] Final tax invoice',
      );
      expect(docWithBracket.category, 'hospital_bill');

      const docWithoutBracket = ClaimDocumentModel(
        id: 'd2',
        userId: 'u1',
        claimId: 'c1',
        documentId: 'doc2',
        documentType: 'pharmacy_bills',
      );
      expect(docWithoutBracket.category, 'pharmacy_bills');
    });
  });

  group('Preparation Progress & Readiness Calculation Tests', () {
    test('calculatePreparationProgress assigns proportional weight', () {
      // 1. Completely blank claim -> 0%
      const blankClaim = ClaimModel(
        id: 'c1',
        userId: 'u1',
        policyId: 'pol_1',
        claimName: '',
        status: 'preparing',
      );
      expect(
        calculatePreparationProgress(
          claim: blankClaim,
          attachedDocumentsCount: 0,
        ),
        0,
      );

      // 2. Claim with details filled (policy, hospital, admission, expense) -> 25%
      const detailedClaim = ClaimModel(
        id: 'c2',
        userId: 'u1',
        policyId: 'pol_1',
        claimName: 'Knee Replacement',
        insuredMember: 'Bhavya',
        hospitalName: 'Max Healthcare',
        admissionDate: '2024-11-01',
        estimatedExpense: 50000,
        status: 'preparing',
      );
      expect(
        calculatePreparationProgress(
          claim: detailedClaim,
          attachedDocumentsCount: 0,
        ),
        25,
      );

      // 3. Detailed claim + 1 uploaded document (15% per doc up to 45%)
      expect(
        calculatePreparationProgress(
          claim: detailedClaim,
          attachedDocumentsCount: 1,
        ),
        40, // 25 + 15 = 40
      );

      // 4. Detailed claim + 3 uploaded documents (25% + 45% = 70%)
      expect(
        calculatePreparationProgress(
          claim: detailedClaim,
          attachedDocumentsCount: 3,
        ),
        70,
      );

      // 5. Detailed claim + 3 docs + notes (70% + 15% = 85%)
      final notesClaim = detailedClaim.copyWith(
        notes: 'Submitted claim intimation on portal',
      );
      expect(
        calculatePreparationProgress(
          claim: notesClaim,
          attachedDocumentsCount: 3,
        ),
        85,
      );

      // 6. Detailed claim + 3 docs + notes + evidence reviewed (85% + 15% = 100%)
      expect(
        calculatePreparationProgress(
          claim: notesClaim,
          attachedDocumentsCount: 3,
          hasReviewedEvidence: true,
        ),
        100,
      );
    });

    test('calculateClaimReadiness identifies required and missing documents', () {
      const doc1 = ClaimDocumentModel(
        id: 'd1',
        userId: 'u1',
        claimId: 'c1',
        documentId: 'doc1',
        documentType: 'hospital_bill',
      );
      const doc2 = ClaimDocumentModel(
        id: 'd2',
        userId: 'u1',
        claimId: 'c1',
        documentId: 'doc2',
        documentType: 'discharge_summary',
      );

      final readiness = calculateClaimReadiness([doc1, doc2]);

      // Total mandatory documents is 4
      expect(readiness.totalMandatoryCount, 4);
      // Uploaded mandatory documents is 2 (hospital_bill and discharge_summary)
      expect(readiness.uploadedMandatoryCount, 2);
      expect(readiness.score, 50);

      // Verify missing categories contains remaining mandatory ones
      final missingIds =
          readiness.missingMandatoryCategories.map((c) => c.id).toList();
      expect(missingIds, contains('claim_form'));
      expect(missingIds, contains('diagnostic_reports'));
    });

    test('calculateClaimReadiness flags 100% when all mandatory documents uploaded', () {
      const docs = [
        ClaimDocumentModel(
          id: 'd1',
          userId: 'u1',
          claimId: 'c1',
          documentId: 'doc1',
          documentType: 'hospital_bill',
        ),
        ClaimDocumentModel(
          id: 'd2',
          userId: 'u1',
          claimId: 'c1',
          documentId: 'doc2',
          documentType: 'discharge_summary',
        ),
        ClaimDocumentModel(
          id: 'd3',
          userId: 'u1',
          claimId: 'c1',
          documentId: 'doc3',
          documentType: 'claim_form',
        ),
        ClaimDocumentModel(
          id: 'd4',
          userId: 'u1',
          claimId: 'c1',
          documentId: 'doc4',
          documentType: 'diagnostic_reports',
        ),
        ClaimDocumentModel(
          id: 'd5',
          userId: 'u1',
          claimId: 'c1',
          documentId: 'doc5',
          documentType: 'pharmacy_bills', // Optional
        ),
      ];

      final readiness = calculateClaimReadiness(docs);

      expect(readiness.totalMandatoryCount, 4);
      expect(readiness.uploadedMandatoryCount, 4);
      expect(readiness.score, 100);
      expect(readiness.missingMandatoryCategories, isEmpty);
    });
  });

  group('PolicyEvidenceItem Tests', () {
    test('parses PolicyEvidenceItem from API retrieval search JSON', () {
      final json = {
        'id': 'sec_44',
        'policy_id': 'pol_hdfc_01',
        'section_title': 'Room Rent & ICU Expenses',
        'content':
            'Room rent charges are covered up to single private room or 1% of sum insured per day...',
        'page_number': 14,
        'similarity': 0.88,
      };

      final item = PolicyEvidenceItem.fromJson(json);

      expect(item.chunkId, 'sec_44');
      expect(item.policyId, 'pol_hdfc_01');
      expect(item.sectionTitle, 'Room Rent & ICU Expenses');
      expect(item.content, startsWith('Room rent charges'));
      expect(item.pageNumber, 14);
      expect(item.similarity, 0.88);
      expect(item.whyItMatters, contains('Review room category eligibility'));
    });
  });
}
