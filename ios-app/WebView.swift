import SwiftUI
import WebKit

// MARK: - Custom URL scheme handler
//
// Serves bundled files via app:// instead of file://, which avoids the
// WKWebView sandbox-extension errors that block CSS/JS subdirectories
// when loading from file:// URLs on iOS.

private class AppSchemeHandler: NSObject, WKURLSchemeHandler {

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }

        // Resolve the URL path to a file in the app bundle.
        // e.g. app://host/css/style.css  →  subdirectory:"css", file:"style.css"
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let relative = String(path.dropFirst()) // strip leading "/"

        let components = relative.components(separatedBy: "/")
        let filename   = components.last ?? "index.html"
        let name       = (filename as NSString).deletingPathExtension
        let ext        = (filename as NSString).pathExtension
        let subdir     = components.count > 1
                            ? components.dropLast().joined(separator: "/")
                            : nil

        guard let fileURL = Bundle.main.url(
            forResource: name,
            withExtension: ext.isEmpty ? nil : ext,
            subdirectory: subdir
        ) else {
            urlSchemeTask.didFailWithError(URLError(.fileNoSuchFile))
            return
        }

        do {
            let data     = try Data(contentsOf: fileURL)
            let mime     = mimeType(for: ext)
            let response = URLResponse(
                url: url,
                mimeType: mime,
                expectedContentLength: data.count,
                textEncodingName: "utf-8"
            )
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html":        return "text/html"
        case "css":         return "text/css"
        case "js":          return "application/javascript"
        case "json":        return "application/json"
        case "png":         return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "gif":         return "image/gif"
        case "svg":         return "image/svg+xml"
        case "webp":        return "image/webp"
        case "woff":        return "font/woff"
        case "woff2":       return "font/woff2"
        case "ttf":         return "font/ttf"
        default:            return "application/octet-stream"
        }
    }
}

// MARK: - SwiftUI wrapper

struct WebView: UIViewRepresentable {

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // Register the custom scheme — must be done before WKWebView is created.
        config.setURLSchemeHandler(AppSchemeHandler(), forURLScheme: "app")

        // Persistent data store so localStorage survives restarts.
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.backgroundColor = .systemBackground

        // Load via custom scheme — this gives WKWebView a proper origin
        // so localStorage and subdirectory access both work.
        let startURL = URL(string: "app://parkmoments/index.html")!
        webView.load(URLRequest(url: startURL))

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

// MARK: - Preview

#Preview {
    ContentView()
}
