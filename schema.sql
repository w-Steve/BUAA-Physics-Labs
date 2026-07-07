-- Community database for the static experiment site.
-- Run this whole file in Supabase SQL Editor.
-- It intentionally drops old community tables/views and clears test data.

create extension if not exists pgcrypto;

drop view if exists public.reviews_with_likes cascade;
drop view if exists public.visible_reviews cascade;
drop view if exists public.visible_comments cascade;
drop view if exists public.experiment_rating_stats cascade;

drop table if exists public.review_likes cascade;
drop table if exists public.reviews cascade;
drop table if exists public.ratings cascade;
drop table if exists public.comments cascade;
drop table if exists public.experiments cascade;

create table public.experiments (
    id text primary key,
    semester text not null check (semester in ('up', 'down')),
    lesson integer not null,
    title text not null,
    url text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.ratings (
    id uuid primary key default gen_random_uuid(),
    experiment_id text not null references public.experiments(id) on delete cascade,
    rating smallint not null check (rating between 1 and 5),
    status text not null default 'visible' check (status in ('visible', 'hidden')),
    client_ip_hash text,
    created_at timestamptz not null default now()
);

create table public.comments (
    id uuid primary key default gen_random_uuid(),
    experiment_id text not null references public.experiments(id) on delete cascade,
    nickname text not null default '匿名同学' check (char_length(nickname) between 1 and 24),
    content text not null check (char_length(content) between 1 and 200),
    status text not null default 'visible' check (status in ('visible', 'hidden')),
    likes_count integer not null default 0 check (likes_count >= 0),
    client_ip_hash text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_experiments_semester_lesson on public.experiments (semester, lesson, id);
create index idx_ratings_experiment_created on public.ratings (experiment_id, created_at desc);
create index idx_ratings_ip_created on public.ratings (client_ip_hash, created_at desc);
create index idx_comments_experiment_created on public.comments (experiment_id, created_at desc);
create index idx_comments_experiment_likes_created on public.comments (experiment_id, likes_count desc, created_at desc);
create index idx_comments_visible_created on public.comments (status, created_at desc);
create index idx_comments_ip_created on public.comments (client_ip_hash, created_at desc);

create or replace function public.like_comment(target_comment_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    new_count integer;
begin
    update public.comments
    set likes_count = likes_count + 1,
        updated_at = now()
    where id = target_comment_id
      and status = 'visible'
    returning likes_count into new_count;

    if new_count is null then
        raise exception 'comment_not_found';
    end if;

    return new_count;
end;
$$;

create or replace view public.experiment_rating_stats
with (security_invoker = true) as
with rating_stats as (
    select
        experiment_id,
        round(avg(rating)::numeric, 2) as average_rating,
        count(id)::integer as rating_count,
        max(created_at) as latest_rating_at,
        count(id) filter (where rating = 5)::integer as rating_5_count,
        count(id) filter (where rating = 4)::integer as rating_4_count,
        count(id) filter (where rating = 3)::integer as rating_3_count,
        count(id) filter (where rating = 2)::integer as rating_2_count,
        count(id) filter (where rating = 1)::integer as rating_1_count
    from public.ratings
    where status = 'visible'
    group by experiment_id
),
comment_stats as (
    select
        experiment_id,
        count(id)::integer as comment_count,
        max(created_at) as latest_comment_at
    from public.comments
    where status = 'visible'
    group by experiment_id
)
select
    e.id as experiment_id,
    coalesce(rs.average_rating, 0) as average_rating,
    coalesce(rs.rating_count, 0)::integer as rating_count,
    coalesce(cs.comment_count, 0)::integer as comment_count,
    greatest(
        coalesce(rs.latest_rating_at, '-infinity'::timestamptz),
        coalesce(cs.latest_comment_at, '-infinity'::timestamptz)
    ) as latest_activity_at,
    coalesce(rs.rating_5_count, 0)::integer as rating_5_count,
    coalesce(rs.rating_4_count, 0)::integer as rating_4_count,
    coalesce(rs.rating_3_count, 0)::integer as rating_3_count,
    coalesce(rs.rating_2_count, 0)::integer as rating_2_count,
    coalesce(rs.rating_1_count, 0)::integer as rating_1_count
from public.experiments e
left join rating_stats rs on rs.experiment_id = e.id
left join comment_stats cs on cs.experiment_id = e.id
where e.is_active = true;

create or replace view public.visible_comments
with (security_invoker = true) as
select
    id,
    experiment_id,
    nickname,
    content,
    likes_count,
    status,
    created_at,
    updated_at
from public.comments
where status = 'visible';

alter table public.experiments enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;

create policy "Public can read active experiments"
on public.experiments
for select
to anon
using (is_active = true);

create policy "Public can read visible ratings"
on public.ratings
for select
to anon
using (status = 'visible');

create policy "Public can create ratings"
on public.ratings
for insert
to anon
with check (
    status = 'visible'
    and rating between 1 and 5
);

create policy "Public can read visible comments"
on public.comments
for select
to anon
using (status = 'visible');

create policy "Public can create comments"
on public.comments
for insert
to anon
with check (
    status = 'visible'
    and char_length(nickname) between 1 and 24
    and char_length(content) between 1 and 200
);

grant select on public.experiments to anon;
grant select on public.ratings to anon;
grant insert on public.ratings to anon;
grant select on public.comments to anon;
grant insert on public.comments to anon;
grant execute on function public.like_comment(uuid) to anon;
grant select on public.experiment_rating_stats to anon;
grant select on public.visible_comments to anon;

insert into public.experiments (id, semester, lesson, title, url) values
    ('1-1', 'up', 1, '1-1', 'experiments/1-1.html'),
    ('2-1', 'up', 2, '2-1', 'experiments/2-1.html'),
    ('2-2', 'up', 2, '2-2', 'experiments/2-2.html'),
    ('2-3', 'up', 2, '2-3', 'experiments/2-3.html'),
    ('3-1', 'up', 3, '3-1', 'experiments/3-1.html'),
    ('3-2', 'up', 3, '3-2', 'experiments/3-2.html'),
    ('4-1', 'up', 4, '4-1', 'experiments/4-1.html'),
    ('4-2', 'up', 4, '4-2', 'experiments/4-2.html'),
    ('5-1', 'up', 5, '5-1', 'experiments/5-1.html'),
    ('5-2', 'up', 5, '5-2', 'experiments/5-2.html'),
    ('5-3', 'up', 5, '5-3', 'experiments/5-3.html'),
    ('6-1', 'up', 6, '6-1', 'experiments/6-1.html'),
    ('6-2', 'up', 6, '6-2', 'experiments/6-2.html'),
    ('6-3', 'up', 6, '6-3', 'experiments/6-3.html'),
    ('6-4', 'up', 6, '6-4', 'experiments/6-4.html'),
    ('7-1', 'up', 7, '7-1', 'experiments/7-1.html'),
    ('9-1', 'down', 9, '9-1', 'experiments/9-1.html'),
    ('9-2', 'down', 9, '9-2', 'experiments/9-2.html'),
    ('10-1', 'down', 10, '10-1', 'experiments/10-1.html'),
    ('10-2', 'down', 10, '10-2', 'experiments/10-2.html'),
    ('11-1', 'down', 11, '11-1', 'experiments/11-1.html'),
    ('11-2', 'down', 11, '11-2', 'experiments/11-2.html'),
    ('12-1', 'down', 12, '12-1', 'experiments/12-1.html'),
    ('12-2', 'down', 12, '12-2', 'experiments/12-2.html'),
    ('13-1', 'down', 13, '13-1', 'experiments/13-1.html'),
    ('13-2', 'down', 13, '13-2', 'experiments/13-2.html'),
    ('about', 'up', 0, 'about', 'about.html');
