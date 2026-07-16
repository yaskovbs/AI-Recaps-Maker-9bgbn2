-- Phases 5-7: push delivery, analytics, achievements, XP, challenges and leaderboard.
ALTER TABLE public.video_tasks DROP CONSTRAINT IF EXISTS video_tasks_status_check;
ALTER TABLE public.video_tasks ADD CONSTRAINT video_tasks_status_check CHECK(status IN('pending','downloading','processing','summarizing','converting_3d','completed','error','cancelled','expired'));
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL, p256dh text NOT NULL, auth text NOT NULL, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated
  USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK(type IN ('recap_complete','weekly_digest','learning_insight','credit_milestone','achievement')),
  title text NOT NULL, body text NOT NULL, url text NOT NULL DEFAULT '/', metadata jsonb NOT NULL DEFAULT '{}',
  delivered_at timestamptz, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notification events" ON public.notification_events FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY "Users mark own notifications read" ON public.notification_events FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, xp integer NOT NULL DEFAULT 0 CHECK(xp>=0),
  level integer NOT NULL DEFAULT 1 CHECK(level>=1), streak integer NOT NULL DEFAULT 0 CHECK(streak>=0),
  last_activity_date date, leaderboard_opt_in boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, achievement_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0, unlocked_at timestamptz, PRIMARY KEY(user_id,achievement_id)
);
CREATE TABLE IF NOT EXISTS public.daily_challenge_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, challenge_date date NOT NULL DEFAULT current_date,
  challenge_id text NOT NULL, progress integer NOT NULL DEFAULT 0, completed_at timestamptz, PRIMARY KEY(user_id,challenge_date,challenge_id)
);
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own gamification profile" ON public.gamification_profiles FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY "Users update own leaderboard preference" ON public.gamification_profiles FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY "Users read own achievements" ON public.user_achievements FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY "Users read own challenges" ON public.daily_challenge_progress FOR SELECT TO authenticated USING(auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.record_gamification_event(p_user_id uuid,p_event text,p_amount integer DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE recap_count integer; new_xp integer:=0; current_streak integer;
BEGIN
  INSERT INTO gamification_profiles(user_id) VALUES(p_user_id) ON CONFLICT DO NOTHING;
  UPDATE gamification_profiles SET
    streak=CASE WHEN last_activity_date=current_date THEN streak WHEN last_activity_date=current_date-1 THEN streak+1 ELSE 1 END,
    last_activity_date=current_date,updated_at=now() WHERE user_id=p_user_id;
  SELECT streak INTO current_streak FROM gamification_profiles WHERE user_id=p_user_id;
  IF current_streak>=3 THEN
    INSERT INTO user_achievements(user_id,achievement_id,progress,unlocked_at) VALUES(p_user_id,'daily_streak_3',LEAST(current_streak,3),now())
    ON CONFLICT(user_id,achievement_id) DO UPDATE SET progress=EXCLUDED.progress,unlocked_at=COALESCE(user_achievements.unlocked_at,EXCLUDED.unlocked_at);
    IF current_streak=3 THEN new_xp:=new_xp+75;END IF;
  END IF;
  IF p_event='recap_complete' THEN
    new_xp:=new_xp+25; SELECT count(*) INTO recap_count FROM video_tasks WHERE user_id=p_user_id AND status='completed';
    IF recap_count=1 THEN new_xp:=new_xp+50;ELSIF recap_count=10 THEN new_xp:=new_xp+100;ELSIF recap_count=50 THEN new_xp:=new_xp+250;END IF;
    INSERT INTO daily_challenge_progress(user_id,challenge_id,progress,completed_at) VALUES(p_user_id,'create_recap',1,now())
      ON CONFLICT(user_id,challenge_date,challenge_id) DO UPDATE SET progress=LEAST(daily_challenge_progress.progress+1,1),completed_at=COALESCE(daily_challenge_progress.completed_at,now());
    INSERT INTO user_achievements(user_id,achievement_id,progress,unlocked_at)
    SELECT p_user_id,a.id,LEAST(recap_count,a.target),CASE WHEN recap_count>=a.target THEN now() END
    FROM (VALUES('first_recap',1),('ten_recaps',10),('fifty_recaps',50)) a(id,target)
    ON CONFLICT(user_id,achievement_id) DO UPDATE SET progress=EXCLUDED.progress,unlocked_at=COALESCE(user_achievements.unlocked_at,EXCLUDED.unlocked_at);
  ELSIF p_event='rewarded_ad' THEN new_xp:=new_xp+5;
    INSERT INTO daily_challenge_progress(user_id,challenge_id,progress,completed_at) VALUES(p_user_id,'rewarded_ad',1,now())
      ON CONFLICT(user_id,challenge_date,challenge_id) DO UPDATE SET progress=1,completed_at=COALESCE(daily_challenge_progress.completed_at,now());
  ELSIF p_event='rating' THEN new_xp:=new_xp+10;
  END IF;
  UPDATE gamification_profiles SET xp=xp+new_xp,level=GREATEST(1,floor(sqrt((xp+new_xp)/100.0))::int+1),updated_at=now() WHERE user_id=p_user_id;
END $$;
REVOKE ALL ON FUNCTION public.record_gamification_event(uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_gamification_event(uuid,text,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.video_task_completion_events() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM record_gamification_event(NEW.user_id,'recap_complete',1);
    INSERT INTO notification_events(user_id,type,title,body,url,metadata)
      VALUES(NEW.user_id,'recap_complete','Your recap is ready',NEW.title||' finished processing.','/my-videos',jsonb_build_object('task_id',NEW.id));
  END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS video_task_completion_events_trigger ON public.video_tasks;
CREATE TRIGGER video_task_completion_events_trigger AFTER UPDATE OF status ON public.video_tasks FOR EACH ROW EXECUTE FUNCTION public.video_task_completion_events();

CREATE OR REPLACE FUNCTION public.get_my_analytics()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT jsonb_build_object(
 'total_recaps',count(*), 'completed_recaps',count(*) FILTER(WHERE status='completed'),
 'failed_recaps',count(*) FILTER(WHERE status='error'),
 'success_rate',COALESCE(round(100.0*count(*) FILTER(WHERE status='completed')/NULLIF(count(*),0),1),0),
 'average_duration_seconds',COALESCE(round(avg(duration_seconds) FILTER(WHERE status='completed')),0),
 'time_saved_seconds',COALESCE(sum(GREATEST(duration_seconds-COALESCE((SELECT sum((x->>'end')::numeric-(x->>'start')::numeric) FROM jsonb_array_elements(COALESCE(clip_plan,'[]')) x),0),0)) FILTER(WHERE status='completed'),0),
 'topics',COALESCE((SELECT jsonb_agg(jsonb_build_object('topic',topic,'count',n) ORDER BY n DESC) FROM (SELECT topic,count(*) n FROM video_tasks v CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(v.key_topics,'[]')) topic WHERE v.user_id=auth.uid() GROUP BY topic LIMIT 10)s),'[]'::jsonb)
) FROM video_tasks WHERE user_id=auth.uid(); $$;
REVOKE ALL ON FUNCTION public.get_my_analytics() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_analytics() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit integer DEFAULT 25)
RETURNS TABLE(user_id uuid,username text,avatar_url text,xp integer,level integer,completed_recaps bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT g.user_id,p.username,p.avatar_url,g.xp,g.level,count(v.id) FROM gamification_profiles g
JOIN user_profiles p ON p.id=g.user_id LEFT JOIN video_tasks v ON v.user_id=g.user_id AND v.status='completed'
WHERE g.leaderboard_opt_in=true GROUP BY g.user_id,p.username,p.avatar_url,g.xp,g.level ORDER BY g.xp DESC,count(v.id) DESC LIMIT LEAST(p_limit,100); $$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon,authenticated;

INSERT INTO gamification_profiles(user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.initialize_gamification_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO gamification_profiles(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS initialize_gamification_profile_trigger ON auth.users;
CREATE TRIGGER initialize_gamification_profile_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.initialize_gamification_profile();

CREATE OR REPLACE FUNCTION public.rewarded_ad_gamification_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NEW.purpose='credit' AND NEW.granted_at IS NOT NULL THEN PERFORM record_gamification_event(NEW.user_id,'rewarded_ad',1); END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS rewarded_ad_gamification_event_trigger ON public.ad_views;
CREATE TRIGGER rewarded_ad_gamification_event_trigger AFTER INSERT ON public.ad_views FOR EACH ROW EXECUTE FUNCTION public.rewarded_ad_gamification_event();

CREATE OR REPLACE FUNCTION public.rating_gamification_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM record_gamification_event(NEW.user_id,'rating',1);RETURN NEW;END $$;
DROP TRIGGER IF EXISTS rating_gamification_event_trigger ON public.ratings;
CREATE TRIGGER rating_gamification_event_trigger AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.rating_gamification_event();

CREATE OR REPLACE FUNCTION public.credit_milestone_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE earned integer;
BEGIN
 IF NEW.type='reward' THEN SELECT total_earned INTO earned FROM credits_wallet WHERE user_id=NEW.user_id;
  IF earned>0 AND earned%10=0 THEN
   UPDATE credits_wallet SET balance=balance+1,total_earned=total_earned+1,updated_at=now() WHERE user_id=NEW.user_id;
   INSERT INTO credits_transactions(user_id,amount,type,reason,metadata)VALUES(NEW.user_id,1,'bonus','Credit milestone bonus',jsonb_build_object('earned_milestone',earned));
   INSERT INTO notification_events(user_id,type,title,body,url)VALUES(NEW.user_id,'credit_milestone','Credit milestone reached','You earned a bonus credit.','/wallet');
  END IF;
 END IF;RETURN NEW;END $$;
DROP TRIGGER IF EXISTS credit_milestone_event_trigger ON public.credits_transactions;
CREATE TRIGGER credit_milestone_event_trigger AFTER INSERT ON public.credits_transactions FOR EACH ROW EXECUTE FUNCTION public.credit_milestone_event();
