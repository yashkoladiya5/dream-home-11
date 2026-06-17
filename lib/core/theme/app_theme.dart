import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand & Accent Colors
  static const Color primaryRed = Color(0xFFD22C2C); // Dream11 Red
  static const Color secondarySlate = Color(0xFF1F2937); // Light Slate
  static const Color darkSlate = Color(0xFF121826); // Background Slate
  static const Color emeraldGreen = Color(0xFF10B981); // Point Success
  static const Color goldYellow = Color(0xFFF59E0B); // Premium highlights
  
  // Neutral Colors
  static const Color white = Colors.white;
  static const Color greyLight = Color(0xFFE5E7EB);
  static const Color greyMedium = Color(0xFF9CA3AF);
  static const Color greyDark = Color(0xFF374151);

  // Gradient definitions for premium look
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryRed, Color(0xFF9E1B1B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldYellow, Color(0xFFD97706)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Dark Theme configuration
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: primaryRed,
      scaffoldBackgroundColor: darkSlate,
      appBarTheme: AppBarTheme(
        backgroundColor: darkSlate,
        elevation: 0,
        iconTheme: const IconThemeData(color: white),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20.0,
          fontWeight: FontWeight.w600,
          color: white,
        ),
      ),
      colorScheme: const ColorScheme.dark(
        primary: primaryRed,
        secondary: emeraldGreen,
        surface: secondarySlate,
        error: primaryRed,
        onPrimary: white,
        onSecondary: white,
        onSurface: white,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32.0,
          fontWeight: FontWeight.bold,
          color: white,
        ),
        displayMedium: GoogleFonts.outfit(
          fontSize: 28.0,
          fontWeight: FontWeight.bold,
          color: white,
        ),
        headlineLarge: GoogleFonts.outfit(
          fontSize: 24.0,
          fontWeight: FontWeight.w700,
          color: white,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 20.0,
          fontWeight: FontWeight.w600,
          color: white,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 18.0,
          fontWeight: FontWeight.w600,
          color: white,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 16.0,
          fontWeight: FontWeight.w500,
          color: white,
        ),
        bodyLarge: GoogleFonts.outfit(
          fontSize: 16.0,
          fontWeight: FontWeight.normal,
          color: white,
        ),
        bodyMedium: GoogleFonts.outfit(
          fontSize: 14.0,
          fontWeight: FontWeight.normal,
          color: greyLight,
        ),
        labelLarge: GoogleFonts.outfit(
          fontSize: 14.0,
          fontWeight: FontWeight.bold,
          color: white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRed,
          foregroundColor: white,
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 14.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 16.0,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: secondarySlate,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: const BorderSide(color: greyDark, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: const BorderSide(color: primaryRed, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: const BorderSide(color: primaryRed, width: 1.5),
        ),
        labelStyle: GoogleFonts.outfit(color: greyMedium),
        hintStyle: GoogleFonts.outfit(color: greyMedium),
      ),
      cardTheme: CardThemeData(
        color: secondarySlate,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.0),
        ),
      ),
    );
  }
}
