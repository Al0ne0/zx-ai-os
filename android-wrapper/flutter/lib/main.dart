import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/services.dart';

const _linuxChannel = MethodChannel('linux_bridge');

Future<Map<String, dynamic>> execCommand(String cmd) async {
  try {
    final res = await _linuxChannel.invokeMethod('execCommand', {'cmd': cmd});
    if (res is Map) {
      return Map<String, dynamic>.from(res);
    }
    return {'code': 0, 'stdout': res?.toString() ?? '', 'stderr': ''};
  } catch (e) {
    return {'code': 1, 'stdout': '', 'stderr': e.toString()};
  }
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (Platform.isAndroid) {
    WebView.platform = AndroidWebView();
  }
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZX AI OS Wrapper',
      home: Scaffold(
        body: SafeArea(
          child: WebviewContainer(),
        ),
      ),
    );
  }
}

class WebviewContainer extends StatefulWidget {
  @override
  State<WebviewContainer> createState() => _WebviewContainerState();
}

class _WebviewContainerState extends State<WebviewContainer> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('LinuxBridge', onMessageReceived: (msg) async {
        final cmd = msg.message;
        final result = await execCommand(cmd);
        final stdout = result['stdout'] ?? '';
        // Send back to JS via evaluateJavascript
        _controller.runJavaScript('window.__linux_command_result && window.__linux_command_result(${jsonEncode(stdout)})');
      });

    // Load local bundled SPA if available, else a placeholder remote URL
    final localIndex = 'assets/www/index.html';
    if (File(localIndex).existsSync()) {
      _controller.loadRequest(Uri.parse('file:///android_asset/flutter_assets/assets/www/index.html'));
    } else {
      _controller.loadRequest(Uri.parse('https://example.com')); // replace with your deployed site
    }
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: _controller);
  }
}
