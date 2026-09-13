import '../../policies/models/policy_model.dart';

class DashboardData {
  final String userName;
  final List<PolicyModel> policies;
  final int activeClaimsCount;
  final int unreadNotificationsCount;
  final bool isLoading;

  DashboardData({
    required this.userName,
    required this.policies,
    required this.activeClaimsCount,
    required this.unreadNotificationsCount,
    this.isLoading = false,
  });

  factory DashboardData.initial() {
    return DashboardData(
      userName: '',
      policies: [],
      activeClaimsCount: 0,
      unreadNotificationsCount: 0,
      isLoading: true,
    );
  }
}
