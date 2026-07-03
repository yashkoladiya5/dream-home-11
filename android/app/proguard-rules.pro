# Flutter engine
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }

# Dream Home 11 MainActivity + MethodChannels
-keep class com.dreamhome11.dream_home_11.MainActivity { *; }
-keep class io.flutter.plugin.common.MethodChannel { *; }
-keep class io.flutter.plugin.common.MethodCall { *; }

# Firebase ML Kit
-keep class com.google.mlkit.** { *; }

# Kotlin metadata
-keepattributes *Annotation*, InnerClasses
-dontnote kotlin.**
-dontwarn kotlin.**

# Keep serialization/deserialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep enum values()/valueOf()
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep performance monitoring classes (used via reflection/riverpod)
-keep class com.dreamhome11.dream_home_11.** { *; }

# Keep Dart/Flutter async and scheduler classes
-keep class dart.** { *; }

# Flutter cache manager (flutter_cache_manager)
-keep class flutter_cache_manager.** { *; }
-keepclassmembers class * extends flutter_cache_manager.CacheManager { *; }

# Keep Riverpod classes from obfuscation
-keep class riverpod.** { *; }
-keep class flutter_riverpod.** { *; }
-keep class hooks_riverpod.** { *; }

# CachedNetworkImage
-keep class cached_network_image.** { *; }

# Dio HTTP client
-keep class dio.** { *; }

# GoRouter
-keep class go_router.** { *; }

# JSON serialization
-keep class * extends json_annotation.JsonSerializable { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# JNA (used by some plugins)
-dontwarn com.sun.jna.**
-dontwarn com.sun.jna.ptr.**
-keep class com.sun.jna.** { *; }
