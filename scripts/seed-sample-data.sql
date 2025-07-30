-- Insert sample admin user (password: admin123)
INSERT INTO public.users (email, full_name, hashed_password, role) VALUES
('admin@footballprediction.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', 'admin'),
('viewer@footballprediction.com', 'Viewer User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', 'viewer');

-- Get season and team IDs for sample data
DO $$
DECLARE
    season_uuid UUID;
    che_id UUID;
    mak_id UUID;
    eve_id UUID;
    bre_id UUID;
    vor_id UUID;
    wol_id UUID;
    aos_id UUID;
    cry_id UUID;
    bha_id UUID;
    liv_id UUID;
    whu_id UUID;
    ful_id UUID;
    tot_id UUID;
    lon_id UUID;
    new_id UUID;
    not_id UUID;
    admin_id UUID;
BEGIN
    -- Get season ID
    SELECT id INTO season_uuid FROM public.seasons WHERE name = '2024/25';
    
    -- Get team IDs
    SELECT id INTO che_id FROM public.teams WHERE short_code = 'CHE';
    SELECT id INTO mak_id FROM public.teams WHERE short_code = 'MAK';
    SELECT id INTO eve_id FROM public.teams WHERE short_code = 'EVE';
    SELECT id INTO bre_id FROM public.teams WHERE short_code = 'BRE';
    SELECT id INTO vor_id FROM public.teams WHERE short_code = 'VOR';
    SELECT id INTO wol_id FROM public.teams WHERE short_code = 'WOL';
    SELECT id INTO aos_id FROM public.teams WHERE short_code = 'AOS';
    SELECT id INTO cry_id FROM public.teams WHERE short_code = 'CRY';
    SELECT id INTO bha_id FROM public.teams WHERE short_code = 'BHA';
    SELECT id INTO liv_id FROM public.teams WHERE short_code = 'LIV';
    SELECT id INTO whu_id FROM public.teams WHERE short_code = 'WHU';
    SELECT id INTO ful_id FROM public.teams WHERE short_code = 'FUL';
    SELECT id INTO tot_id FROM public.teams WHERE short_code = 'TOT';
    SELECT id INTO lon_id FROM public.teams WHERE short_code = 'LON';
    SELECT id INTO new_id FROM public.teams WHERE short_code = 'NEW';
    SELECT id INTO not_id FROM public.teams WHERE short_code = 'NOT';
    
    -- Get admin user ID
    SELECT id INTO admin_id FROM public.users WHERE email = 'admin@footballprediction.com';

    -- Insert sample finished matches
    INSERT INTO public.matches (home_team_id, away_team_id, season_id, match_date, home_goals, away_goals, status, winner, attendance, referee) VALUES
    (mak_id, che_id, season_uuid, '2024-01-20 15:30:00+00', 2, 1, 'finished', 'home', 52000, 'Michael Oliver'),
    (liv_id, lon_id, season_uuid, '2024-01-21 17:30:00+00', 3, 1, 'finished', 'home', 54000, 'Anthony Taylor'),
    (tot_id, vor_id, season_uuid, '2024-01-22 20:00:00+00', 1, 1, 'finished', 'draw', 62000, 'Paul Tierney'),
    (aos_id, new_id, season_uuid, '2024-01-23 19:45:00+00', 2, 0, 'finished', 'home', 42000, 'Simon Hooper'),
    (bha_id, wol_id, season_uuid, '2024-01-24 18:30:00+00', 1, 2, 'finished', 'away', 31000, 'Jarred Gillett'),
    (ful_id, cry_id, season_uuid, '2024-01-25 20:15:00+00', 0, 0, 'finished', 'draw', 25000, 'David Coote'),
    (eve_id, whu_id, season_uuid, '2024-01-26 16:00:00+00', 3, 2, 'finished', 'home', 39000, 'Craig Pawson'),
    (not_id, bre_id, season_uuid, '2024-01-27 14:30:00+00', 1, 3, 'finished', 'away', 30000, 'Robert Jones');

    -- Insert upcoming matches
    INSERT INTO public.matches (home_team_id, away_team_id, season_id, match_date, status) VALUES
    (che_id, liv_id, season_uuid, '2024-02-03 16:30:00+00', 'scheduled'),
    (vor_id, mak_id, season_uuid, '2024-02-04 17:00:00+00', 'scheduled'),
    (lon_id, tot_id, season_uuid, '2024-02-04 14:00:00+00', 'scheduled'),
    (new_id, bha_id, season_uuid, '2024-02-05 20:00:00+00', 'scheduled'),
    (wol_id, aos_id, season_uuid, '2024-02-06 19:45:00+00', 'scheduled'),
    (cry_id, eve_id, season_uuid, '2024-02-07 18:30:00+00', 'scheduled'),
    (whu_id, ful_id, season_uuid, '2024-02-08 20:15:00+00', 'scheduled'),
    (bre_id, not_id, season_uuid, '2024-02-09 16:00:00+00', 'scheduled');

    -- Insert sample ML models
    INSERT INTO public.models (name, version, algorithm, parameters, features, accuracy, precision_score, recall_score, f1_score, is_active, notes, created_by) VALUES
    ('RandomForest', 'v2.1', 'Random Forest', 
     '{"n_estimators": 100, "max_depth": 10, "random_state": 42}',
     '["home_form", "away_form", "head_to_head", "goal_difference", "home_advantage"]',
     87.2, 85.4, 89.1, 87.2, true, 'Primary prediction model', admin_id),
    ('NeuralNetwork', 'v1.3', 'Neural Network',
     '{"hidden_layers": [64, 32, 16], "activation": "relu", "optimizer": "adam"}',
     '["home_form", "away_form", "head_to_head", "goal_difference", "home_advantage", "recent_transfers", "injury_list"]',
     84.1, 82.3, 86.2, 84.1, false, 'Deep learning model', admin_id),
    ('Ensemble', 'v1.0', 'Ensemble',
     '{"models": ["RandomForest", "LogisticRegression", "XGBoost"], "voting": "soft"}',
     '["home_form", "away_form", "head_to_head", "goal_difference", "home_advantage", "weather", "referee_bias"]',
     89.5, 88.1, 91.2, 89.5, false, 'Combined model approach', admin_id);

    -- Insert training logs
    INSERT INTO public.training_logs (model_id, started_at, completed_at, status, accuracy_achieved, training_samples, validation_samples, duration, training_config) VALUES
    ((SELECT id FROM public.models WHERE name = 'RandomForest' AND version = 'v2.1'),
     '2024-01-28 10:00:00+00', '2024-01-28 10:45:00+00', 'completed', 87.2, 1247, 312, '45 minutes',
     '{"train_test_split": 0.8, "cross_validation": 5, "feature_selection": "auto"}'),
    ((SELECT id FROM public.models WHERE name = 'NeuralNetwork' AND version = 'v1.3'),
     '2024-01-25 09:00:00+00', '2024-01-25 11:15:00+00', 'completed', 84.1, 1156, 289, '2 hours 15 minutes',
     '{"epochs": 100, "batch_size": 32, "early_stopping": true}'),
    ((SELECT id FROM public.models WHERE name = 'Ensemble' AND version = 'v1.0'),
     '2024-01-23 14:00:00+00', '2024-01-23 14:12:00+00', 'failed', null, 0, 0, '12 minutes',
     '{"ensemble_method": "voting", "base_models": 3}');

END $$;
