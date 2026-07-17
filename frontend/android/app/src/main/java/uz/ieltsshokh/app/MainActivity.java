package uz.ieltsshokh.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.ContentObserver;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private ScreenshotObserver screenshotObserver;
    private static final int REQ_MEDIA_PERM = 1001;

    // Held as a field so we can unregister it in onDestroy (API 34+)
    private Runnable screenshotCaptureCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Layer 1: FLAG_SECURE ──────────────────────────────────────────────
        // Blocks screenshots and screen recording at the OS level for ALL Android
        // versions (API 21+). Power+Volume, ADB screencap, and built-in recorders
        // all produce a black/blank frame instead of the app content.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);

        // ── Layer 2: registerScreenCaptureCallback (Android 14+, API 34) ──────
        // Fires immediately when a screenshot gesture is detected, even before the
        // OS has had a chance to save anything. Shows a warning toast. FLAG_SECURE
        // already ensures the captured frame is black; this adds user feedback.
        if (Build.VERSION.SDK_INT >= 34) {
            screenshotCaptureCallback = () ->
                Toast.makeText(this,
                    "Screenshot is not allowed in IELTSSHOKH.",
                    Toast.LENGTH_SHORT).show();
            registerScreenCaptureCallback(getMainExecutor(), screenshotCaptureCallback::run);
        }

        // Request storage permission for Layer 3 (ContentObserver)
        requestMediaPermissionIfNeeded();
    }

    @Override
    public void onResume() {
        super.onResume();
        // ── Layer 3: ContentObserver ──────────────────────────────────────────
        // Watches MediaStore for new images whose path/name contains "screenshot".
        // This is a fallback for OEM firmware paths (e.g. Samsung Smart Select,
        // Xiaomi partial-screenshot tools) that may bypass FLAG_SECURE at the
        // firmware level on certain devices. Best-effort: deletes the file if
        // the app has storage permission; always shows a warning toast.
        startScreenshotObserver();
    }

    @Override
    public void onPause() {
        super.onPause();
        stopScreenshotObserver();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (Build.VERSION.SDK_INT >= 34 && screenshotCaptureCallback != null) {
            unregisterScreenCaptureCallback(screenshotCaptureCallback::run);
        }
    }

    // ── Permission helper ─────────────────────────────────────────────────────

    private void requestMediaPermissionIfNeeded() {
        String perm = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            ? Manifest.permission.READ_MEDIA_IMAGES
            : Manifest.permission.READ_EXTERNAL_STORAGE;
        if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{perm}, REQ_MEDIA_PERM);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_MEDIA_PERM) {
            // Re-register observer now that we (may) have storage access
            stopScreenshotObserver();
            startScreenshotObserver();
        }
    }

    // ── ContentObserver ───────────────────────────────────────────────────────

    private void startScreenshotObserver() {
        if (screenshotObserver != null) return;
        screenshotObserver = new ScreenshotObserver(new Handler(Looper.getMainLooper()));
        ContentResolver cr = getContentResolver();
        cr.registerContentObserver(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, screenshotObserver);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            cr.registerContentObserver(
                MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL),
                true, screenshotObserver);
        }
    }

    private void stopScreenshotObserver() {
        if (screenshotObserver != null) {
            getContentResolver().unregisterContentObserver(screenshotObserver);
            screenshotObserver = null;
        }
    }

    private class ScreenshotObserver extends ContentObserver {
        ScreenshotObserver(Handler h) { super(h); }

        @Override
        public void onChange(boolean selfChange, Uri uri) {
            if (uri == null) return;
            try {
                String combined = resolveUriInfo(uri);
                if (combined.contains("screenshot")
                        || combined.contains("screen_shot")
                        || combined.contains("screencap")
                        || combined.contains("capture")) {
                    // Best-effort delete (succeeds when storage permission is granted)
                    try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) {}
                    Toast.makeText(MainActivity.this,
                        "Screenshot is not allowed in IELTSSHOKH.",
                        Toast.LENGTH_LONG).show();
                }
            } catch (Exception ignored) {}
        }

        private String resolveUriInfo(Uri uri) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                String[] proj = {
                    MediaStore.Images.Media.DISPLAY_NAME,
                    MediaStore.Images.Media.RELATIVE_PATH
                };
                try (android.database.Cursor c =
                         getContentResolver().query(uri, proj, null, null, null)) {
                    if (c != null && c.moveToFirst()) {
                        int ni = c.getColumnIndex(MediaStore.Images.Media.DISPLAY_NAME);
                        int pi = c.getColumnIndex(MediaStore.Images.Media.RELATIVE_PATH);
                        String name = ni >= 0 ? c.getString(ni) : "";
                        String path = pi >= 0 ? c.getString(pi) : "";
                        return ((name != null ? name : "") + (path != null ? path : "")).toLowerCase();
                    }
                }
            } else {
                String[] proj = { MediaStore.Images.Media.DATA };
                try (android.database.Cursor c =
                         getContentResolver().query(uri, proj, null, null, null)) {
                    if (c != null && c.moveToFirst()) {
                        int di = c.getColumnIndex(MediaStore.Images.Media.DATA);
                        String data = di >= 0 ? c.getString(di) : "";
                        return data != null ? data.toLowerCase() : "";
                    }
                }
            }
            return "";
        }
    }
}
