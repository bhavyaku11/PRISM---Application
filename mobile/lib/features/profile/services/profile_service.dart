import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/errors/app_error.dart';
import '../models/profile_model.dart';

/// Manages retrieval and authenticated updates for user profile information.
class ProfileService {
  final SupabaseClient _client;

  ProfileService({SupabaseClient? client})
      : _client = client ?? _getSafeClient();

  static SupabaseClient _getSafeClient() {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return SupabaseClient(
        'https://dummy.supabase.co',
        'dummy-key',
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
    }
  }

  User? get currentUser => _client.auth.currentUser;

  /// Fetches the profile for the authenticated user from Supabase.
  Future<ProfileModel?> getProfile() async {
    final user = currentUser;
    if (user == null) return null;

    final fallbackEmail = user.email ?? '';
    final metaFullName = user.userMetadata?['full_name'] as String?;

    try {
      final res = await _client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      if (res != null) {
        return ProfileModel.fromJson(
          res,
          fallbackEmail: fallbackEmail,
        );
      }

      // If no row exists yet in profiles table, construct from auth session
      return ProfileModel(
        id: user.id,
        fullName: metaFullName,
        email: fallbackEmail,
        createdAt: DateTime.tryParse(user.createdAt),
      );
    } catch (e) {
      // Safe fallback on network or query error
      return ProfileModel(
        id: user.id,
        fullName: metaFullName,
        email: fallbackEmail,
        createdAt: DateTime.tryParse(user.createdAt),
      );
    }
  }

  /// Updates profile information in Supabase profiles table and user metadata.
  Future<ProfileModel> updateProfile({
    required String fullName,
    String? phone,
    String? dateOfBirth,
  }) async {
    final user = currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to update your profile.');
    }

    final trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      throw const ValidationError('Full name must be at least 2 characters long.');
    }

    final trimmedPhone = phone?.trim();
    if (trimmedPhone != null && trimmedPhone.isNotEmpty) {
      final digits = trimmedPhone.replaceAll(RegExp(r'\D'), '');
      if (digits.length < 10) {
        throw const ValidationError('Phone number must be at least 10 digits.');
      }
    }

    final trimmedDob = dateOfBirth?.trim();
    if (trimmedDob != null && trimmedDob.isNotEmpty) {
      final parsed = DateTime.tryParse(trimmedDob);
      if (parsed == null) {
        throw const ValidationError('Invalid date format. Use YYYY-MM-DD.');
      }
      if (parsed.isAfter(DateTime.now())) {
        throw const ValidationError('Date of birth cannot be in the future.');
      }
    }

    final now = DateTime.now();
    final updatePayload = {
      'id': user.id,
      'full_name': trimmedName,
      'phone': trimmedPhone?.isNotEmpty == true ? trimmedPhone : null,
      'date_of_birth': trimmedDob?.isNotEmpty == true ? trimmedDob : null,
      'updated_at': now.toIso8601String(),
    };

    try {
      await _client.from('profiles').upsert(updatePayload);

      // Also update auth user metadata
      try {
        await _client.auth.updateUser(
          UserAttributes(data: {'full_name': trimmedName}),
        );
      } catch (_) {
        // Non-critical if metadata sync fails
      }

      return ProfileModel(
        id: user.id,
        fullName: trimmedName,
        email: user.email ?? '',
        phone: trimmedPhone,
        dateOfBirth: trimmedDob,
        updatedAt: now,
      );
    } catch (e) {
      throw ServerError('Failed to update profile. Please try again.', e);
    }
  }
}
