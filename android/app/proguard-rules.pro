# Flutter specific
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class com.google.firebase.** { *; }
-keep class com.dreamhome11.dream_home_11.MainActivity { *; }

# Keep MethodChannel classes
-keep class io.flutter.plugin.common.MethodChannel { *; }
-keep class io.flutter.plugin.common.MethodCall { *; }

# Keep Firebase ML Kit models
-keep class com.google.mlkit.** { *; }

# Keep Kotlin metadata
-keepattributes *Annotation*, InnerClasses
-dontnote kotlin.**

# Keep serialization/deserialization classes
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
