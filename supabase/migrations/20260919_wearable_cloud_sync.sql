-- ⌚ 스마트워치 클라우드 자동 동기화 및 운동 데이터 저장 스키마
-- Phase 2: Wearable Cloud Webhook & DB Persistence

-- 1. 유저 워치 클라우드 연동 계정 테이블
CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL, -- 'strava', 'garmin', 'apple_health', 'samsung_health'
    provider_athlete_id VARCHAR(100),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    auto_sync_enabled BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- 2. 자동 수신된 운동 활동 테이블
CREATE TABLE IF NOT EXISTS synced_wearable_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    external_activity_id VARCHAR(100) UNIQUE NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    source_device VARCHAR(100), -- 'Galaxy Watch 6', 'Apple Watch Ultra', 'Garmin Forerunner 965'
    distance_km NUMERIC(6, 2) NOT NULL,
    duration_seconds INT NOT NULL,
    avg_speed_kmh NUMERIC(5, 1),
    avg_heart_rate INT,
    max_heart_rate INT,
    elevation_gain_m INT DEFAULT 0,
    route_coordinates JSONB NOT NULL, -- [[lat, lng], ...]
    xp_earned INT NOT NULL,
    fog_revealed BOOLEAN DEFAULT false,
    synced_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_wearable_conn_user ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_act_user ON synced_wearable_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_act_time ON synced_wearable_activities(synced_at DESC);

-- RLS (Row Level Security) 설정
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_wearable_activities ENABLE ROW LEVEL SECURITY;

-- 유저 본인 데이터 조회/수정 정책
CREATE POLICY "Users can manage own wearable connections"
    ON wearable_connections
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view and manage own synced activities"
    ON synced_wearable_activities
    FOR ALL
    USING (auth.uid() = user_id);
