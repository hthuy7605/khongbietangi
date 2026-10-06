import { pool, type Db } from '../db';
import { notFound } from '../errors';
import type { DishInput, PlaceInput } from '../schemas';

const DISH_COLS = `d.id, d.name, d.emoji, d.description, d.meals, d.weight, d.is_active AS "isActive",
  ARRAY(SELECT group_id FROM dish_groups WHERE dish_id = d.id ORDER BY group_id) AS "groupIds"`;

const PLACE_COLS = `p.id, p.name, p.district, p.address, p.maps_url AS "mapsUrl", p.lat, p.lng,
  p.price_level AS "priceLevel", to_char(p.open_time, 'HH24:MI') AS "openTime",
  to_char(p.close_time, 'HH24:MI') AS "closeTime", p.image_url AS "imageUrl", p.note, p.weight,
  p.is_active AS "isActive"`;

export async function publicCatalog() {
  const [groups, dishes, places] = await Promise.all([
    pool.query('SELECT id, name, emoji FROM groups ORDER BY sort_order, id'),
    pool.query(
      `SELECT ${DISH_COLS},
         ARRAY(SELECT dp.place_id FROM dish_places dp JOIN places p ON p.id = dp.place_id
               WHERE dp.dish_id = d.id AND p.is_active ORDER BY dp.place_id) AS "placeIds"
       FROM dishes d WHERE d.is_active ORDER BY d.id`,
    ),
    pool.query(`SELECT ${PLACE_COLS} FROM places p WHERE p.is_active ORDER BY p.id`),
  ]);
  const strip = <T extends { isActive?: boolean }>({ isActive: _isActive, ...rest }: T) => rest;
  return { groups: groups.rows, dishes: dishes.rows.map(strip), places: places.rows.map(strip) };
}

export const listGroups = (db: Db = pool) =>
  db.query('SELECT id, name, emoji, sort_order AS "sortOrder" FROM groups ORDER BY sort_order, id').then((r) => r.rows);

export const listDishes = (db: Db = pool) =>
  db
    .query(
      `SELECT ${DISH_COLS},
         ARRAY(SELECT place_id FROM dish_places WHERE dish_id = d.id ORDER BY place_id) AS "placeIds"
       FROM dishes d ORDER BY d.id DESC`,
    )
    .then((r) => r.rows);

export const listPlaces = (db: Db = pool) =>
  db
    .query(
      `SELECT ${PLACE_COLS},
         ARRAY(SELECT dish_id FROM dish_places WHERE place_id = p.id ORDER BY dish_id) AS "dishIds"
       FROM places p ORDER BY p.id DESC`,
    )
    .then((r) => r.rows);

export async function upsertDish(db: Db, id: number | null, i: DishInput): Promise<number> {
  const v = [i.name, i.emoji, i.description, i.meals, i.weight, i.isActive];
  const r =
    id === null
      ? await db.query(
          'INSERT INTO dishes (name, emoji, description, meals, weight, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          v,
        )
      : await db.query(
          'UPDATE dishes SET name=$1, emoji=$2, description=$3, meals=$4, weight=$5, is_active=$6, updated_at=now() WHERE id=$7 RETURNING id',
          [...v, id],
        );
  if (!r.rows[0]) throw notFound('Món không tồn tại');
  const dishId: number = r.rows[0].id;
  await db.query('DELETE FROM dish_groups WHERE dish_id = $1', [dishId]);
  await db.query(
    'INSERT INTO dish_groups (dish_id, group_id) SELECT $1, g FROM unnest($2::int[]) g ON CONFLICT DO NOTHING',
    [dishId, i.groupIds],
  );
  await db.query('DELETE FROM dish_places WHERE dish_id = $1', [dishId]);
  await db.query(
    'INSERT INTO dish_places (dish_id, place_id) SELECT $1, p FROM unnest($2::int[]) p ON CONFLICT DO NOTHING',
    [dishId, i.placeIds],
  );
  return dishId;
}

export async function upsertPlace(db: Db, id: number | null, i: PlaceInput): Promise<number> {
  const v = [i.name, i.district, i.address, i.mapsUrl, i.lat, i.lng, i.priceLevel, i.openTime, i.closeTime, i.imageUrl, i.note, i.weight, i.isActive];
  const r =
    id === null
      ? await db.query(
          `INSERT INTO places (name, district, address, maps_url, lat, lng, price_level, open_time, close_time, image_url, note, weight, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
          v,
        )
      : await db.query(
          `UPDATE places SET name=$1, district=$2, address=$3, maps_url=$4, lat=$5, lng=$6, price_level=$7,
             open_time=$8, close_time=$9, image_url=$10, note=$11, weight=$12, is_active=$13, updated_at=now()
           WHERE id=$14 RETURNING id`,
          [...v, id],
        );
  if (!r.rows[0]) throw notFound('Quán không tồn tại');
  const placeId: number = r.rows[0].id;
  await db.query('DELETE FROM dish_places WHERE place_id = $1', [placeId]);
  await db.query(
    'INSERT INTO dish_places (dish_id, place_id) SELECT d, $1 FROM unnest($2::int[]) d ON CONFLICT DO NOTHING',
    [placeId, i.dishIds],
  );
  return placeId;
}

export async function stats() {
  const r = await pool.query(
    `SELECT (SELECT count(*) FROM dishes)::int AS dishes,
            (SELECT count(*) FROM places)::int AS places,
            (SELECT count(*) FROM suggestions WHERE status = 'pending')::int AS pending,
            (SELECT count(*) FROM suggestions WHERE created_at > now() - interval '7 days')::int AS "weekSuggestions"`,
  );
  return r.rows[0];
}
