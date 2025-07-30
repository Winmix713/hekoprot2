import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.pipeline import Pipeline
import joblib
import os
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timedelta
import logging

from app.core.config import settings
from app.models.database import Match, Team, TeamStats, Model
from app.services.statistics_service import statistics_service
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

class EnhancedMLService:
    """Enhanced ML service with PHP statistical features integrated"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        
    async def prepare_enhanced_features(self, db: AsyncSession, match_id: str = None, matches: List[Match] = None) -> pd.DataFrame:
        """Prepare enhanced features including PHP-style statistics"""
        try:
            if matches is None:
                result = await db.execute(
                    select(Match).where(Match.id == match_id)
                )
                matches = [result.scalar_one()]
            
            features_list = []
            
            for match in matches:
                # Basic features from original ML service
                basic_features = await self._calculate_basic_features(db, match)
                
                # Enhanced statistical features from PHP system
                enhanced_features = await self._calculate_enhanced_features(db, match)
                
                # Combine all features
                all_features = {**basic_features, **enhanced_features}
                features_list.append(all_features)
            
            return pd.DataFrame(features_list)
            
        except Exception as e:
            logger.error(f"Error preparing enhanced features: {str(e)}")
            raise
    
    async def _calculate_basic_features(self, db: AsyncSession, match: Match) -> Dict[str, float]:
        """Calculate basic features (from original ML service)"""
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
        
        features = {}
        
        if home_stats and away_stats:
            features.update({
                'home_points': home_stats.points,
                'away_points': away_stats.points,
                'points_difference': home_stats.points - away_stats.points,
                'home_goals_for': home_stats.goals_for,
                'home_goals_against': home_stats.goals_against,
                'away_goals_for': away_stats.goals_for,
                'away_goals_against': away_stats.goals_against,
                'home_goal_difference': home_stats.goal_difference,
                'away_goal_difference': away_stats.goal_difference,
                'home_win_rate': home_stats.wins / home_stats.matches_played if home_stats.matches_played > 0 else 0,
                'away_win_rate': away_stats.wins / away_stats.matches_played if away_stats.matches_played > 0 else 0,
            })
        else:
            # Default values
            for key in ['home_points', 'away_points', 'points_difference', 'home_goals_for', 
                       'home_goals_against', 'away_goals_for', 'away_goals_against',
                       'home_goal_difference', 'away_goal_difference', 'home_win_rate', 'away_win_rate']:
                features[key] = 0.0
        
        return features
    
    async def _calculate_enhanced_features(self, db: AsyncSession, match: Match) -> Dict[str, float]:
        """Calculate enhanced features using PHP-style statistics"""
        features = {}
        
        try:
            # Form indices (PHP-style)
            home_form = await statistics_service.calculate_form_index(db, str(match.home_team_id), match.match_date)
            away_form = await statistics_service.calculate_form_index(db, str(match.away_team_id), match.match_date)
            
            features['home_form_index'] = home_form
            features['away_form_index'] = away_form
            features['form_difference'] = home_form - away_form
            
            # Expected goals (PHP-style)
            home_expected = await statistics_service.calculate_expected_goals(db, str(match.home_team_id), is_home=True)
            away_expected = await statistics_service.calculate_expected_goals(db, str(match.away_team_id), is_home=False)
            
            features['home_expected_goals'] = home_expected
            features['away_expected_goals'] = away_expected
            features['expected_goals_difference'] = home_expected - away_expected
            
            # Head-to-head statistics
            h2h_stats = await statistics_service.calculate_head_to_head_stats(
                db, str(match.home_team_id), str(match.away_team_id)
            )
            
            features['h2h_home_win_pct'] = h2h_stats['home_win_percentage'] / 100
            features['h2h_away_win_pct'] = h2h_stats['away_win_percentage'] / 100
            features['h2h_draw_pct'] = h2h_stats['draw_percentage'] / 100
            features['h2h_total_matches'] = min(h2h_stats['total_matches'], 10)  # Cap at 10 for normalization
            features['h2h_home_goals_avg'] = h2h_stats['home_goals_avg']
            features['h2h_away_goals_avg'] = h2h_stats['away_goals_avg']
            features['h2h_btts_pct'] = h2h_stats['both_teams_scored_percentage'] / 100
            
            # Both teams to score probability
            btts_prob = await statistics_service.calculate_both_teams_to_score_probability(
                db, str(match.home_team_id), str(match.away_team_id)
            )
            features['btts_probability'] = btts_prob / 100
            
            # Win probabilities from ELO-style calculation
            win_probs = await statistics_service.calculate_win_probabilities(
                db, str(match.home_team_id), str(match.away_team_id)
            )
            features['elo_home_win_prob'] = win_probs['home_win_prob']
            features['elo_draw_prob'] = win_probs['draw_prob']
            features['elo_away_win_prob'] = win_probs['away_win_prob']
            
            # Home advantage factor
            features['home_advantage'] = 1.0
            
            # Season progress (0-1, where 1 is end of season)
            # This could be calculated based on match date vs season dates
            features['season_progress'] = 0.5  # Default mid-season
            
        except Exception as e:
            logger.error(f"Error calculating enhanced features: {str(e)}")
            # Set default values for all enhanced features
            default_features = {
                'home_form_index': 50.0, 'away_form_index': 50.0, 'form_difference': 0.0,
                'home_expected_goals': 1.0, 'away_expected_goals': 1.0, 'expected_goals_difference': 0.0,
                'h2h_home_win_pct': 0.33, 'h2h_away_win_pct': 0.33, 'h2h_draw_pct': 0.33,
                'h2h_total_matches': 0, 'h2h_home_goals_avg': 1.0, 'h2h_away_goals_avg': 1.0,
                'h2h_btts_pct': 0.5, 'btts_probability': 0.5,
                'elo_home_win_prob': 0.33, 'elo_draw_prob': 0.33, 'elo_away_win_prob': 0.33,
                'home_advantage': 1.0, 'season_progress': 0.5
            }
            features.update(default_features)
        
        return features
    
    async def train_enhanced_model(self, db: AsyncSession, model_config: Dict[str, Any]) -> Dict[str, Any]:
        """Train enhanced model with PHP-style features"""
        try:
            # Get training data
            training_matches = await self._get_training_matches(db)
            
            if len(training_matches) < 100:
                raise ValueError("Not enough training data (minimum 100 matches required)")
            
            # Prepare enhanced features and labels
            X = await self.prepare_enhanced_features(db, matches=training_matches)
            y = self._prepare_labels(training_matches)
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Create preprocessing pipeline
            preprocessor = StandardScaler()
            
            # Initialize model based on algorithm
            algorithm = model_config.get('algorithm', 'RandomForest')
            
            if algorithm == 'RandomForest':
                model = RandomForestClassifier(
                    n_estimators=model_config.get('n_estimators', 200),
                    max_depth=model_config.get('max_depth', 15),
                    min_samples_split=model_config.get('min_samples_split', 5),
                    min_samples_leaf=model_config.get('min_samples_leaf', 2),
                    random_state=42,
                    n_jobs=-1
                )
            elif algorithm == 'GradientBoosting':
                model = GradientBoostingClassifier(
                    n_estimators=model_config.get('n_estimators', 100),
                    max_depth=model_config.get('max_depth', 6),
                    learning_rate=model_config.get('learning_rate', 0.1),
                    random_state=42
                )
            elif algorithm == 'LogisticRegression':
                model = LogisticRegression(
                    random_state=42,
                    max_iter=2000,
                    C=model_config.get('C', 1.0)
                )
            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")
            
            # Create pipeline
            pipeline = Pipeline([
                ('scaler', preprocessor),
                ('classifier', model)
            ])
            
            # Hyperparameter tuning (optional)
            if model_config.get('tune_hyperparameters', False):
                pipeline = self._tune_hyperparameters(pipeline, X_train, y_train, algorithm)
            
            # Train model
            pipeline.fit(X_train, y_train)
            
            # Make predictions
            y_pred = pipeline.predict(X_test)
            y_pred_proba = pipeline.predict_proba(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Cross-validation
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='accuracy')
            
            # Feature importance (for tree-based models)
            feature_importance = None
            if hasattr(pipeline.named_steps['classifier'], 'feature_importances_'):
                feature_importance = dict(zip(
                    X.columns, 
                    pipeline.named_steps['classifier'].feature_importances_
                ))
                # Sort by importance
                feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
            
            # Save model
            model_id = model_config.get('model_id')
            model_path = os.path.join(settings.MODEL_STORAGE_PATH, f"enhanced_model_{model_id}.joblib")
            
            os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
            joblib.dump(pipeline, model_path)
            
            # Store in memory for quick access
            self.models[model_id] = pipeline
            
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
                'feature_importance': feature_importance,
                'model_path': model_path,
                'classification_report': classification_report(y_test, y_pred, output_dict=True)
            }
            
        except Exception as e:
            logger.error(f"Error training enhanced model: {str(e)}")
            raise
    
    def _tune_hyperparameters(self, pipeline, X_train, y_train, algorithm: str):
        """Tune hyperparameters using GridSearchCV"""
        param_grids = {
            'RandomForest': {
                'classifier__n_estimators': [100, 200, 300],
                'classifier__max_depth': [10, 15, 20, None],
                'classifier__min_samples_split': [2, 5, 10],
                'classifier__min_samples_leaf': [1, 2, 4]
            },
            'GradientBoosting': {
                'classifier__n_estimators': [50, 100, 200],
                'classifier__max_depth': [3, 6, 9],
                'classifier__learning_rate': [0.01, 0.1, 0.2]
            },
            'LogisticRegression': {
                'classifier__C': [0.1, 1.0, 10.0, 100.0],
                'classifier__penalty': ['l1', 'l2'],
                'classifier__solver': ['liblinear', 'saga']
            }
        }
        
        param_grid = param_grids.get(algorithm, {})
        
        if param_grid:
            grid_search = GridSearchCV(
                pipeline, param_grid, cv=3, scoring='accuracy', n_jobs=-1, verbose=1
            )
            grid_search.fit(X_train, y_train)
            return grid_search.best_estimator_
        
        return pipeline
    
    async def predict_match_enhanced(self, db: AsyncSession, match_id: str, model_id: str) -> Dict[str, Any]:
        """Make enhanced prediction for a single match"""
        try:
            # Load model if not in memory
            if model_id not in self.models:
                await self._load_enhanced_model(model_id)
            
            pipeline = self.models[model_id]
            
            # Prepare enhanced features
            X = await self.prepare_enhanced_features(db, match_id=match_id)
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Make prediction
            prediction = pipeline.predict(X)[0]
            probabilities = pipeline.predict_proba(X)[0]
            
            # Convert prediction to readable format
            winner_map = {0: 'home', 1: 'away', 2: 'draw'}
            predicted_winner = winner_map[prediction]
            
            # Calculate confidence (max probability)
            confidence = max(probabilities)
            
            # Get feature values for analysis
            feature_values = X.iloc[0].to_dict()
            
            # Estimate expected goals using enhanced features
            home_expected_goals = feature_values.get('home_expected_goals', 1.0)
            away_expected_goals = feature_values.get('away_expected_goals', 1.0)
            
            return {
                'predicted_winner': predicted_winner,
                'home_win_probability': probabilities[0],
                'draw_probability': probabilities[2],
                'away_win_probability': probabilities[1],
                'confidence_score': confidence,
                'home_expected_goals': home_expected_goals,
                'away_expected_goals': away_expected_goals,
                'features_used': feature_values,
                'model_type': 'enhanced_ml',
                'btts_probability': feature_values.get('btts_probability', 0.5),
                'form_analysis': {
                    'home_form': feature_values.get('home_form_index', 50.0),
                    'away_form': feature_values.get('away_form_index', 50.0),
                    'form_advantage': feature_values.get('form_difference', 0.0)
                },
                'h2h_analysis': {
                    'home_win_rate': feature_values.get('h2h_home_win_pct', 0.33),
                    'away_win_rate': feature_values.get('h2h_away_win_pct', 0.33),
                    'draw_rate': feature_values.get('h2h_draw_pct', 0.33),
                    'total_matches': feature_values.get('h2h_total_matches', 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Error making enhanced prediction: {str(e)}")
            raise
    
    async def _load_enhanced_model(self, model_id: str):
        """Load enhanced model from disk"""
        try:
            model_path = os.path.join(settings.MODEL_STORAGE_PATH, f"enhanced_model_{model_id}.joblib")
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Enhanced model file not found for model {model_id}")
            
            self.models[model_id] = joblib.load(model_path)
            
            logger.info(f"Enhanced model {model_id} loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading enhanced model {model_id}: {str(e)}")
            raise
    
    async def _get_training_matches(self, db: AsyncSession) -> List[Match]:
        """Get matches for training (finished matches with results)"""
        result = await db.execute(
            select(Match).where(
                Match.status == 'finished',
                Match.winner.isnot(None),
                Match.is_deleted == False,
                Match.home_goals.isnot(None),
                Match.away_goals.isnot(None)
            ).order_by(Match.match_date.desc()).limit(2000)  # More training data
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

# Global enhanced ML service instance
enhanced_ml_service = EnhancedMLService()
