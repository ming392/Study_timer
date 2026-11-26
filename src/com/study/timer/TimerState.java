package com.study.timer;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.UUID;

/** Pure state transitions shared by notification and in-app actions. */
public final class TimerState {
    public static final String SHORT = "시간이 너무 짧아 기록하지 않았어요";
    public static final class Result {
        public final JSONObject state;
        public final boolean changed;
        public final String message;
        Result(JSONObject s, boolean c, String m) {state=s; changed=c; message=m;}
    }
    public static JSONObject parse(String raw) throws JSONException {
        if (raw == null || raw.isEmpty()) return new JSONObject("{\"logs\":[],\"active\":null,\"rev\":0}");
        JSONObject s = new JSONObject(raw);
        if (!(s.opt("logs") instanceof JSONArray)) throw new JSONException("Invalid logs");
        return s;
    }
    public static Result apply(JSONObject source, String action, long now, long expectedRev, String expectedId) throws JSONException {
        JSONObject s = new JSONObject(source.toString());
        JSONObject active = s.optJSONObject("active");
        if ("stop".equals(action)) {
            if (active == null || !active.optString("id").equals(expectedId)) return new Result(s,false,"");
            long start=active.getLong("start");
            if(now<start) return new Result(s,false,"기기 시간을 확인해 주세요");
            boolean shortLog=now-start<2000;
            if(!shortLog) {
                active.put("end",now).put("note","");
                s.getJSONArray("logs").put(active);
            }
            s.put("active",JSONObject.NULL).put("rev",s.optLong("rev",0)+1);
            return new Result(s,true,shortLog?SHORT:"");
        }
        if (!("study".equals(action)||"rest".equals(action))) return new Result(s,false,"");
        if (active!=null || expectedRev!=s.optLong("rev",0)) return new Result(s,false,"");
        JSONArray logs=s.getJSONArray("logs");
        for(int i=0;i<logs.length();i++) {
            if(logs.getJSONObject(i).getLong("end")>now) return new Result(s,false,"기기 시간을 확인해 주세요");
        }
        s.put("active",new JSONObject().put("id",UUID.randomUUID().toString()).put("type",action).put("start",now));
        s.put("rev",s.optLong("rev",0)+1);
        return new Result(s,true,"");
    }
}
