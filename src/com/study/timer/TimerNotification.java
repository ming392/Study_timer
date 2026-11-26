package com.study.timer;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import org.json.JSONObject;

public final class TimerNotification {
    private static final String CHANNEL="timer_controls";
    private static final int ID=41;
    private static PendingIntent action(Context c,String action,long rev,String session) {
        Intent i=new Intent(c,TimerActionReceiver.class).setAction(action)
            .setData(Uri.parse("studytimer://control/"+action+"/"+rev+"/"+Uri.encode(session)))
            .putExtra("rev",rev).putExtra("session",session);
        return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    public static void refresh(Context c) {
        synchronized(TimerStore.LOCK) {
            NotificationManager manager=c.getSystemService(NotificationManager.class);
            NotificationChannel channel=new NotificationChannel(CHANNEL,"공부·휴식 측정",NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("알림창에서 공부·휴식 시작 및 중지");
            channel.setSound(null,null);channel.enableVibration(false);channel.setShowBadge(false);
            manager.createNotificationChannel(channel);
            if(Build.VERSION.SDK_INT>=33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
            if(!manager.areNotificationsEnabled())return;
            try {
                JSONObject state=TimerState.parse(TimerStore.read(c)),active=state.optJSONObject("active");
                long rev=state.optLong("rev",0);
                Intent open=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
                PendingIntent content=PendingIntent.getActivity(c,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
                int icon=c.getResources().getIdentifier("ic_timer_notification","drawable",c.getPackageName());
                Notification.Builder b=new Notification.Builder(c,CHANNEL).setSmallIcon(icon)
                    .setColor(Color.rgb(114,155,97)).setContentIntent(content).setOnlyAlertOnce(true)
                    .setOngoing(true).setAutoCancel(false).setCategory(Notification.CATEGORY_STOPWATCH)
                    .setVisibility(Notification.VISIBILITY_PUBLIC);
                if(Build.VERSION.SDK_INT>=29)b.setAllowSystemGeneratedContextualActions(false);
                if(active!=null) {
                    b.setContentTitle(("rest".equals(active.optString("type"))?"휴식":"공부")+" 중")
                        .setContentText("측정 중지 버튼을 누르면 기록돼요")
                        .setWhen(active.getLong("start")).setShowWhen(true).setUsesChronometer(true)
                        .addAction(new Notification.Action.Builder(icon,"측정 중지",action(c,"stop",rev,active.getString("id"))).build());
                } else {
                    b.setContentTitle("공부 시간 측정기 · 대기 중").setContentText("공부 또는 휴식 측정을 시작하세요").setShowWhen(false)
                        .addAction(new Notification.Action.Builder(icon,"공부 시작",action(c,"study",rev,"")).build())
                        .addAction(new Notification.Action.Builder(icon,"휴식 시작",action(c,"rest",rev,"")).build());
                }
                manager.notify(ID,b.build());
            }catch(Exception ignored){ /* Denied notifications must never interrupt saved measurements. */ }
        }
    }
}
