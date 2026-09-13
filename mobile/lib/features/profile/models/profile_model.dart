class ProfileModel {
  final String id;
  final String? fullName;
  final String email;
  final String? avatarUrl;
  final String? phone;
  final String? dateOfBirth;
  final String? preferredLanguage;
  final String? country;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ProfileModel({
    required this.id,
    this.fullName,
    required this.email,
    this.avatarUrl,
    this.phone,
    this.dateOfBirth,
    this.preferredLanguage,
    this.country,
    this.createdAt,
    this.updatedAt,
  });

  factory ProfileModel.fromJson(
    Map<String, dynamic> json, {
    String fallbackEmail = '',
  }) {
    return ProfileModel(
      id: json['id'] as String? ?? '',
      fullName: json['full_name'] as String?,
      email: json['email'] as String? ?? fallbackEmail,
      avatarUrl: json['avatar_url'] as String?,
      phone: json['phone'] as String?,
      dateOfBirth: json['date_of_birth'] as String?,
      preferredLanguage: json['preferred_language'] as String?,
      country: json['country'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'avatar_url': avatarUrl,
      'phone': phone,
      'date_of_birth': dateOfBirth,
      'preferred_language': preferredLanguage,
      'country': country,
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  ProfileModel copyWith({
    String? id,
    String? fullName,
    String? email,
    String? avatarUrl,
    String? phone,
    String? dateOfBirth,
    String? preferredLanguage,
    String? country,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProfileModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      phone: phone ?? this.phone,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      country: country ?? this.country,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get displayName {
    if (fullName != null && fullName!.trim().isNotEmpty) {
      return fullName!.trim();
    }
    if (email.isNotEmpty && email.contains('@')) {
      return email.split('@').first;
    }
    return 'Policyholder';
  }

  String get initials {
    final name = displayName;
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (name.isNotEmpty) {
      return name[0].toUpperCase();
    }
    return 'P';
  }
}
