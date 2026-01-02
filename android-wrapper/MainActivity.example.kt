package com.example.zxaios

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        // Expose a minimal bridge for execCommand (native implementation should
        // call Termux via Intents or execute within a contained runtime).
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun execCommand(cmd: String) {
                // TODO: implement native bridge to Termux or proot
            }
        }, "AndroidLinuxBridge")

        // Load local assets (if you bundle the SPA) or remote URL
        // webView.loadUrl("file:///android_asset/index.html")
        webView.loadUrl("https://your-deployed-site/")
    }
}
