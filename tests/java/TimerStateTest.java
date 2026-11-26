import com.study.timer.TimerState;
import org.json.JSONObject;

public class TimerStateTest {
    static int checks=0;
    static void ok(boolean value,String message){checks++;if(!value)throw new AssertionError(message);}
    public static void main(String[] args)throws Exception {
        long now=1800000000000L;
        for(String type:new String[]{"study","rest"})for(int elapsed:new int[]{0,1,999,1000,1999,2000,2001,35000}) {
            JSONObject empty=TimerState.parse("");
            TimerState.Result started=TimerState.apply(empty,type,now,0,"");
            ok(started.changed,"start");ok(empty.isNull("active"),"no mutation");
            JSONObject active=started.state.getJSONObject("active");
            ok(type.equals(active.getString("type")),"type");
            String id=active.getString("id");
            ok(!TimerState.apply(started.state,type,now+1,0,"").changed,"double start ignored");
            ok(!TimerState.apply(started.state,"stop",now+elapsed,1,"old-session").changed,"stale stop ignored");
            JSONObject restored=TimerState.parse(started.state.toString());
            TimerState.Result stopped=TimerState.apply(restored,"stop",now+elapsed,1,id);
            ok(stopped.changed&&stopped.state.isNull("active"),"stop after process restart");
            ok(stopped.state.getJSONArray("logs").length()==(elapsed<2000?0:1),"short boundary");
            ok(stopped.message.equals(elapsed<2000?TimerState.SHORT:""),"short toast");
            ok(!TimerState.apply(stopped.state,"stop",now+50000,2,id).changed,"double stop ignored");
            ok(!TimerState.apply(stopped.state,"study",now+50000,0,"").changed,"old idle notification ignored");
            TimerState.Result second=TimerState.apply(stopped.state,"study",now+50000,2,"");
            ok(second.changed,"new session");
            ok(!TimerState.apply(second.state,"stop",now+51000,2,id).changed,"previous stop cannot end next session");
        }
        JSONObject s=TimerState.apply(TimerState.parse(""),"study",now,0,"").state;
        String id=s.getJSONObject("active").getString("id");
        ok(!TimerState.apply(s,"stop",now-1,1,id).changed,"clock reversal preserves session");
        ok(!TimerState.apply(s,"unknown",now,1,id).changed,"unknown action ignored");
        JSONObject withNote=TimerState.parse("{\"logs\":[{\"id\":\"old\",\"type\":\"study\",\"start\":1,\"end\":4000,\"note\":\"memo\"}],\"active\":null}");
        JSONObject next=TimerState.apply(withNote,"rest",now,0,"").state;
        ok(next.getJSONArray("logs").getJSONObject(0).getString("note").equals("memo"),"existing logs preserved");
        System.out.println(checks+" native timer assertions passed.");
    }
}
