-- Up Migration
ALTER TABLE monAn RENAME TO monan_legacy;
ALTER TABLE users RENAME TO users_legacy;

CREATE TABLE groups (
  id         serial PRIMARY KEY,
  name       varchar(60) NOT NULL UNIQUE,
  emoji      varchar(16) NOT NULL DEFAULT '🍽️',
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE dishes (
  id          serial PRIMARY KEY,
  name        varchar(100) NOT NULL,
  emoji       varchar(16) NOT NULL DEFAULT '🍽️',
  description varchar(300),
  meals       text[] NOT NULL DEFAULT '{}',
  weight      smallint NOT NULL DEFAULT 3 CHECK (weight BETWEEN 1 AND 5),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (meals <@ ARRAY['sang','trua','toi','khuya']::text[])
);
CREATE UNIQUE INDEX dishes_name_key ON dishes (lower(name));

CREATE TABLE dish_groups (
  dish_id  int NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  group_id int NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (dish_id, group_id)
);

CREATE TABLE places (
  id          serial PRIMARY KEY,
  name        varchar(120) NOT NULL,
  district    varchar(100) NOT NULL DEFAULT '',
  address     varchar(255) NOT NULL DEFAULT '',
  maps_url    varchar(500),
  lat         double precision CHECK (lat BETWEEN -90 AND 90),
  lng         double precision CHECK (lng BETWEEN -180 AND 180),
  price_level smallint CHECK (price_level BETWEEN 1 AND 3),
  open_time   time,
  close_time  time,
  image_url   varchar(500),
  note        varchar(300),
  weight      smallint NOT NULL DEFAULT 3 CHECK (weight BETWEEN 1 AND 5),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK ((lat IS NULL) = (lng IS NULL)),
  CHECK ((open_time IS NULL) = (close_time IS NULL))
);
CREATE INDEX places_district_idx ON places (district);

CREATE TABLE dish_places (
  dish_id  int NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  place_id int NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  PRIMARY KEY (dish_id, place_id)
);
CREATE INDEX dish_places_place_idx ON dish_places (place_id);

CREATE TABLE suggestions (
  id            serial PRIMARY KEY,
  kind          text NOT NULL CHECK (kind IN ('dish','place','link')),
  payload       jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason varchar(300),
  ip_hash       varchar(64),
  created_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz
);
CREATE INDEX suggestions_status_idx ON suggestions (status, created_at);

CREATE TABLE admins (
  id            serial PRIMARY KEY,
  username      varchar(50) NOT NULL UNIQUE,
  password_hash varchar(100) NOT NULL
);

INSERT INTO groups (name, emoji, sort_order) VALUES
  ('Món nước', '🍜', 1), ('Món khô', '🍚', 2), ('Ăn vặt', '🍢', 3),
  ('Đồ uống', '🧋', 4), ('Tráng miệng', '🍰', 5);

-- Mỗi dòng monAn cũ thành một quán; tên tạm = địa chỉ, priority 0-10 -> trọng số 1-5.
INSERT INTO places (name, district, address, weight)
SELECT COALESCE(NULLIF(trim(address), ''), 'Quán chưa đặt tên'),
       COALESCE(district, ''), COALESCE(address, ''),
       GREATEST(1, LEAST(5, round(COALESCE(priority, 0) / 2.0)))::smallint
FROM monan_legacy ORDER BY id;

-- Down Migration
DROP TABLE admins, suggestions, dish_places, places, dish_groups, dishes, groups;
ALTER TABLE users_legacy RENAME TO users;
ALTER TABLE monan_legacy RENAME TO monAn;
