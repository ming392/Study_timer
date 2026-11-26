//시스템 알림창 이벤트 수신


package com.study.timer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public final class TimerActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent) {
        String message=TimerStore.act(context,intent.getAction(),intent.getLongExtra("rev",-1),intent.getStringExtra("session"));
        if(!message.isEmpty())Toast.makeText(context,message,Toast.LENGTH_SHORT).show();
    }
}
