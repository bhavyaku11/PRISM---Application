import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';
import 'package:prism_mobile/features/policies/screens/policy_processing_screen.dart';
import 'package:prism_mobile/features/policies/services/policy_service.dart';
import 'package:prism_mobile/features/policies/services/policy_upload_service.dart';

class MockPolicyService extends PolicyService {
  final PolicyModel? mockPolicy;
  final Map<String, dynamic>? mockDocument;

  MockPolicyService({this.mockPolicy, this.mockDocument});

  @override
  Future<PolicyModel?> getPolicyById(String id) async => mockPolicy;

  @override
  Future<Map<String, dynamic>?> getPolicyDocument(String policyId) async => mockDocument;
}

class MockPolicyUploadService extends PolicyUploadService {
  final Map<String, dynamic>? triggerResponse;
  final Map<String, dynamic>? statusResponse;

  MockPolicyUploadService({this.triggerResponse, this.statusResponse});

  @override
  Future<Map<String, dynamic>> triggerProcessing(String documentId) async =>
      triggerResponse ?? {'processing_status': 'processed', 'page_count': 12, 'pages_with_text': 12, 'sections_detected': 5, 'chunks_created': 24};

  @override
  Future<Map<String, dynamic>> getDocumentStatus(String documentId) async =>
      statusResponse ?? {'processing_status': 'processed'};
}

void main() {
  final samplePolicy = PolicyModel(
    id: 'pol_test_123',
    userId: 'usr_test_456',
    policyName: 'Star Health Premier Insurance',
    insurerName: 'Star Health',
    policyNumber: 'P/12345/2026',
    policyType: 'Health Insurance',
    sumInsured: 1000000,
    premium: 18500,
    status: 'processing',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  );

  final sampleProcessedDoc = {
    'id': 'doc_test_789',
    'policy_id': 'pol_test_123',
    'document_name': 'Star_Health_Policy_Schedule.pdf',
    'file_size': 1245000,
    'page_count': 16,
    'processing_status': 'processed',
    'metadata': {
      'page_count': 16,
      'pages_with_text': 15,
      'pages_without_text': 1,
      'sections_detected': 8,
      'chunks_created': 32,
    },
  };

  group('PolicyProcessingScreen Widget Tests', () {
    testWidgets('renders initial processing state with pipeline steps and supporting text', (tester) async {
      tester.view.physicalSize = const Size(600, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final mockPolicyService = MockPolicyService(
        mockPolicy: samplePolicy,
        mockDocument: {
          'id': 'doc_test_789',
          'policy_id': 'pol_test_123',
          'document_name': 'Star_Health_Policy_Schedule.pdf',
          'file_size': 1245000,
          'processing_status': 'processing',
        },
      );

      final mockUploadService = MockPolicyUploadService(
        triggerResponse: {'processing_status': 'processing'},
        statusResponse: {'processing_status': 'processing'},
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyProcessingScreen(
            policyId: 'pol_test_123',
            initialStatus: 'processing',
            policyService: mockPolicyService,
            uploadService: mockUploadService,
          ),
        ),
      );

      // Pump initial frame
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Header and title
      expect(find.text('Policy Processing'), findsOneWidget);
      expect(find.text('Processing your policy'), findsOneWidget);
      expect(
        find.text('PRISM is organizing your policy so you can explore its coverage, waiting periods, exclusions, and important limits.'),
        findsOneWidget,
      );
      expect(find.text('Processing Policy Document'), findsOneWidget);

      // Ingestion Pipeline Steps
      expect(find.text('PRISM Ingestion Pipeline'), findsOneWidget);
      expect(find.text('PDF Uploaded to Private Storage'), findsOneWidget);
      expect(find.text('Policy & Document Records Created'), findsOneWidget);
      expect(find.text('Page-Aware Extraction & Section Detection'), findsOneWidget);
      expect(find.text('Page-Aware Chunking & Vault Storage'), findsOneWidget);
      expect(find.text('PRISM Evidence Retrieval & Analysis'), findsOneWidget);

      // Navigation actions
      expect(find.text('My Policies'), findsOneWidget);
      expect(find.text('+ Add Another'), findsOneWidget);
    });

    testWidgets('renders completed state with extraction metrics and Explore CTA', (tester) async {
      tester.view.physicalSize = const Size(600, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final mockPolicyService = MockPolicyService(
        mockPolicy: samplePolicy,
        mockDocument: sampleProcessedDoc,
      );

      final mockUploadService = MockPolicyUploadService(
        triggerResponse: {'processing_status': 'processed'},
        statusResponse: {'processing_status': 'processed'},
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyProcessingScreen(
            policyId: 'pol_test_123',
            initialStatus: 'processed',
            policyService: mockPolicyService,
            uploadService: mockUploadService,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Ready headline and badge
      expect(find.text('Your policy is ready for PRISM'), findsOneWidget);
      expect(find.text('Document Processed & Indexed'), findsOneWidget);

      // Metrics card
      expect(find.text('Extraction & Chunking Results'), findsOneWidget);
      expect(find.text('16'), findsOneWidget); // Total Pages
      expect(find.text('Total Pages'), findsOneWidget);
      expect(find.text('15'), findsOneWidget); // Pages with text
      expect(find.text('Pages w/ Text'), findsOneWidget);
      expect(find.text('8'), findsOneWidget); // Sections detected
      expect(find.text('Sections'), findsOneWidget);
      expect(find.text('32'), findsOneWidget); // Chunks created
      expect(find.text('Page Chunks'), findsOneWidget);

      // Explore Policy Details CTA
      expect(find.text('Explore Policy Details'), findsOneWidget);
    });

    testWidgets('renders failed state with error description and retry CTA', (tester) async {
      tester.view.physicalSize = const Size(600, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final mockPolicyService = MockPolicyService(
        mockPolicy: samplePolicy,
        mockDocument: {
          'id': 'doc_test_789',
          'policy_id': 'pol_test_123',
          'document_name': 'Star_Health_Policy_Schedule.pdf',
          'processing_status': 'failed',
          'processing_error': 'PDF contains encrypted text streams that could not be parsed.',
        },
      );

      final mockUploadService = MockPolicyUploadService(
        triggerResponse: {'processing_status': 'failed', 'error': 'Processing failed.'},
        statusResponse: {'processing_status': 'failed'},
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyProcessingScreen(
            policyId: 'pol_test_123',
            initialStatus: 'failed',
            policyService: mockPolicyService,
            uploadService: mockUploadService,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Failed header & message
      expect(find.text('Could not process document'), findsOneWidget);
      expect(find.text('Processing Failed'), findsOneWidget);
      expect(
        find.text('PDF contains encrypted text streams that could not be parsed.'),
        findsOneWidget,
      );

      // Retry button
      expect(find.text('Retry Document Processing'), findsOneWidget);
    });

    testWidgets('renders cleanly without overflow at 360px width', (tester) async {
      tester.view.physicalSize = const Size(360, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final mockPolicyService = MockPolicyService(
        mockPolicy: samplePolicy,
        mockDocument: sampleProcessedDoc,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyProcessingScreen(
            policyId: 'pol_test_123',
            initialStatus: 'processed',
            policyService: mockPolicyService,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(tester.takeException(), isNull);
      expect(find.text('Policy Processing'), findsOneWidget);
    });
  });
}
