package com.dreamhome11.dream_home_11

import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.dreamhome11/device_security")
            .setMethodCallHandler { call, result ->
                if (call.method == "checkDeviceIntegrity") {
                    val details = mutableMapOf<String, Any>()
                    val rootIndicators = mutableListOf<String>()

                    val suPaths = listOf(
                        "/system/bin/su",
                        "/system/xbin/su",
                        "/sbin/su",
                        "/system/sd/xbin/su",
                        "/data/local/xbin/su",
                        "/data/local/bin/su"
                    )

                    val foundSuPaths = suPaths.filter { File(it).exists() }
                    if (foundSuPaths.isNotEmpty()) {
                        rootIndicators.add("su_binary_found")
                        details["su_binary_paths"] = foundSuPaths
                    } else {
                        details["su_binary_paths"] = emptyList<String>()
                    }

                    val rootPackages = listOf(
                        "com.noshufou.android.su",
                        "com.noshufou.android.su.elite",
                        "eu.chainfire.supersu",
                        "com.koushikdutta.superuser",
                        "com.thirdparty.superuser",
                        "com.topjohnwu.magisk",
                        "com.anggrayudi.android.hide"
                    )

                    val foundPackages = rootPackages.filter {
                        try {
                            packageManager.getPackageInfo(it, 0)
                            true
                        } catch (e: Exception) {
                            false
                        }
                    }
                    if (foundPackages.isNotEmpty()) {
                        rootIndicators.add("root_app_installed")
                        details["root_packages"] = foundPackages
                    } else {
                        details["root_packages"] = emptyList<String>()
                    }

                    val testKeys = Build.TAGS?.contains("test-keys") == true
                    if (testKeys) {
                        rootIndicators.add("test_keys_build")
                    }
                    details["test_keys"] = testKeys

                    val isDebuggable = try {
                        val prop = Class.forName("android.os.SystemProperties")
                        val get = prop.getMethod("get", String::class.java)
                        get.invoke(null, "ro.debuggable") == "1"
                    } catch (e: Exception) {
                        false
                    }
                    if (isDebuggable) {
                        rootIndicators.add("debuggable_build")
                    }
                    details["debuggable"] = isDebuggable

                    val emulatorFiles = listOf(
                        "/system/lib/libbluestacks.so",
                        "/system/lib/libdroid4x.so"
                    )
                    val foundEmulatorFiles = emulatorFiles.filter { File(it).exists() }
                    if (foundEmulatorFiles.isNotEmpty()) {
                        rootIndicators.add("emulator_file_found")
                        details["emulator_files"] = foundEmulatorFiles
                    } else {
                        details["emulator_files"] = emptyList<String>()
                    }

                    val fingerprintGeneric = Build.FINGERPRINT?.startsWith("generic") == true
                    if (fingerprintGeneric) {
                        rootIndicators.add("generic_fingerprint")
                    }
                    details["generic_fingerprint"] = fingerprintGeneric

                    val modelContainsEmulator = Build.MODEL?.contains("google_sdk") == true ||
                        Build.MODEL?.contains("Emulator") == true ||
                        Build.MODEL?.contains("Android SDK built for x86") == true
                    if (modelContainsEmulator) {
                        rootIndicators.add("emulator_model")
                    }
                    details["emulator_model"] = modelContainsEmulator

                    val manufacturerGenymotion = Build.MANUFACTURER?.contains("Genymotion") == true
                    if (manufacturerGenymotion) {
                        rootIndicators.add("genymotion_manufacturer")
                    }
                    details["genymotion_manufacturer"] = manufacturerGenymotion

                    val isRooted = rootIndicators.isNotEmpty()

                    result.success(
                        mapOf(
                            "isRooted" to isRooted,
                            "rootIndicators" to rootIndicators,
                            "details" to details
                        )
                    )
                } else {
                    result.notImplemented()
                }
            }
    }
}
