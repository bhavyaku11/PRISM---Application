import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/policies/screens/add_policy_screen.dart';

void main() {
  group('AddPolicyScreen Widget Tests', () {
    testWidgets('renders header, title, supporting text and selection options', (tester) async {
      tester.view.physicalSize = const Size(500, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AddPolicyScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Header and title checks
      expect(find.text('Add Policy'), findsOneWidget);
      expect(find.text('Add your health policy'), findsOneWidget);
      expect(
        find.text('Upload your policy document so PRISM can organize and explain your coverage.'),
        findsOneWidget,
      );

      // Primary selection cards
      expect(find.text('Upload PDF Document'), findsOneWidget);
      expect(find.text('Select official policy schedule or wording PDF (Up to 25 MB)'), findsOneWidget);
      expect(find.text('Scan with Camera'), findsOneWidget);
      expect(find.text('Capture photos of physical policy pages directly'), findsOneWidget);
    });

    testWidgets('renders all policy metadata form fields', (tester) async {
      tester.view.physicalSize = const Size(600, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AddPolicyScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('POLICY DETAILS'), findsOneWidget);
      expect(find.text('Policy Name *'), findsOneWidget);
      expect(find.text('Insurer Company *'), findsOneWidget);
      expect(find.text('Policy Number (Optional)'), findsOneWidget);
      expect(find.text('Insured Member (Optional)'), findsOneWidget);
      expect(find.text('Sum Insured (₹ Optional)'), findsOneWidget);
      expect(find.text('Upload & Start Processing'), findsOneWidget);
    });

    testWidgets('shows validation error when attempting to upload without selecting a file', (tester) async {
      tester.view.physicalSize = const Size(600, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AddPolicyScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Upload & Start Processing without selecting file
      final uploadButton = find.text('Upload & Start Processing');
      await tester.ensureVisible(uploadButton);
      await tester.tap(uploadButton);
      await tester.pumpAndSettle();

      // Verifies client-side validation message
      expect(find.text('Please select a PDF policy document or scan pages with your camera.'), findsOneWidget);
    });

    testWidgets('displays preview card when document is selected and allows removing it', (tester) async {
      tester.view.physicalSize = const Size(600, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      // Sample PDF bytes (%PDF-)
      final samplePdfBytes = Uint8List.fromList([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);

      await tester.pumpWidget(
        MaterialApp(
          home: AddPolicyScreen(
            initialFileName: 'Care_Supreme_Policy.pdf',
            initialFileBytes: samplePdfBytes,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify preview card elements
      expect(find.text('Care_Supreme_Policy.pdf'), findsOneWidget);
      expect(find.text('8 B'), findsOneWidget); // 8 bytes
      expect(find.byTooltip('Remove'), findsOneWidget);

      // Tap Remove button
      await tester.tap(find.byTooltip('Remove'));
      await tester.pumpAndSettle();

      // Preview should be removed, selection options should be displayed
      expect(find.text('Care_Supreme_Policy.pdf'), findsNothing);
      expect(find.text('Upload PDF Document'), findsOneWidget);
    });

    testWidgets('renders cleanly without overflow at 360px width', (tester) async {
      tester.view.physicalSize = const Size(360, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AddPolicyScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Add your health policy'), findsOneWidget);
    });
  });
}
