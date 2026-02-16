import 'package:flutter/material.dart';

/// Palette de couleurs centralisée pour ASSOSHUB
class AppColors {
  AppColors._();

  // ── Primary ──
  static const Color primary = Color(0xFF6366F1);       // Indigo vif
  static const Color primaryDark = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF818CF8);

  // ── Sidebar / Navigation ──
  static const Color sidebarBg = Color(0xFF0F172A);      // Slate 900
  static const Color sidebarText = Color(0xFF94A3B8);     // Slate 400
  static const Color sidebarActive = Color(0xFFE2E8F0);   // Slate 200
  static const Color sidebarHover = Color(0xFF1E293B);    // Slate 800

  // ── Surfaces ──
  static const Color background = Color(0xFFF8FAFC);      // Slate 50
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFFF1F5F9);     // Slate 100
  static const Color card = Color(0xFFFFFFFF);

  // ── Text ──
  static const Color textPrimary = Color(0xFF0F172A);     // Slate 900
  static const Color textSecondary = Color(0xFF64748B);   // Slate 500
  static const Color textMuted = Color(0xFF94A3B8);       // Slate 400

  // ── Status ──
  static const Color success = Color(0xFF10B981);         // Emerald 500
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFF59E0B);         // Amber 500
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFEF4444);           // Red 500
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF3B82F6);            // Blue 500
  static const Color infoLight = Color(0xFFDBEAFE);

  // ── Borders ──
  static const Color border = Color(0xFFE2E8F0);         // Slate 200
  static const Color borderLight = Color(0xFFF1F5F9);    // Slate 100

  // ── Gradient ──
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient sidebarGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
