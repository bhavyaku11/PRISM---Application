import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/profile/models/profile_model.dart';

void main() {
  group('ProfileModel Tests', () {
    test('serializes and deserializes correctly from json', () {
      final json = {
        'id': 'usr_uuid_123',
        'full_name': 'Bhavya Kumar',
        'email': 'bhavya@prism.app',
        'avatar_url': 'https://example.com/avatar.png',
        'phone': '+91 9876543210',
        'date_of_birth': '1992-05-15',
        'preferred_language': 'en',
        'country': 'IN',
        'created_at': '2024-01-01T00:00:00.000Z',
        'updated_at': '2024-06-01T00:00:00.000Z',
      };

      final profile = ProfileModel.fromJson(json);

      expect(profile.id, 'usr_uuid_123');
      expect(profile.fullName, 'Bhavya Kumar');
      expect(profile.email, 'bhavya@prism.app');
      expect(profile.phone, '+91 9876543210');
      expect(profile.dateOfBirth, '1992-05-15');
      expect(profile.displayName, 'Bhavya Kumar');
      expect(profile.initials, 'BK');

      final outJson = profile.toJson();
      expect(outJson['full_name'], 'Bhavya Kumar');
      expect(outJson['date_of_birth'], '1992-05-15');
    });

    test('displayName and initials fallback to email when fullName is null', () {
      final profile = ProfileModel(
        id: 'usr_2',
        email: 'rajesh.kumar@example.com',
      );

      expect(profile.displayName, 'rajesh.kumar');
      expect(profile.initials, 'R');
    });

    test('initials compute two letters from first and last name', () {
      final profile = ProfileModel(
        id: 'usr_3',
        fullName: 'Ananya Sharma',
        email: 'ananya@example.com',
      );

      expect(profile.initials, 'AS');
    });

    test('copyWith properly updates properties', () {
      final original = ProfileModel(
        id: 'usr_4',
        fullName: 'Original Name',
        email: 'orig@example.com',
      );

      final updated = original.copyWith(fullName: 'New Name', phone: '9988776655');
      expect(updated.fullName, 'New Name');
      expect(updated.phone, '9988776655');
      expect(updated.email, 'orig@example.com');
      expect(updated.id, 'usr_4');
    });
  });
}
