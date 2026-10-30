# Proguard rules for Damayanti SMS Gateway
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Keep data models used for JSON serialization with Gson
-keep class com.damayanti.smsgateway.data.model.** { *; }

# Keep OkHttp & Gson
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class com.google.gson.** { *; }

# Keep AndroidX Security Crypto
-keep class androidx.security.crypto.** { *; }
