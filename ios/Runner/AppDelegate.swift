import Flutter
import UIKit
import Foundation

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    let controller = window?.rootViewController as! FlutterViewController
    let channel = FlutterMethodChannel(name: "com.dreamhome11/device_security",
                                       binaryMessenger: controller.binaryMessenger)
    channel.setMethodCallHandler { [weak self] (call, result) in
      if call.method == "checkDeviceIntegrity" {
        let checkResult = self?.performJailbreakCheck() ?? [:]
        result(checkResult)
      } else {
        result(FlutterMethodNotImplemented)
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func performJailbreakCheck() -> [String: Any] {
    var rootIndicators: [String] = []
    var details: [String: Bool] = [:]

    #if targetEnvironment(simulator)
    return ["isRooted": false, "rootIndicators": [], "details": [:]]
    #endif

    let jailbreakPaths = [
      "/Applications/Cydia.app",
      "/Applications/Sileo.app",
      "/Applications/Zebra.app",
      "/Library/MobileSubstrate/MobileSubstrate.dylib",
      "/bin/bash",
      "/bin/sh",
      "/etc/apt/sources.list.d/",
      "/etc/apt",
      "/private/var/lib/apt/",
      "/private/var/lib/cydia/",
      "/private/var/mobile/Library/SBSettings/Themes",
      "/private/var/stash",
      "/private/var/tmp/cydia.log",
      "/System/Library/LaunchDaemons/com.ikey.bbot.plist",
      "/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
      "/usr/libexec/ssh-keysign",
      "/usr/libexec/sftp-server",
      "/usr/libexec/cydia/",
      "/usr/sbin/sshd",
      "/usr/bin/sshd",
      "/var/log/apt/",
      "/var/log/syslog",
      "/var/tmp/cydia.log",
      "/usr/local/bin/brew"
    ]

    let fileManager = FileManager.default
    for path in jailbreakPaths {
      if fileManager.fileExists(atPath: path) {
        rootIndicators.append(path)
        details[path] = true
      }
    }

    let sandboxPath = "/private/jailbreak_test.txt"
    do {
      try "test".write(toFile: sandboxPath, atomically: true, encoding: .utf8)
      try fileManager.removeItem(atPath: sandboxPath)
      rootIndicators.append("sandbox_write")
      details["sandbox_write"] = true
    } catch {
      details["sandbox_write"] = false
    }

    if let env = getenv("DYLD_INSERT_LIBRARIES") {
      let envStr = String(cString: env)
      if !envStr.isEmpty {
        rootIndicators.append("DYLD_INSERT_LIBRARIES")
        details["DYLD_INSERT_LIBRARIES"] = true
      }
    }

    let isRooted = !rootIndicators.isEmpty
    return [
      "isRooted": isRooted,
      "rootIndicators": rootIndicators,
      "details": details
    ]
  }
}
