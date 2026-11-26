package com.study.timer;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

public final class TimerStore {
    public static final Object LOCK = new Object();
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("timer",Context.MODE_PRIVATE); }
    public static String read(Context c) { synchronized(LOCK){ return prefs(c).getString("state",""); } }
    /** Compare-and-set prevents stale editor snapshots from overwriting notification actions. */
    public static boolean write(Context c,String json,String expected) {
        synchronized(LOCK) {
            if(!read(c).equals(expected)) return false;
            try {
                JSONObject next=TimerState.parse(json),old=TimerState.parse(expected);
                next.put("rev",old.optLong("rev",0)+1);
                if(!prefs(c).edit().putString("state",next.toString()).commit())return false;
                TimerNotification.refresh(c);
                return true;
            }catch(Exception e){return false;}
        }
    }
    public static String act(Context c,String action,long expectedRev,String expectedId) {
        synchronized(LOCK) {
            try {
                TimerState.Result result=TimerState.apply(TimerState.parse(read(c)),action,System.currentTimeMillis(),expectedRev,expectedId);
                String message=result.message;
                if(result.changed&&!prefs(c).edit().putString("state",result.state.toString()).commit())message="저장하지 못했어요. 다시 시도해 주세요";
                TimerNotification.refresh(c);
                return message;
            }catch(Exception e){return "기록을 읽지 못했어요. 다시 시도해 주세요";}
        }
    }
}
