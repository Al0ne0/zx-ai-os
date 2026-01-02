package com.example.zxaios

import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "linux_bridge"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "execCommand" -> {
                    val args = call.arguments as? Map<*, *>
                    val cmd = args?.get("cmd") as? String ?: ""
                    // TODO: Replace stub with Termux/native integration using Intents
                    val mocked = mapOf("code" to 0, "stdout" to "Mocked exec: $cmd", "stderr" to "")
                    result.success(mocked)
                }
                else -> result.notImplemented()
            }
        }
    }
}
