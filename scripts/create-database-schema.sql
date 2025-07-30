-- Enable UUID and extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users (administrators)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: seasons
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., '2024/25'
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  founded INTEGER,
  logo_url TEXT,
  home_stadium TEXT,
  manager TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID NOT NULL REFERENCES public.teams(id),
  away_team_id UUID NOT NULL REFERENCES public.teams(id),
  season_id UUID NOT NULL REFERENCES public.seasons(id),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  home_goals INTEGER,
  away_goals INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  winner TEXT CHECK (winner IN ('home', 'away', 'draw')),
  attendance INTEGER,
  referee TEXT,
  weather_conditions JSONB,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Table: models (ML model metadata)
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  trained_at TIMESTAMP WITH TIME ZONE,
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  is_active BOOLEAN NOT NULL DEFAULT false,
  model_file_path TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

-- Table: prediction_batches
CREATE TABLE public.prediction_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id),
  run_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  description TEXT,
  total_predictions INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id),
  batch_id UUID NOT NULL REFERENCES public.prediction_batches(id),
  predicted_winner TEXT CHECK (predicted_winner IN ('home', 'away', 'draw')),
  home_expected_goals DECIMAL(4,2),
  away_expected_goals DECIMAL(4,2),
  home_win_probability DECIMAL(4,3),
  draw_probability DECIMAL(4,3),
  away_win_probability DECIMAL(4,3),
  confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  result_status TEXT DEFAULT 'pending' CHECK (result_status IN ('pending', 'correct', 'wrong')),
  features_used JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: training_logs
CREATE TABLE public.training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  accuracy_achieved DECIMAL(5,2),
  training_samples INTEGER,
  validation_samples INTEGER,
  duration INTERVAL,
  error_message TEXT,
  training_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: team_stats (aggregated statistics)
CREATE TABLE public.team_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  season_id UUID NOT NULL REFERENCES public.seasons(id),
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  home_wins INTEGER DEFAULT 0,
  home_draws INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_draws INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  form_last_5 TEXT, -- e.g., 'WWDLW'
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, season_id)
);

-- Table: logs (audit trail)
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_team_stats_updated_at
  BEFORE UPDATE ON public.team_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update team stats after match completion
CREATE OR REPLACE FUNCTION public.update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if match status changed to 'finished'
  IF NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished') THEN
    -- Update home team stats
    INSERT INTO public.team_stats (team_id, season_id, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points)
    VALUES (NEW.home_team_id, NEW.season_id, 1, 
            CASE WHEN NEW.winner = 'home' THEN 1 ELSE 0 END,
            CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
            CASE WHEN NEW.winner = 'away' THEN 1 ELSE 0 END,
            COALESCE(NEW.home_goals, 0),
            COALESCE(NEW.away_goals, 0),
            COALESCE(NEW.home_goals, 0) - COALESCE(NEW.away_goals, 0),
            CASE WHEN NEW.winner = 'home' THEN 3 WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END)
    ON CONFLICT (team_id, season_id) DO UPDATE SET
      matches_played = team_stats.matches_played + 1,
      wins = team_stats.wins + CASE WHEN NEW.winner = 'home' THEN 1 ELSE 0 END,
      draws = team_stats.draws + CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
      losses = team_stats.losses + CASE WHEN NEW.winner = 'away' THEN 1 ELSE 0 END,
      goals_for = team_stats.goals_for + COALESCE(NEW.home_goals, 0),
      goals_against = team_stats.goals_against + COALESCE(NEW.away_goals, 0),
      goal_difference = team_stats.goal_difference + (COALESCE(NEW.home_goals, 0) - COALESCE(NEW.away_goals, 0)),
      points = team_stats.points + CASE WHEN NEW.winner = 'home' THEN 3 WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END;

    -- Update away team stats
    INSERT INTO public.team_stats (team_id, season_id, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points)
    VALUES (NEW.away_team_id, NEW.season_id, 1,
            CASE WHEN NEW.winner = 'away' THEN 1 ELSE 0 END,
            CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
            CASE WHEN NEW.winner = 'home' THEN 1 ELSE 0 END,
            COALESCE(NEW.away_goals, 0),
            COALESCE(NEW.home_goals, 0),
            COALESCE(NEW.away_goals, 0) - COALESCE(NEW.home_goals, 0),
            CASE WHEN NEW.winner = 'away' THEN 3 WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END)
    ON CONFLICT (team_id, season_id) DO UPDATE SET
      matches_played = team_stats.matches_played + 1,
      wins = team_stats.wins + CASE WHEN NEW.winner = 'away' THEN 1 ELSE 0 END,
      draws = team_stats.draws + CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
      losses = team_stats.losses + CASE WHEN NEW.winner = 'home' THEN 1 ELSE 0 END,
      goals_for = team_stats.goals_for + COALESCE(NEW.away_goals, 0),
      goals_against = team_stats.goals_against + COALESCE(NEW.home_goals, 0),
      goal_difference = team_stats.goal_difference + (COALESCE(NEW.away_goals, 0) - COALESCE(NEW.home_goals, 0)),
      points = team_stats.points + CASE WHEN NEW.winner = 'away' THEN 3 WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_team_stats_on_match_finish
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_stats();

-- Indexes for performance
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_teams ON public.matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_season ON public.matches(season_id);
CREATE INDEX idx_predictions_match ON public.predictions(match_id);
CREATE INDEX idx_predictions_batch ON public.predictions(batch_id);
CREATE INDEX idx_predictions_status ON public.predictions(result_status);
CREATE INDEX idx_training_logs_model ON public.training_logs(model_id);
CREATE INDEX idx_team_stats_team ON public.team_stats(team_id);
CREATE INDEX idx_team_stats_season ON public.team_stats(season_id);
CREATE INDEX idx_logs_user ON public.logs(user_id);
CREATE INDEX idx_logs_timestamp ON public.logs(timestamp);
CREATE INDEX idx_logs_action ON public.logs(action_type);

-- Row-level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Public policies (open by default for now - can be restricted later)
CREATE POLICY public_users ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_teams ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_matches ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_models ON public.models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_predictions ON public.predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_training_logs ON public.training_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_team_stats ON public.team_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_logs ON public.logs FOR ALL USING (true) WITH CHECK (true);

-- Realtime support
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.predictions REPLICA IDENTITY FULL;
ALTER TABLE public.training_logs REPLICA IDENTITY FULL;
ALTER TABLE public.team_stats REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_stats;
