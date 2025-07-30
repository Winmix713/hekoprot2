import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timedelta
import logging

from app.core.config import settings
from app.models.database import Match, Team, TeamStats, Model
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

class MLService:
    """Machine Learning service for football predictions"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        
    async def prepare_features(self, db: AsyncSession, match_id: str = None, matches: List[Match] = None) -> pd.DataFrame:
        """Prepare features for training or prediction"""
        try:
            if matches is None:
                # Get specific match
                result = await db.execute(
                    select(Match).where(Match.id == match_id)
                )
                matches = [result.scalar_one()]
            
            features_list = []
            
            for match in matches:
                # Get team stats
                home_stats_result = await db.execute(
                    select(TeamStats).where(
                        TeamStats.team_id == match.home_team_id,
                        TeamStats.season_id == match.season_id
                    )
                )
                home_stats = home_stats_result.scalar_one_or_none()
                
                away_stats_result = await db.execute(
                    select(TeamStats).where(
                        TeamStats.team_id == match.away_team_id,
                        TeamStats.season_id == match.season_id
                    )
                )
                away_stats = away_stats_result.scalar_one_or_none()
                
                # Calculate features
                features = await self._calculate_match_features(db, match, home_stats, away_stats)
                features_list.append(features)
            
            return pd.DataFrame(features_list)
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            raise
    
    async def _calculate_match_features(self, db: AsyncSession, match: Match, home_stats: TeamStats, away_stats: TeamStats) -> Dict[str, float]:
        """Calculate features for a single match"""
        features = {}
        
        # Basic team stats features
        if home_stats and away_stats:
            # Points and form
            features['home_points'] = home_stats.points
            features['away_points'] = away_stats.points
            features['points_difference'] = home_stats.points - away_stats.points
            
            # Goal statistics
            features['home_goals_for'] = home_stats.goals_for
            features['home_goals_against'] = home_stats.goals_against
            features['away_goals_for'] = away_stats.goals_for
            features['away_goals_against'] = away_stats.goals_against
            features['home_goal_difference'] = home_stats.goal_difference
            features['away_goal_difference'] = away_stats.goal_difference
            
            # Win rates
            home_matches = home_stats.matches_played
            away_matches = away_stats.matches_played
            
            features['home_win_rate'] = home_stats.wins / home_matches if home_matches > 0 else 0
            features['away_win_rate'] = away_stats.wins / away_matches if away_matches > 0 else 0
            features['home_draw_rate'] = home_stats.draws / home_matches if home_matches > 0 else 0
            features['away_draw_rate'] = away_stats.draws / away_matches if away_matches > 0 else 0
            
            # Goals per match
            features['home_goals_per_match'] = home_stats.goals_for / home_matches if home_matches > 0 else 0
            features['away_goals_per_match'] = away_stats.goals_for / away_matches if away_matches > 0 else 0
            features['home_conceded_per_match'] = home_stats.goals_against / home_matches if home_matches > 0 else 0
            features['away_conceded_per_match'] = away_stats.goals_against / away_matches if away_matches > 0 else 0
            
            # Home/Away specific stats
            features['home_home_win_rate'] = home_stats.home_wins / (home_matches / 2) if home_matches > 0 else 0
            features['away_away_win_rate'] = away_stats.away_wins / (away_matches / 2) if away_matches > 0 else 0
        else:
            # Default values if stats not available
            for key in ['home_points', 'away_points', 'points_difference', 'home_goals_for', 
                       'home_goals_against', 'away_goals_for', 'away_goals_against',
                       'home_goal_difference', 'away_goal_difference', 'home_win_rate',
                       'away_win_rate', 'home_draw_rate', 'away_draw_rate',
                       'home_goals_per_match', 'away_goals_per_match',
                       'home_conceded_per_match', 'away_conceded_per_match',
                       'home_home_win_rate', 'away_away_win_rate']:
                features[key] = 0.0
        
        # Head-to-head features
        h2h_features = await self._get_head_to_head_features(db, match.home_team_id, match.away_team_id)
        features.update(h2h_features)
        
        # Recent form features
        home_form = await self._get_recent_form(db, match.home_team_id, match.match_date)
        away_form = await self._get_recent_form(db, match.away_team_id, match.match_date)
        features['home_recent_form'] = home_form
        features['away_recent_form'] = away_form
        
        # Home advantage
        features['home_advantage'] = 1.0  # Simple home advantage indicator
        
        return features
    
    async def _get_head_to_head_features(self, db: AsyncSession, home_team_id: str, away_team_id: str) -> Dict[str, float]:
        """Get head-to-head statistics between two teams"""
        try:
            # Get last 5 matches between these teams
            h2h_result = await db.execute(
                select(Match).where(
                    ((Match.home_team_id == home_team_id) & (Match.away_team_id == away_team_id)) |
                    ((Match.home_team_id == away_team_id) & (Match.away_team_id == home_team_id)),
                    Match.status == 'finished'
                ).order_by(Match.match_date.desc()).limit(5)
            )
            h2h_matches = h2h_result.scalars().all()
            
            if not h2h_matches:
                return {
                    'h2h_home_wins': 0.0,
                    'h2h_away_wins': 0.0,
                    'h2h_draws': 0.0,
                    'h2h_home_goals_avg': 0.0,
                    'h2h_away_goals_avg': 0.0
                }
            
            home_wins = 0
            away_wins = 0
            draws = 0
            home_goals_total = 0
            away_goals_total = 0
            
            for match in h2h_matches:
                if match.home_team_id == home_team_id:
                    # Current home team was home in this H2H match
                    home_goals_total += match.home_goals or 0
                    away_goals_total += match.away_goals or 0
                    
                    if match.winner == 'home':
                        home_wins += 1
                    elif match.winner == 'away':
                        away_wins += 1
                    else:
                        draws += 1
                else:
                    # Current home team was away in this H2H match
                    home_goals_total += match.away_goals or 0
                    away_goals_total += match.home_goals or 0
                    
                    if match.winner == 'away':
                        home_wins += 1
                    elif match.winner == 'home':
                        away_wins += 1
                    else:
                        draws += 1
            
            total_matches = len(h2h_matches)
            
            return {
                'h2h_home_wins': home_wins / total_matches,
                'h2h_away_wins': away_wins / total_matches,
                'h2h_draws': draws / total_matches,
                'h2h_home_goals_avg': home_goals_total / total_matches,
                'h2h_away_goals_avg': away_goals_total / total_matches
            }
            
        except Exception as e:
            logger.error(f"Error getting H2H features: {str(e)}")
            return {
                'h2h_home_wins': 0.0,
                'h2h_away_wins': 0.0,
                'h2h_draws': 0.0,
                'h2h_home_goals_avg': 0.0,
                'h2h_away_goals_avg': 0.0
            }
    
    async def _get_recent_form(self, db: AsyncSession, team_id: str, before_date: datetime) -> float:
        """Get recent form score for a team (last 5 matches)"""
        try:
            recent_matches_result = await db.execute(
                select(Match).where(
                    ((Match.home_team_id == team_id) | (Match.away_team_id == team_id)),
                    Match.match_date < before_date,
                    Match.status == 'finished'
                ).order_by(Match.match_date.desc()).limit(5)
            )
            recent_matches = recent_matches_result.scalars().all()
            
            if not recent_matches:
                return 0.0
            
            points = 0
            for match in recent_matches:
                if match.home_team_id == team_id:
                    # Team was home
                    if match.winner == 'home':
                        points += 3
                    elif match.winner == 'draw':
                        points += 1
                else:
                    # Team was away
                    if match.winner == 'away':
                        points += 3
                    elif match.winner == 'draw':
                        points += 1
            
            # Return form as points per match
            return points / len(recent_matches)
            
        except Exception as e:
            logger.error(f"Error getting recent form: {str(e)}")
            return 0.0
    
    async def train_model(self, db: AsyncSession, model_config: Dict[str, Any]) -> Dict[str, Any]:
        """Train a machine learning model"""
        try:
            # Get training data
            training_matches = await self._get_training_matches(db)
            
            if len(training_matches) < 50:
                raise ValueError("Not enough training data (minimum 50 matches required)")
            
            # Prepare features and labels
            X = await self.prepare_features(db, matches=training_matches)
            y = self._prepare_labels(training_matches)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Initialize model based on algorithm
            algorithm = model_config.get('algorithm', 'RandomForest')
            
            if algorithm == 'RandomForest':
                model = RandomForestClassifier(
                    n_estimators=model_config.get('n_estimators', 100),
                    max_depth=model_config.get('max_depth', 10),
                    random_state=42
                )
            elif algorithm == 'LogisticRegression':
                model = LogisticRegression(
                    random_state=42,
                    max_iter=1000
                )
            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            
            # Save model and scaler
            model_id = model_config.get('model_id')
            model_path = os.path.join(settings.MODEL_STORAGE_PATH, f"model_{model_id}.joblib")
            scaler_path = os.path.join(settings.MODEL_STORAGE_PATH, f"scaler_{model_id}.joblib")
            
            os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
            joblib.dump(model, model_path)
            joblib.dump(scaler, scaler_path)
            
            # Store in memory for quick access
            self.models[model_id] = model
            self.scalers[model_id] = scaler
            
            return {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'features_used': list(X.columns),
                'model_path': model_path
            }
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    async def _get_training_matches(self, db: AsyncSession) -> List[Match]:
        """Get matches for training (finished matches with results)"""
        result = await db.execute(
            select(Match).where(
                Match.status == 'finished',
                Match.winner.isnot(None),
                Match.is_deleted == False
            ).order_by(Match.match_date.desc()).limit(1000)  # Last 1000 matches
        )
        return result.scalars().all()
    
    def _prepare_labels(self, matches: List[Match]) -> np.ndarray:
        """Prepare labels for training"""
        labels = []
        for match in matches:
            if match.winner == 'home':
                labels.append(0)
            elif match.winner == 'away':
                labels.append(1)
            else:  # draw
                labels.append(2)
        return np.array(labels)
    
    async def predict_match(self, db: AsyncSession, match_id: str, model_id: str) -> Dict[str, Any]:
        """Make prediction for a single match"""
        try:
            # Load model if not in memory
            if model_id not in self.models:
                await self._load_model(model_id)
            
            model = self.models[model_id]
            scaler = self.scalers[model_id]
            
            # Prepare features
            X = await self.prepare_features(db, match_id=match_id)
            X_scaled = scaler.transform(X)
            
            # Make prediction
            prediction = model.predict(X_scaled)[0]
            probabilities = model.predict_proba(X_scaled)[0]
            
            # Convert prediction to readable format
            winner_map = {0: 'home', 1: 'away', 2: 'draw'}
            predicted_winner = winner_map[prediction]
            
            # Calculate confidence (max probability)
            confidence = max(probabilities)
            
            # Estimate expected goals (simple heuristic based on features)
            home_expected_goals = self._estimate_goals(X.iloc[0], 'home')
            away_expected_goals = self._estimate_goals(X.iloc[0], 'away')
            
            return {
                'predicted_winner': predicted_winner,
                'home_win_probability': probabilities[0],
                'draw_probability': probabilities[2],
                'away_win_probability': probabilities[1],
                'confidence_score': confidence,
                'home_expected_goals': home_expected_goals,
                'away_expected_goals': away_expected_goals,
                'features_used': X.to_dict('records')[0]
            }
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise
    
    def _estimate_goals(self, features: pd.Series, team: str) -> float:
        """Simple heuristic to estimate expected goals"""
        if team == 'home':
            goals_per_match = features.get('home_goals_per_match', 1.0)
            form = features.get('home_recent_form', 1.0)
            home_advantage = 0.2  # Home advantage boost
        else:
            goals_per_match = features.get('away_goals_per_match', 1.0)
            form = features.get('away_recent_form', 1.0)
            home_advantage = 0.0
        
        # Simple calculation based on historical performance and form
        expected_goals = goals_per_match * (1 + form / 3) + home_advantage
        return max(0.1, min(5.0, expected_goals))  # Clamp between 0.1 and 5.0
    
    async def _load_model(self, model_id: str):
        """Load model and scaler from disk"""
        try:
            model_path = os.path.join(settings.MODEL_STORAGE_PATH, f"model_{model_id}.joblib")
            scaler_path = os.path.join(settings.MODEL_STORAGE_PATH, f"scaler_{model_id}.joblib")
            
            if not os.path.exists(model_path) or not os.path.exists(scaler_path):
                raise FileNotFoundError(f"Model files not found for model {model_id}")
            
            self.models[model_id] = joblib.load(model_path)
            self.scalers[model_id] = joblib.load(scaler_path)
            
            logger.info(f"Model {model_id} loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model {model_id}: {str(e)}")
            raise

# Global ML service instance
ml_service = MLService()
