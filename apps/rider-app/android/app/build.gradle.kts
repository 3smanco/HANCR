import java.util.Properties
import java.io.FileInputStream
import java.util.Base64

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

// ─── Signing config (production) ───────────────────────────────────────────
// لا تُلصِق المفاتيح في الـ repo. ضعها في `key.properties` المُتجاهَل في .gitignore.
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

val localPropertiesFile = rootProject.file("local.properties")
val localProperties = Properties()
if (localPropertiesFile.exists()) {
    localProperties.load(FileInputStream(localPropertiesFile))
}

fun localSetting(name: String): String =
    (System.getenv(name) ?: localProperties.getProperty(name) ?: "").trim()

fun dartDefine(name: String): String {
    val encoded = project.findProperty("dart-defines") as? String ?: return ""
    return encoded
        .split(",")
        .mapNotNull {
            runCatching { String(Base64.getDecoder().decode(it)) }.getOrNull()
        }
        .firstOrNull { it.startsWith("$name=") }
        ?.substringAfter("=")
        ?.trim()
        ?: ""
}

val googleMapsApiKey = localSetting("GOOGLE_MAPS_API_KEY")
    .ifEmpty { localSetting("MAPS_API_KEY") }
    .ifEmpty { dartDefine("MAPS_API_KEY") }
    .ifEmpty { dartDefine("MAPS_KEY") }

android {
    namespace = "com.zancr.hancr_rider"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.zancr.hancr_rider"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
        manifestPlaceholders["googleMapsApiKey"] = googleMapsApiKey
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String?
                keyPassword = keystoreProperties["keyPassword"] as String?
                storeFile = keystoreProperties["storeFile"]?.let { file(it as String) }
                storePassword = keystoreProperties["storePassword"] as String?
            }
        }
    }

    buildTypes {
        release {
            // استخدم release signing لو key.properties موجود، وإلا debug (للـ dev)
            signingConfig = if (keystorePropertiesFile.exists())
                signingConfigs.getByName("release")
            else
                signingConfigs.getByName("debug")

            // معطَّل مؤقتاً لتسريع الـ build (R8 يأخذ 20+ دقيقة على Windows)
            // فعِّلها قبل النشر على Play Store
            isMinifyEnabled = false
            isShrinkResources = false
        }
        debug {
            // لا نستخدم suffix — يبقى applicationId واحد للـ demo
            isMinifyEnabled = false
        }
    }

    // Splits معطَّلة للـ demo build (لـ Play Store استخدم AAB)
    // splits { abi { isEnable = false } }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
    implementation("androidx.multidex:multidex:2.0.1")
}
