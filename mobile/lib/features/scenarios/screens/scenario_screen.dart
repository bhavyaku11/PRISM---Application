import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class ScenarioScreen extends StatelessWidget {
  const ScenarioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Scenario Analysis'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: PrismTheme.primaryBlue.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.calculate_outlined,
                    size: 40, color: PrismTheme.primaryBlue),
              ),
              const SizedBox(height: 16),
              const Text(
                'Treatment Simulation',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: PrismTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Hypothetical hospitalization and procedure cost calculation will be activated in upcoming slices.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 13, color: PrismTheme.textSecondary, height: 1.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
