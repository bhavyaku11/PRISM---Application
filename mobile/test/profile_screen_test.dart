import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/profile/models/profile_model.dart';
import 'package:prism_mobile/features/profile/screens/profile_screen.dart';
import 'package:prism_mobile/features/profile/services/profile_service.dart';

class MockProfileService extends ProfileService {
  ProfileModel? currentProfile;
  bool updateCalled = false;
  String? lastUpdatedName;
  String? lastUpdatedPhone;
  String? lastUpdatedDob;

  MockProfileService(this.currentProfile);

  @override
  Future<ProfileModel?> getProfile() async {
    return currentProfile;
  }

  @override
  Future<ProfileModel> updateProfile({
    required String fullName,
    String? phone,
    String? dateOfBirth,
  }) async {
    updateCalled = true;
    lastUpdatedName = fullName;
    lastUpdatedPhone = phone;
    lastUpdatedDob = dateOfBirth;

    final updated = currentProfile!.copyWith(
      fullName: fullName,
      phone: phone,
      dateOfBirth: dateOfBirth,
    );
    currentProfile = updated;
    return updated;
  }
}

void main() {
  final sampleProfile = ProfileModel(
    id: 'usr_mock_1',
    fullName: 'Bhavya Kumar',
    email: 'bhavya@prism.app',
    phone: '+91 98765 43210',
    dateOfBirth: '1992-05-15',
    createdAt: DateTime(2024, 1, 1),
  );

  group('ProfileScreen Widget Tests', () {
    testWidgets('renders profile header, fields, and account metadata',
        (tester) async {
      final mockService = MockProfileService(sampleProfile);

      await tester.pumpWidget(
        MaterialApp(
          home: ProfileScreen(profileService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Header card
      expect(find.text('BK'), findsOneWidget); // Initials
      expect(find.text('Bhavya Kumar'), findsNWidgets(2)); // Header + textfield
      expect(find.text('bhavya@prism.app'), findsNWidgets(2)); // Header + textfield
      expect(find.text('Verified Policyholder'), findsOneWidget);

      // Personal Information fields
      expect(find.text('Full Name'), findsOneWidget);
      expect(find.text('Account Email'), findsOneWidget);
      expect(find.text('Phone Number (Optional)'), findsOneWidget);
      expect(find.text('Date of Birth (Optional)'), findsOneWidget);
      expect(find.text('+91 98765 43210'), findsOneWidget);
      expect(find.text('1992-05-15'), findsOneWidget);

      // Save Changes button
      expect(find.text('Save Changes'), findsOneWidget);

      // Metadata card
      expect(find.text('Security & Ownership'), findsOneWidget);
      expect(find.text('Member Since'), findsOneWidget);
      expect(find.text('Supabase RLS'), findsOneWidget);
    });

    testWidgets('validation prevents saving empty name', (tester) async {
      final mockService = MockProfileService(sampleProfile);

      await tester.pumpWidget(
        MaterialApp(
          home: ProfileScreen(profileService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Clear the name field
      final nameField = find.widgetWithText(TextFormField, 'Bhavya Kumar');
      await tester.enterText(nameField, '');
      await tester.pumpAndSettle();

      // Tap Save Changes
      await tester.ensureVisible(find.text('Save Changes'));
      await tester.tap(find.text('Save Changes'));
      await tester.pumpAndSettle();

      expect(find.text('Full name must be at least 2 characters'), findsOneWidget);
      expect(mockService.updateCalled, isFalse);
    });

    testWidgets('saves valid updated profile and displays success snackbar',
        (tester) async {
      final mockService = MockProfileService(sampleProfile);

      await tester.pumpWidget(
        MaterialApp(
          home: ProfileScreen(profileService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Enter a new name
      final nameField = find.widgetWithText(TextFormField, 'Bhavya Kumar');
      await tester.enterText(nameField, 'Bhavya V. Kumar');
      await tester.pumpAndSettle();

      // Tap Save Changes
      await tester.ensureVisible(find.text('Save Changes'));
      await tester.tap(find.text('Save Changes'));
      await tester.pumpAndSettle();

      expect(mockService.updateCalled, isTrue);
      expect(mockService.lastUpdatedName, 'Bhavya V. Kumar');
      expect(find.text('Profile updated successfully'), findsOneWidget);
    });

    testWidgets('renders cleanly on 360px screen width without overflow',
        (tester) async {
      tester.view.physicalSize = const Size(360 * 2.0, 800 * 2.0);
      tester.view.devicePixelRatio = 2.0;

      final mockService = MockProfileService(sampleProfile);

      await tester.pumpWidget(
        MaterialApp(
          home: ProfileScreen(profileService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);

      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });
  });
}
