package uz.ieltsshokh.app;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // FLAG_SECURE blocks screenshots and screen recording at the OS level.
        // Must be set before super.onCreate() on Samsung One UI devices.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);

        super.onCreate(savedInstanceState);
    }
}
