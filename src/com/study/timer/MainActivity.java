//앱 실행 및 WebView와 Java 연결


package com.study.timer;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.view.WindowInsets;
import android.graphics.Color;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    //WebView class 객체 생성
    private WebView web;
    private final android.content.SharedPreferences.OnSharedPreferenceChangeListener stateListener = (prefs,key) -> {
        if("state".equals(key))runOnUiThread(this::refreshWeb);
    };
    private void refreshWeb() {
        if(web!=null)web.evaluateJavascript("window.refreshFromDevice && window.refreshFromDevice()",null);
    }
    @Override protected void onResume() {
        super.onResume();
        getSharedPreferences("timer",MODE_PRIVATE).registerOnSharedPreferenceChangeListener(stateListener);
        TimerNotification.refresh(this);refreshWeb();
    }
    @Override protected void onPause() {
        getSharedPreferences("timer",MODE_PRIVATE).unregisterOnSharedPreferenceChangeListener(stateListener);
        super.onPause();
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(code,permissions,results);
        if(code==41)TimerNotification.refresh(this);
    }


    public class Storage {
        @JavascriptInterface public String read() {
            return TimerStore.read(MainActivity.this);
        }
        @JavascriptInterface public boolean write(String json,String expected) {
            return TimerStore.write(MainActivity.this,json,expected);
        }
        @JavascriptInterface public String act(String action,long revision,String session) {
            return TimerStore.act(MainActivity.this,action,revision,session);
        }
    }


    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(Color.rgb(250,249,246));
        getWindow().setNavigationBarColor(Color.rgb(250,249,246));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        //web 생성
        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setBackgroundColor(Color.rgb(250,249,246));

        //JavaScript 실행 허용
        web.getSettings().setJavaScriptEnabled(true);

        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);

        //JavaScript와 Java가 연결되는 부분
        web.addJavascriptInterface(new Storage(), "DeviceStore");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return true; }
        });
        // Pad a native parent, not WebView: this changes the actual web viewport.
        FrameLayout safeArea = new FrameLayout(this);
        safeArea.setBackgroundColor(Color.rgb(250,249,246));
        safeArea.addView(web, new FrameLayout.LayoutParams(-1, -1));
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            safeArea.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                // The parent has handled these insets; avoid double application in WebView.
                return WindowInsets.CONSUMED;
            });
        } else {
            safeArea.setFitsSystemWindows(true);
        }
        setContentView(safeArea);
        safeArea.requestApplyInsets();

        //assets/index.html 을 WebView에 불러옴
        web.loadUrl("file:///android_asset/index.html");
        if(android.os.Build.VERSION.SDK_INT>=33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED
            && !getSharedPreferences("timer",MODE_PRIVATE).getBoolean("notificationAsked",false)) {
            getSharedPreferences("timer",MODE_PRIVATE).edit().putBoolean("notificationAsked",true).apply();
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},41);
        }
        TimerNotification.refresh(this);
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("window.goBack ? window.goBack() : false", value -> {
            if (!"true".equals(value)) moveTaskToBack(true);
        });
    }
}
