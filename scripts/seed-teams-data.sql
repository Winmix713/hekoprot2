-- Insert current season
INSERT INTO public.seasons (name, start_date, end_date, is_active) VALUES
('2024/25', '2024-08-01', '2025-05-31', true);

-- Get the season ID for reference
DO $$
DECLARE
    season_uuid UUID;
BEGIN
    SELECT id INTO season_uuid FROM public.seasons WHERE name = '2024/25';
    
    -- Insert Hungarian-style team names into the teams table
    INSERT INTO public.teams (name, short_code, founded, home_stadium, manager) VALUES
    ('Chelsea FC', 'CHE', 1905, 'Stamford Bridge', 'Mauricio Pochettino'),
    ('Manchester Kék', 'MAK', 1880, 'Etihad Stadium', 'Pep Guardiola'),
    ('Everton FC', 'EVE', 1878, 'Goodison Park', 'Sean Dyche'),
    ('Brentford FC', 'BRE', 1889, 'Brentford Community Stadium', 'Thomas Frank'),
    ('Vörös Ördögök', 'VOR', 1878, 'Old Trafford', 'Erik ten Hag'),
    ('Wolverhampton Wanderers', 'WOL', 1877, 'Molineux Stadium', 'Gary O''Neil'),
    ('Aston Oroszlán', 'AOS', 1874, 'Villa Park', 'Unai Emery'),
    ('Crystal Palace FC', 'CRY', 1905, 'Selhurst Park', 'Roy Hodgson'),
    ('Brighton & Hove Albion', 'BHA', 1901, 'American Express Stadium', 'Roberto De Zerbi'),
    ('Liverpool FC', 'LIV', 1892, 'Anfield', 'Jürgen Klopp'),
    ('West Ham United', 'WHU', 1895, 'London Stadium', 'David Moyes'),
    ('Fulham FC', 'FUL', 1879, 'Craven Cottage', 'Marco Silva'),
    ('Tottenham Hotspur', 'TOT', 1882, 'Tottenham Hotspur Stadium', 'Ange Postecoglou'),
    ('London Ágyúk', 'LON', 1886, 'Emirates Stadium', 'Mikel Arteta'),
    ('Newcastle United', 'NEW', 1892, 'St. James'' Park', 'Eddie Howe'),
    ('Nottingham Forest', 'NOT', 1865, 'City Ground', 'Nuno Espírito Santo');

    -- Initialize team stats for the current season
    INSERT INTO public.team_stats (team_id, season_id, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points)
    SELECT t.id, season_uuid, 0, 0, 0, 0, 0, 0, 0, 0
    FROM public.teams t
    WHERE t.is_deleted = false;
END $$;
