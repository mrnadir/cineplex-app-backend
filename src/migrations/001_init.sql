CREATE EXTENSION IF NOT EXISTS citext;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- user table
CREATE TABLE
    IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email CITEXT NOT NULL UNIQUE,
        avatar TEXT NOT NULL DEFAULT 'https://www.gravatar.com/avatar/?d=mp&s=200',
        password_hash TEXT,
        phone VARCHAR(20),
        is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
            status IN ('active', 'inactive', 'banned', 'deleted')
        ),
        role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
        last_login_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

-- otps schema
CREATE TABLE
    IF NOT EXISTS otps (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        otp_hash VARCHAR(255) NOT NULL,
        purpose VARCHAR(20) NOT NULL CHECK (
            purpose IN (
                'email_verify',
                'phone_verify',
                'forgot_password',
                'delete_account',
                'recovery_account'
            )
        ),
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 5,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_otps_lookup ON otps (user_id, purpose, is_used, expires_at);

-- refresh_tokens table
CREATE TABLE
    IF NOT EXISTS refresh_tokens (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        device_info VARCHAR(255),
        ip_address INET,
        jti VARCHAR(36) UNIQUE NOT NULL,
        city VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_refresh_tokens_lookup ON refresh_tokens (user_id, is_revoked, expires_at);

-- verification_tokens
CREATE TABLE
    IF NOT EXISTS verification_tokens (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        purpose VARCHAR(20) NOT NULL CHECK (
            purpose IN (
                'email_verify',
                'phone_verify',
                'forgot_password',
                'delete_account',
                'recovery_account'
            )
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_verification_tokens_lookup ON verification_tokens (token_hash, purpose, is_used, expires_at);

-- BANNERS
CREATE TABLE
    IF NOT EXISTS banners (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        banner_image TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_news_createAt ON banners (status, created_at);

-- NEWS
CREATE TABLE
    IF NOT EXISTS news (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        news_image TEXT NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_news_status_createAt ON news (created_at, status, created_at DESC);

-- COMMENTS
CREATE TABLE
    IF NOT EXISTS comments (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        news_id BIGINT NOT NULL REFERENCES news (id) ON DELETE CASCADE,
        nick_name VARCHAR(50) NOT NULL,
        email CITEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_comments ON comments (news_id, created_at DESC);

-- MOVIES
CREATE TABLE
    IF NOT EXISTS movies (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        movie_poster TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(10) NOT NULL DEFAULT '2D' CHECK (category IN ('2D', '3D')),
        admin_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        actor TEXT NOT NULL,
        genre VARCHAR(200) NOT NULL,
        release_date DATE NOT NULL,
        duration VARCHAR(20) NOT NULL,
        language VARCHAR(50) NOT NULL,
        synopsis TEXT NOT NULL,
        trailer TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_movies ON movies (status, created_at DESC);

CREATE TABLE
    IF NOT EXISTS theaters (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        admin_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL, -- "Star Cineplex Bashundhara"
        code VARCHAR(20) NULL UNIQUE, -- short code, e.g. "SCB"
        location TEXT NULL, -- address
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_theaters_status ON theaters (status, created_at DESC);

-- SHOWS (movie + theater + date; slots belong to a show)
CREATE TABLE
    IF NOT EXISTS shows (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        admin_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        theater_id BIGINT NOT NULL REFERENCES theaters (id) ON DELETE CASCADE,
        movie_id BIGINT NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
        show_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        CONSTRAINT uq_shows_theater_movie_date UNIQUE (theater_id, movie_id, show_date)
    );

CREATE INDEX idx_shows_lookup ON shows (theater_id, movie_id, show_date);

-- SLOTS (show times for a given show)
CREATE TABLE
    IF NOT EXISTS slots (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        admin_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        show_id BIGINT NOT NULL REFERENCES shows (id) ON DELETE CASCADE,
        slot_time VARCHAR(5) NOT NULL, -- "HH:MM",
        is_active VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (is_active IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        CONSTRAINT uq_slots_show_slot_time UNIQUE (show_id, slot_time)
    );

CREATE INDEX idx_slots_show_active ON slots (show_id, is_active);

-- SEAT TYPES (for a given slot, theater, and show, there can be multiple seat types with different prices)
CREATE TABLE
    IF NOT EXISTS seat_types (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        admin_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        name VARCHAR(20) NOT NULL DEFAULT 'Regular' CHECK (name IN ('Regular', 'VIP', 'Semi Recliner')), -- "Regular", "VIP", "Semi Recliner"
        description TEXT NULL,
        is_active boolean NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS seat_pricings (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        admin_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        slot_id BIGINT NOT NULL REFERENCES slots (id) ON DELETE CASCADE,
        seat_type_id BIGINT NOT NULL REFERENCES seat_types (id) ON DELETE CASCADE,
        price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
        is_active boolean NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        CONSTRAINT uq_seat_pricings_slot_time_seat_type_price UNIQUE (slot_id, seat_type_id, price)
    );

-- BOOKINGS (one row per checkout; seat_labels holds all seats e.g. ARRAY['E6', 'E8'])
-- A screening is uniquely identified by hall + movie + date + time; overlapping seats are blocked.
CREATE TABLE
    IF NOT EXISTS bookings (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        slot_id BIGINT NOT NULL REFERENCES slots (id) ON DELETE CASCADE,
        theater_id BIGINT NOT NULL REFERENCES theaters (id) ON DELETE CASCADE,
        movie_id BIGINT NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
        show_date DATE NOT NULL,
        slot_time VARCHAR(5) NOT NULL, -- "HH:MM"
        booking_ref VARCHAR(40) NOT NULL UNIQUE, -- "BK-20260620-0042"
        seat_labels TEXT[] NOT NULL CHECK (cardinality(seat_labels) > 0),
        total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'pending_payment' CHECK (
            status IN ('pending_payment', 'confirmed', 'cancelled', 'expired')
        ),
        expires_at TIMESTAMPTZ NOT NULL,
        paid_at TIMESTAMPTZ,
        payment_ref VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );