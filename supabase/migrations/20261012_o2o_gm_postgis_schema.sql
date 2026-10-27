-- ==============================================================================
-- Migration: 20261012_o2o_gm_postgis_schema.sql
-- Description: O2O Game Master Dashboard & PostGIS Anti-Cheat Spatial Architecture
-- ==============================================================================

-- 0. PostGIS Spatial Engine Activation
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------------------------
-- 1. Factions (진영)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factions (
    id VARCHAR(50) PRIMARY KEY,              -- 'makati_tigers', 'bgc_eagles'
    name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(10) NOT NULL,
    current_season_score BIGINT DEFAULT 0,    -- 실시간 원자적(Atomic) 점수 누적
    member_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 진영 기본 시드 데이터 (없을 시 생성)
INSERT INTO factions (id, name, color_hex, current_season_score, member_count)
VALUES 
    ('makati_tigers', 'Makati Tigers', '#F59E0B', 482500, 1420),
    ('bgc_eagles', 'BGC Eagles', '#3B82F6', 519200, 1580)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Users (유저 및 실시간 좌표 PostGIS 네이티브화)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(50) NOT NULL UNIQUE,
    faction_id VARCHAR(50) REFERENCES factions(id) ON DELETE SET NULL,
    gold_balance BIGINT DEFAULT 0 CHECK (gold_balance >= 0),
    total_xp BIGINT DEFAULT 0 CHECK (total_xp >= 0),
    
    -- [Requirement 1] PostGIS Native Point (WGS84: SRID 4326)
    last_location GEOMETRY(Point, 4326),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_last_location ON users USING GIST (last_location);
CREATE INDEX IF NOT EXISTS idx_users_faction_xp ON users (faction_id, total_xp DESC);

-- ------------------------------------------------------------------------------
-- 3. Events (O2O 게릴라 레이드 & 랜드마크 이벤트)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'Raid', -- 'Raid', 'Boss', 'FlashMob'
    location_center GEOMETRY(Point, 4326) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 150,          -- 참여 인정 반경 (m)
    target_distance_km NUMERIC(5, 2) DEFAULT 3.0,    -- 보스 공략 필요 달리기 거리
    reward_gold INT DEFAULT 500,
    reward_xp INT DEFAULT 1000,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',             -- 'ACTIVE', 'COMPLETED', 'EXPIRED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST (location_center);
CREATE INDEX IF NOT EXISTS idx_events_active_window ON events (status, start_time, end_time);

-- ------------------------------------------------------------------------------
-- 4. Event Participants (N:M 참여 & 멱등성 보상 브릿지)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_participants (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    check_in_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    check_in_location GEOMETRY(Point, 4326) NOT NULL,
    contributed_distance_km NUMERIC(6, 2) DEFAULT 0.0,
    
    -- [Requirement 2] 동시성 레이스 컨디션 및 중복 수령 방지
    is_reward_claimed BOOLEAN DEFAULT FALSE NOT NULL,
    reward_claimed_at TIMESTAMPTZ,
    claim_tx_id UUID DEFAULT gen_random_uuid(),
    
    PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_claimed ON event_participants(event_id, is_reward_claimed);

-- ------------------------------------------------------------------------------
-- 5. Activity Logs (러닝 세션 기록 & 안티치트 텔레메트리)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id VARCHAR(50),
    distance_km NUMERIC(6, 2) NOT NULL,
    duration_seconds INT NOT NULL,
    avg_pace VARCHAR(10),
    earned_xp INT DEFAULT 0,
    earned_gold INT DEFAULT 0,
    
    -- [Requirement 3] 세션 시작/종료 위치 지오메트리화
    start_location GEOMETRY(Point, 4326) NOT NULL,
    end_location GEOMETRY(Point, 4326) NOT NULL,
    
    max_speed_kmh NUMERIC(5, 2) NOT NULL,
    avg_speed_kmh NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE WHEN duration_seconds > 0 
             THEN ROUND(((distance_km / (duration_seconds / 3600.0))::numeric), 2)
             ELSE 0 
        END
    ) STORED,
    
    gps_spoofing_flag BOOLEAN DEFAULT FALSE,
    abuse_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_start_location ON activity_logs USING GIST (start_location);
CREATE INDEX IF NOT EXISTS idx_activity_logs_end_location ON activity_logs USING GIST (end_location);
CREATE INDEX IF NOT EXISTS idx_activity_logs_spoofing ON activity_logs (gps_spoofing_flag) WHERE gps_spoofing_flag = TRUE;

-- ------------------------------------------------------------------------------
-- 6. Trigger Function: 세션 내/간 텔레포트 방어 및 원자적 진영 스코어 반영
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_detect_and_process_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_last_location GEOMETRY(Point, 4326);
    v_last_active_at TIMESTAMPTZ;
    v_user_faction_id VARCHAR(50);
    v_inter_distance_meters DOUBLE PRECISION;
    v_time_delta_seconds DOUBLE PRECISION;
    v_inter_speed_kmh DOUBLE PRECISION;
BEGIN
    -- 1. 이전 세션의 최종 위치 및 시간 조회
    SELECT last_location, last_active_at, faction_id
    INTO v_last_location, v_last_active_at, v_user_faction_id
    FROM users
    WHERE id = NEW.user_id;

    -- 2. 세션 내(Intra-session) 속도 이상치 검사
    IF NEW.max_speed_kmh > 45.0 OR NEW.avg_speed_kmh > 30.0 THEN
        NEW.gps_spoofing_flag := TRUE;
        NEW.abuse_reason := format('Abnormal running velocity (Max: %s km/h, Avg: %s km/h)', 
                                   NEW.max_speed_kmh, NEW.avg_speed_kmh);
    END IF;

    -- 3. [Requirement 3] 세션 간(Inter-session) 텔레포트 검사
    IF v_last_location IS NOT NULL AND v_last_active_at IS NOT NULL AND NEW.gps_spoofing_flag = FALSE THEN
        v_inter_distance_meters := ST_Distance(v_last_location::geography, NEW.start_location::geography);
        v_time_delta_seconds := EXTRACT(EPOCH FROM (NEW.created_at - v_last_active_at));

        IF v_time_delta_seconds > 0 THEN
            v_inter_speed_kmh := (v_inter_distance_meters / 1000.0) / (v_time_delta_seconds / 3600.0);

            -- 시내 차량 최대 허용치 80km/h 초과 순간이동 차단 (2km 이상 이동 시 검사)
            IF v_inter_distance_meters > 2000.0 AND v_inter_speed_kmh > 80.0 THEN
                NEW.gps_spoofing_flag := TRUE;
                NEW.abuse_reason := format('Inter-session teleportation detected (Distance: %s m, Time: %s s, Speed: %s km/h)', 
                                           ROUND(v_inter_distance_meters::numeric, 1), 
                                           ROUND(v_time_delta_seconds::numeric, 1), 
                                           ROUND(v_inter_speed_kmh::numeric, 1));
            END IF;
        ELSIF v_inter_distance_meters > 500.0 THEN
            NEW.gps_spoofing_flag := TRUE;
            NEW.abuse_reason := 'Instantaneous teleportation detected (0s elapsed)';
        END IF;
    END IF;

    -- 4. [Requirement 4] 정상 기록일 경우 원자적 점수 반영 및 최종 위치 동기화
    IF NEW.gps_spoofing_flag = FALSE THEN
        UPDATE users
        SET last_location = NEW.end_location,
            last_active_at = NEW.created_at,
            total_xp = total_xp + NEW.earned_xp,
            gold_balance = gold_balance + NEW.earned_gold,
            updated_at = NOW()
        WHERE id = NEW.user_id;

        IF v_user_faction_id IS NOT NULL THEN
            UPDATE factions
            SET current_season_score = current_season_score + NEW.earned_xp,
                updated_at = NOW()
            WHERE id = v_user_faction_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_detect_and_process_activity ON activity_logs;
CREATE TRIGGER trg_detect_and_process_activity
BEFORE INSERT ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION fn_detect_and_process_activity();

-- ------------------------------------------------------------------------------
-- 7. RPC: 동시성 안전(Race-condition Free) 레이드 보상 수령 프로시저
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rpc_claim_event_reward(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_event RECORD;
    v_participant RECORD;
BEGIN
    SELECT * INTO v_event FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event not found');
    END IF;

    -- Row Lock으로 동시 다발적 수령 요청 직렬화
    SELECT * INTO v_participant
    FROM event_participants
    WHERE event_id = p_event_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User did not participate in this event');
    END IF;

    IF v_participant.is_reward_claimed = TRUE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Reward already claimed', 'claim_tx_id', v_participant.claim_tx_id);
    END IF;

    UPDATE event_participants
    SET is_reward_claimed = TRUE,
        reward_claimed_at = NOW()
    WHERE event_id = p_event_id AND user_id = p_user_id;

    UPDATE users
    SET gold_balance = gold_balance + v_event.reward_gold,
        total_xp = total_xp + v_event.reward_xp,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'gold_earned', v_event.reward_gold,
        'xp_earned', v_event.reward_xp,
        'claim_tx_id', v_participant.claim_tx_id
    );
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 8. RPC: GM Live Map Radar 반경 내 러너 및 이벤트 고속 공간 조회
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rpc_get_active_runners_nearby(
    p_lng DOUBLE PRECISION,
    p_lat DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 2000.0
)
RETURNS TABLE (
    user_id UUID,
    nickname VARCHAR(50),
    faction_id VARCHAR(50),
    faction_name VARCHAR(100),
    color_hex VARCHAR(10),
    total_xp BIGINT,
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    last_active_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.nickname,
        u.faction_id,
        COALESCE(f.name, 'Unassigned') AS faction_name,
        COALESCE(f.color_hex, '#94A3B8') AS color_hex,
        u.total_xp,
        ST_X(u.last_location::geometry) AS longitude,
        ST_Y(u.last_location::geometry) AS latitude,
        ST_Distance(u.last_location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_meters,
        u.last_active_at
    FROM users u
    LEFT JOIN factions f ON u.faction_id = f.id
    WHERE u.last_location IS NOT NULL
      AND u.is_banned = FALSE
      AND ST_DWithin(
          u.last_location::geography,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_meters
      )
    ORDER BY distance_meters ASC
    LIMIT 200;
END;
$$ LANGUAGE plpgsql;
