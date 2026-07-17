# ── Capacitor (required — do not remove) ─────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# ── App classes ───────────────────────────────────────────────────────────────
-keep class uz.ieltsshokh.app.** { *; }

# ── WebView JavaScript bridge ─────────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── AndroidX / standard libs ──────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Stack traces (optional: comment out for full obfuscation) ─────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
